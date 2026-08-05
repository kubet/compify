import { Injectable } from '@nestjs/common';
import { OpenAI } from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { Response } from 'express';

// Keep interfaces but make them more permissive
interface GenerationParams {
  messages: Array<{ role: string; content: any }>; // Changed to any for content
  model: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
  responseFormat?: { type: string };
  initialCode?: string;
}

interface StreamProcessor {
  processLine: (line: string) => string | null;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: any) => void;
}

@Injectable()
export class ProviderService {
  private readonly openai: any; // Change to any to avoid type conflicts
  private readonly anthropic: any;
  private readonly openrouter: any;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    this.openrouter = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
    });
  }

  // Text generation methods with more permissive types
  async generateOpenAIText(params: GenerationParams): Promise<string> {
    try {
      const response = (await this.openai.chat.completions.create({
        model: params.model,
        messages: params.messages as any[],
        temperature: params.temperature ?? 0.5,
        max_tokens: params.maxTokens ?? 4096,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
        response_format: params.responseFormat ?? { type: 'json_object' },
      })) as any;

      return (
        response.choices
          ?.map((choice: any) => choice.message.content)
          .join('\n') ?? ''
      );
    } catch (error) {
      console.error('OpenAI Text Generation Error:', error);
      throw error;
    }
  }

  async generateOpenRouterText(params: GenerationParams): Promise<string> {
    try {
      const response = (await this.openrouter.chat.completions.create({
        model: params.model,
        messages: params.messages as any[],
        temperature: params.temperature ?? 0.5,
        max_tokens: params.maxTokens ?? 4096,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      })) as any;

      return (
        response.choices
          ?.map((choice: any) => choice.message.content)
          .join('\n') ?? ''
      );
    } catch (error) {
      console.error('OpenRouter Text Generation Error:', error);
      throw error;
    }
  }

  async generateAnthropicText(params: GenerationParams): Promise<string> {
    try {

      const response = (await this.anthropic.messages.create({
        model: params.model,
        messages: params.messages as any[],
        max_tokens: params.maxTokens ?? 4096,
        temperature: params.temperature ?? 0.5,
        system: params.systemPrompt,
        response_format: params.responseFormat ?? undefined,
      })) as any;

      const result = response.content.map((block: any) => block.text).join('\n');
   
      return result;
    } catch (error) {
      console.error('Anthropic Text Generation Error:', {
        error: error.message,
        name: error.name,
        stack: error.stack
      });
      throw error;
    }
  }

  // Stream handling with more permissive types
  async streamResponse(
    res: Response,
    streamGenerator: AsyncGenerator<any>,
    processor: StreamProcessor,
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let buffer = '';
    let hasReceivedText = false;

    try {
      processor.onStart?.();
      res.write('data: {"status":"connected"}\n\n');

      for await (const chunk of streamGenerator) {
        hasReceivedText = true;
        buffer += chunk;

        while (buffer.includes('\n')) {
          const newlineIndex = buffer.indexOf('\n');
          const line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          const processedLine = processor.processLine(line);
          if (processedLine !== null) {
            res.write(
              `data: ${JSON.stringify({ response: processedLine + '\n' })}\n\n`,
            );
          }
        }
      }

      if (buffer) {
        const processedLine = processor.processLine(buffer);
        if (processedLine !== null) {
          res.write(`data: ${JSON.stringify({ response: processedLine })}\n\n`);
        }
      }

      if (!hasReceivedText) {
        res.write(
          `data: ${JSON.stringify({ error: 'No response generated' })}\n\n`,
        );
      }

      processor.onEnd?.();
      res.write(`data: ${JSON.stringify({ status: 'done' })}\n\n`);
    } catch (error) {
      processor.onError?.(error);
      res.write(
        `data: ${JSON.stringify({ error: error.message || 'Stream error occurred' })}\n\n`,
      );
    } finally {
      res.end();
    }
  }

  // Stream generators with more permissive types
  async *createOpenAIStream(params: GenerationParams) {
    const stream = (await this.openai.chat.completions.create({
      model: params.model,
      messages: params.messages as any[],
      temperature: params.temperature ?? 0.5,
      max_tokens: params.maxTokens ?? 4096,
      stream: true,
    })) as any;

    for await (const chunk of stream) {
      yield chunk.choices[0]?.delta?.content || '';
    }
  }

  async *createOpenRouterStream(params: GenerationParams) {
    const stream = (await this.openrouter.chat.completions.create({
      model: params.model,
      messages: params.messages as any[],
      temperature: params.temperature ?? 0.5,
      max_tokens: params.maxTokens ?? 4096,
      stream: true,
    })) as any;

    for await (const chunk of stream) {
      yield chunk.choices[0]?.delta?.content || '';
    }
  }

  async *createAnthropicStream(params: GenerationParams) {
    const stream = (await this.anthropic.messages.stream({
      model: params.model,
      messages: params.messages as any[],
      max_tokens: params.maxTokens ?? 4096,
      temperature: params.temperature ?? 0.5,
      system: params.systemPrompt,
    })) as any;

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta') {
        yield chunk.delta.text;
      }
    }
  }

  // Default line processor remains the same
  defaultLineProcessor(): StreamProcessor {
    return {
      processLine: (line: string): string | null => {
        const trimmedLine = line.trim();
        const codeBlocks = [
          '```html',
          '```jsx',
          '```tsx',
          '```css',
          '```javascript',
          '```typescript',
          '```js',
          '```ts',
          '```vue',
          '```',
        ];

        if (codeBlocks.includes(trimmedLine)) {
          return null;
        }

        return line;
      },
      onError: (error: any) => {
        console.error('Stream processing error:', error);
      },
    };
  }
}
