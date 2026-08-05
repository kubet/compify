import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import { LimiterService } from '../limiter/limiter.service';
import { User } from 'src/entities/user/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Component } from 'src/entities/project/component.entity';
import { shortIdToUuid } from 'src/common/short-id';
import { Copilot } from 'monacopilot';
import { ProviderService } from './provider.service';
import {
  generationPrompt,
  generateTokensPrompt,
  completionInputPrompt,
  remapFilesPrompt,
  generatePreviewPrompt,
} from './prompts';
import { modelKeywordMap, ModelConfig } from './common/models';
import { getStarterTokens } from './common/ai-helpers';

interface AnthropicContent {
  type: string;
  text?: string;
  source?: {
    type: string;
    media_type: string;
    data: string;
  };
}

@Injectable()
export class AiService {
  private copilot: Copilot;
  private functionMap: Record<
    string,
    (b: any, res: Response, model?: string) => Promise<void>
  >;

  constructor(
    private limiterService: LimiterService,
    private providerService: ProviderService,
    @InjectRepository(Component)
    private componentRepository: Repository<Component>,
  ) {
    // Inline completions run through OpenRouter on the same cheap model as
    // everything else (monacopilot custom-model API).
    this.copilot = new Copilot(process.env.OPENROUTER_API_KEY!, {
      model: {
        config: (apiKey: string, prompt: any) => ({
          endpoint: 'https://openrouter.ai/api/v1/chat/completions',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: {
            model: 'qwen/qwen3.7-flash',
            messages: [
              { role: 'system', content: prompt.system ?? prompt.context ?? '' },
              { role: 'user', content: prompt.user ?? prompt.instruction ?? '' },
            ],
            temperature: 0.2,
            max_tokens: 256,
          },
        }),
        transformResponse: (response: any) => ({
          text: response?.choices?.[0]?.message?.content ?? '',
        }),
      } as any,
    } as any);

    this.functionMap = {
      generateAnthropic: this.generateAnthropic.bind(this),
      generateOpenRouter: this.generateOpenRouter.bind(this),
      generate4oMini: this.generate4oMini.bind(this),
    };
  }

  // Qwen (and other cheap models) wrap JSON in <think> blocks or markdown
  // fences; pull out the first balanced JSON object.
  private extractJson(raw: string): any {
    let text = (raw || '').replace(/<think>[\s\S]*?<\/think>/g, '');
    text = text.replace(/```(?:json)?/gi, '');
    const start = text.indexOf('{');
    if (start === -1) throw new Error('No valid JSON object found in response');
    let depth = 0;
    for (let i = start; i < text.length; i++) {
      if (text[i] === '{') depth++;
      else if (text[i] === '}') {
        depth--;
        if (depth === 0) return JSON.parse(text.slice(start, i + 1));
      }
    }
    throw new Error('No valid JSON object found in response');
  }

  private findKeywords(prompt: string): string[] {
    const promptLower = prompt.toLowerCase();
    return Object.values(modelKeywordMap)
      .flatMap((model) => model.keywords)
      .filter((keyword) => promptLower.includes(keyword));
  }

  private selectBestModel(b: any): string[] {
    const keywords = this.findKeywords(b.prompt);
    const hasImages = b.images && Array.isArray(b.images) && b.images.length > 0;

    // Calculate scores for each model with sophisticated weighting
    const modelScores = Object.entries(modelKeywordMap)
      .filter(([_, config]) => !hasImages || config.imageSupport) // Pre-filter for image support
      .map(([modelName, config]) => {
        let score = 0;
        
        // Advanced keyword scoring with context awareness
        keywords.forEach((keyword) => {
          if (config.keywords.includes(keyword)) {
            const keywordIndex = config.keywords.indexOf(keyword);
            const positionMultiplier = Math.exp(-keywordIndex * 0.2);
            const keywordComplexity = keyword.split(' ').length * 2;
            score += keywordComplexity * positionMultiplier;
          }
        });

        // Model capability scoring
        const capabilityScore = this.calculateCapabilityScore(config, {
          hasImages,
          promptLength: b.prompt?.length || 0,
          codeLength: b.initialCode?.length || 0
        });
        
        score = score * 0.7 + capabilityScore * 0.3; // Weighted combination

        return { modelName, score, capabilities: capabilityScore };
      });

    // Return sorted models with minimum score threshold
    return modelScores
      .sort((a, b) => b.score - a.score)
      .map(model => model.modelName);
  }

  private calculateCapabilityScore(config: ModelConfig, params: {
    hasImages: boolean,
    promptLength: number,
    codeLength: number
  }): number {
    let score = 0;

    // Token efficiency score (normalized between 0 and 1)
    const tokenEfficiency = 1 / (1 + Math.exp(-10000/config.oneCreditTokens));
    score += tokenEfficiency * 0.4;

    // Context length optimization
    const totalLength = params.promptLength + params.codeLength;
    const contextScore = 1 / (1 + Math.exp((totalLength - 4000) / 1000));
    score += contextScore * 0.3;

    // Image handling capability bonus
    if (params.hasImages && config.imageSupport) {
      score += 0.3;
    }

    return score;
  }

  async freeAiModalResponse(b: any, res: Response, user: User) {
    try {
      await this.limiterService.freeAiCreditUsage(user);
      
      const messages = [
        {
          role: 'system',
          content: generationPrompt({
            language: b?.language || 'typescript',
            themeKeys: [],
            usedUiFrameworks: b?.usedUiFrameworks || [],
          })
        },
        {
          role: 'user',
          content: b.prompt
        }
      ];

      // Add initial code if present
      if (b?.initialCode) {
        messages.push({
          role: 'user',
          content: `\CODE: ${b.initialCode}`
        });
      }
      if(b?.images && Array.isArray(b.images) && b.images.length > 0) {
        messages.push({
          role: 'user',
          content: [
            { type: 'text', text: 'Here are the relevant images:' },
            ...b.images.map(image => ({
              type: 'image_url',
              image_url: { url: image }
            }))
          ]
        });
      }

      const streamGenerator = await this.providerService.createOpenRouterStream({
        messages,
        model: 'qwen/qwen3.7-flash',
        maxTokens: 8192,
        temperature: 0.3
      });

      await this.providerService.streamResponse(
        res,
        streamGenerator,
        this.providerService.defaultLineProcessor()
      );
    } catch (error) {
      console.error('Free AI response error:', error);
      res.write(`data: ${JSON.stringify({ error: error.message || 'An error occurred' })}\n\n`);
      res.end();
    }
  }

  async getBestModel(b: any, res: Response, user: User) {
    try {
      if(user?.availableAiCredits === 0) {
        console.log('No credits left, using free ai modal');
        await this.freeAiModalResponse(b, res, user);
        return;
      }
      const modelPriority = b.model ? [b.model] : this.selectBestModel(b);
      const [primaryModel, backupModel] = modelPriority;

      if (!primaryModel) {
        throw new Error('No suitable models available');
      }
      try {
        const selectedModel = modelKeywordMap[primaryModel];
        if (selectedModel) {
          const estimatedTokens = this.calculateEstimatedTokens(b, selectedModel);
          const requiredCredits = Math.ceil(
            estimatedTokens / selectedModel.oneCreditTokens,
          );

          await this.limiterService.aiCreditUsage(user, requiredCredits);
          const modelFunction = this.functionMap[selectedModel.functionName];
          return await modelFunction(b, res, selectedModel.defaultParams?.model);
        }
      } catch (primaryError) {
        console.error(`Primary model ${primaryModel} failed:`, primaryError);
        
        // Try backup model if available
        if (backupModel) {
          try {
            const backupModelConfig = modelKeywordMap[backupModel];
            if (backupModelConfig) {
              const estimatedTokens = this.calculateEstimatedTokens(b, backupModelConfig);
              const requiredCredits = Math.ceil(
                estimatedTokens / backupModelConfig.oneCreditTokens,
              );

              await this.limiterService.aiCreditUsage(user, requiredCredits);
              const modelFunction = this.functionMap[backupModelConfig.functionName];
              return await modelFunction(b, res, backupModelConfig.defaultParams?.model);
            }
          } catch (backupError) {
            console.error(`Backup model ${backupModel} failed:`, backupError);
            throw backupError;
          }
        } else {
          throw primaryError;
        }
      }

      throw new Error('Model execution failed');
    } catch (error) {
      console.error('Final error in getBestModel:', error);
      throw error;
    }
  }

  private calculateEstimatedTokens(b: any, model: ModelConfig): number {
    let tokenEstimate = Math.ceil(
      b.prompt.length * 0.25 + (b.initialCode?.length || 0) * 0.4,
    );

    // Add image token estimation if present
    if (b.images?.length && model.imageSupport) {
      // Estimate 1000 tokens per image for sophisticated image analysis
      tokenEstimate += b.images.length * 1000;
    }

    // Add system prompt and context overhead
    tokenEstimate += 500;

    return tokenEstimate;
  }

  async completionInput(b: any, user: User) {
    const messages = [
      {
        role: 'system',
        content: completionInputPrompt(b),
      },
      {
        role: 'user',
        content: b.prompt,
      },
    ];

    return await this.providerService.generateOpenRouterText({
      messages,
      model: 'qwen/qwen3.7-flash',
      maxTokens: 100,
      temperature: 0.2,
    });
  }

  async generateComponentName(b: any, user: User) {
    const { name, description } = b;

    const userContent = {
      role: 'user',
      content: [
        {
          type: 'text',
          text: `Current name and description: ${name}\n\n${description}`,
        },
      ],
    } as any;

    if (b?.image) {
      userContent.content.push({
        type: 'image_url',
        image_url: {
          url: b.image,
        },
      });
    }

    const messages = [
      {
        role: 'system',
        content: `Generate component-focused name and description in json format. Name should be technical (like PricingCard, FeatureModal). Description should include UI elements and keywords.

        <output_format>
        {
          "name": string,    // Technical component name (e.g., FeatureList)
          "description": string   // UI-focused with keywords
        }
        </output_format>`,
      },
      userContent,
    ];

    const response = await this.providerService.generateOpenRouterText({
      messages,
      model: 'qwen/qwen3.7-flash',
      maxTokens: 2048,
      temperature: 0.2,
      responseFormat: { type: 'json_object' },
    });

    return response;
  }

  async remapFiles(b: any, user: User) {
    const { uiFrameworks, themeKeys } = b;
    const estimatedTokens = Math.ceil(JSON.stringify(b.files).length * 0.4);
    const requiredCredits = Math.ceil(estimatedTokens / 4096);
    await this.limiterService.aiCreditUsage(user, requiredCredits);
    console.log('remapFiles', remapFilesPrompt({ uiFrameworks, themeKeys }));
    const response = await this.providerService.generateOpenRouterText({
      systemPrompt: remapFilesPrompt({ uiFrameworks, themeKeys }),
      messages: [
        {
          role: 'user',
          content: JSON.stringify(b.files),
        },
      ],
      model: 'qwen/qwen3.7-flash',
      maxTokens: 8192,
      temperature: 0.4,
    });

    try {
      const jsonStart = response.indexOf('{');
      const jsonEnd = response.lastIndexOf('}') + 1;

      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error('No valid JSON object found in response');
      }

      const jsonString = response.slice(jsonStart, jsonEnd);
      console.log('jsonString', jsonString);
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Error:', error);
      throw new Error('Failed to generate valid JSON tokens');
    }
  }
  async generatePreview(b: any, user: User) {
    const estimatedTokens = Math.ceil(JSON.stringify(b.files).length * 0.4);
    const requiredCredits = Math.ceil(estimatedTokens / 4096);
    await this.limiterService.aiCreditUsage(user, requiredCredits);
    const response = await this.providerService.generateOpenRouterText({
      systemPrompt: generatePreviewPrompt(),
      messages: [
        {
          role: 'user',
          content: JSON.stringify(b.files),
        },
      ],
      model: 'qwen/qwen3.7-flash',
      maxTokens: 8192,
      temperature: 0.4,
    });

    try {
      const jsonStart = response.indexOf('{');
      const jsonEnd = response.lastIndexOf('}') + 1;

      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error('No valid JSON object found in response');
      }

      const jsonString = response.slice(jsonStart, jsonEnd);
      console.log('jsonString', jsonString);
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Error:', error);
      throw new Error('Failed to generate valid JSON tokens');
    }
  }

  async completion(b: any, res: Response, user: User) {
    const { completion, error, raw } = await this.copilot.complete({
      body: b,
    });

    if (error) {
      console.error('Completion error:', error);
      res.status(500).json({ completion: null, error });
      return;
    }

    res.status(200).json({ completion });
  }

  async getComponentThemeKeys(id: string) {
    const component = await this.componentRepository
      .createQueryBuilder('component')
      .leftJoinAndSelect('component.themes', 'themes')
      .where('component.id = :id', { id: shortIdToUuid(id) })
      .getOne();
    return component?.themes?.[0]?.values?.map((v: any) => v?.key) || [];
  }

  async generateTokens(b: any, user: User) {
    const requiredCredits = 1;
    await this.limiterService.aiCreditUsage(user, requiredCredits);

    const isEmptyObject = obj => obj && Object.keys(obj).length === 0;
    const tokens = isEmptyObject(b?.currentTokens) ? getStarterTokens(b?.usedUiFrameworks) : b?.currentTokens;
    const messages = [
      {
        role: 'user',
        content: `${b?.prompt}\n\n\\CURRENT: ${JSON.stringify(tokens)}`,
      },
    ];

    try {
      const response = await this.providerService.generateOpenRouterText({
        messages,
        model: 'qwen/qwen3.7-flash',
        temperature: 0,
        systemPrompt: generateTokensPrompt(b?.ui),
        responseFormat: { type: 'json_object' },
      });
      return this.extractJson(response);
    } catch (error) {
      console.error('GenerateTokens error:', error);
      throw error;
    }
  }

  async generateAnthropic(
    b: any,
    res: Response,
    model: string = 'claude-3-5-haiku-latest',
  ) {
    try {
      const themeKeys = await this.getComponentThemeKeys(b?.id);
      const messages = [
        {
          role: 'user',
          content: [
            { type: 'text', text: b?.prompt } as AnthropicContent,
            {
              type: 'text',
              text: `\\CODE: ${b?.initialCode}`,
            } as AnthropicContent,
          ],
        },
      ];

      if (b?.images && Array.isArray(b.images) && model.includes('sonnet')) {
        b.images.forEach((image: string) => {
          const mediaType = image.match(
            /data:(image\/(?:jpeg|png|gif|webp))/,
          )?.[1];
          const base64Data = image.split('base64,')[1];
          if (mediaType) {
            messages[0].content.push({
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Data,
              },
            } as AnthropicContent);
          }
        });
      }

      const streamGenerator = await this.providerService.createAnthropicStream({
        messages,
        model,
        maxTokens: 4096,
        temperature: 0.5,
        systemPrompt: generationPrompt({
          language: b?.language || 'typescript',
          themeKeys: themeKeys,
          usedUiFrameworks: b?.usedUiFrameworks || [],
        }),
      });

      await this.providerService.streamResponse(
        res,
        streamGenerator,
        this.providerService.defaultLineProcessor(),
      );
    } catch (error) {
      console.error('Error:', error);
      res.write(
        `data: ${JSON.stringify({ error: error.message || 'An error occurred' })}\n\n`,
      );
      res.end();
    }
  }

  async generateOpenRouter(
    b: any,
    res: Response,
    model: string = 'qwen/qwen3.7-flash',
    maxTokens: number = 4096,
    temperature: number = 0.5,
  ) {
    try {
      const messages = [
        {
          role: 'system',
          content: generationPrompt({
            language: b?.language || 'typescript',
            themeKeys: [],
            usedUiFrameworks: b?.usedUiFrameworks || [],
          }),
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: b?.prompt,
            },
          ],
        },
      ] as any;

      if (b?.images && Array.isArray(b.images)) {
        b.images.forEach((image: string) => {
          messages[1].content.push({
            type: 'image_url',
            image_url: {
              url: image,
            },
          });
        });
      }

      if (b?.initialCode) {
        messages.push({
          role: 'user',
          content: b.initialCode,
        });
      }

      const streamGenerator = await this.providerService.createOpenRouterStream(
        {
          messages,
          model,
          maxTokens,
          temperature,
        },
      );

      await this.providerService.streamResponse(
        res,
        streamGenerator,
        this.providerService.defaultLineProcessor(),
      );
    } catch (error) {
      console.error('Error:', error);
      res.write(
        `data: ${JSON.stringify({ error: error.message || 'An error occurred' })}\n\n`,
      );
      res.end();
    }
  }

  async generate4oMini(b: any, res: Response) {
    await this.generateOpenRouter(
      b,
      res,
      'openai/gpt-4o-mini',
      18192,
      0.75,
    );
  }

  // async generateDouble4oMini(b: any, res: Response) {
  //   const messages = [
  //     {
  //       role: 'system',
  //       content: generationPrompt({
  //         language: b?.language || 'typescript',
  //         themeKeys: [],
  //         usedUiFrameworks: b?.usedUiFrameworks || [],
  //       }),
  //     },
  //     {
  //       role: 'user',
  //       content: b?.prompt,
  //     },
  //   ];

  //   if (b?.initialCode) {
  //     messages.push({
  //       role: 'user',
  //       content: b.initialCode,
  //     });
  //   }

  //   const first = await this.providerService.generateOpenRouterText({
  //     messages,
  //     model: 'openai/gpt-4o-mini',
  //     maxTokens: 4096,
  //     temperature: 0.75,
  //   });

  //   await this.generateOpenRouter(
  //     {
  //       prompt: b?.prompt,
  //       initialCode: first,
  //       usedUiFrameworks: b?.usedUiFrameworks,
  //     },
  //     res,
  //     'anthropic/claude-3.5-haiku',
  //     4096,
  //     generationPrompt,
  //   );
  // }
}
