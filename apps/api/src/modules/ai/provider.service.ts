import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { OpenAI } from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { Response } from 'express';
import { generationPrompt } from './prompts';

// Keep interfaces but make them more permissive
interface GenerationParams {
  messages: Array<{ role: string; content: any }>; // Changed to any for content
  model: string;
  maxTokens?: number;
  temperature?: number;
  responseFormat?: { type: string };
  initialCode?: string;
  signal?: AbortSignal;
}

export interface StreamOutcome {
  emittedOutput: boolean;
  succeeded: boolean;
  disconnected: boolean;
}

interface StreamProcessor {
  processLine: (line: string) => string | null;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: any) => void;
}

@Injectable()
export class ProviderService {
  private openai?: any;
  private anthropic?: any;
  private openrouter?: any;

  private getOpenAI(): any {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      throw new ServiceUnavailableException('OpenAI is not configured');
    }
    return (this.openai ??= new OpenAI({ apiKey }));
  }

  private getAnthropic(): any {
    const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
    if (!apiKey) {
      throw new ServiceUnavailableException('Anthropic is not configured');
    }
    return (this.anthropic ??= new Anthropic({ apiKey }));
  }

  private getOpenRouter(): any {
    const apiKey = process.env.OPENROUTER_API_KEY?.trim();
    if (!apiKey) {
      throw new ServiceUnavailableException('OpenRouter is not configured');
    }
    return (this.openrouter ??= new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey,
    }));
  }

  // Text generation methods with more permissive types
  async generateOpenAIText(params: GenerationParams): Promise<string> {
    try {
      const response = (await this.getOpenAI().chat.completions.create({
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
      const response = (await this.getOpenRouter().chat.completions.create({
        model: params.model,
        messages: params.messages as any[],
        temperature: params.temperature ?? 0.5,
        max_tokens: params.maxTokens ?? 4096,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
        ...(params.responseFormat
          ? { response_format: params.responseFormat }
          : {}),
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
      const response = (await this.getAnthropic().messages.create({
        model: params.model,
        messages: params.messages as any[],
        max_tokens: params.maxTokens ?? 4096,
        temperature: params.temperature ?? 0.5,
        system: generationPrompt(),
        response_format: params.responseFormat ?? undefined,
      })) as any;

      const result = response.content
        .map((block: any) => block.text)
        .join('\n');

      return result;
    } catch (error) {
      console.error('Anthropic Text Generation Error:', {
        error: error.message,
        name: error.name,
        stack: error.stack,
      });
      throw error;
    }
  }

  // Stream handling with more permissive types
  async streamResponse(
    res: Response,
    streamGenerator: AsyncGenerator<any>,
    processor: StreamProcessor,
    deferFailure = false,
    signal?: AbortSignal,
  ): Promise<StreamOutcome> {
    if (signal?.aborted || res.destroyed || res.closed) {
      return { emittedOutput: false, succeeded: false, disconnected: true };
    }
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.write('data: {"status":"connected"}\n\n');
    }

    let buffer = '';
    let emittedOutput = false;
    let disconnected = false;
    let outputBytes = 0;
    const maxOutputBytes = 1_000_000;
    const maxBufferBytes = 250_000;
    let resolveClose: () => void = () => undefined;
    const closePromise = new Promise<void>((resolve) => {
      resolveClose = resolve;
    });
    const onClose = () => {
      disconnected = true;
      resolveClose();
    };
    const onAbort = onClose;
    res.once('close', onClose);
    signal?.addEventListener('abort', onAbort, { once: true });
    const iterator = streamGenerator[Symbol.asyncIterator]();
    let cancellationSignalled = false;
    const cancelIterator = () => {
      if (cancellationSignalled) return;
      cancellationSignalled = true;
      void iterator.return?.(undefined as any).catch(() => undefined);
    };
    const outcome = (succeeded: boolean): StreamOutcome => ({
      emittedOutput,
      succeeded,
      disconnected,
    });
    const write = (value: string) => {
      if (disconnected || res.writableEnded || res.destroyed || res.closed)
        return false;
      res.write(value);
      return (
        !disconnected && !res.writableEnded && !res.destroyed && !res.closed
      );
    };

    try {
      processor.onStart?.();
      while (true) {
        const next = await Promise.race([
          iterator.next().then((value) => ({ kind: 'next' as const, value })),
          closePromise.then(() => ({ kind: 'close' as const })),
        ]);
        if (next.kind === 'close') {
          cancelIterator();
          return outcome(false);
        }
        if (next.value.done) break;
        const text =
          typeof next.value.value === 'string' ? next.value.value : '';
        outputBytes += Buffer.byteLength(text, 'utf8');
        if (outputBytes > maxOutputBytes)
          throw new Error('AI output limit exceeded');
        buffer += text;
        if (Buffer.byteLength(buffer, 'utf8') > maxBufferBytes)
          throw new Error('AI stream buffer limit exceeded');
        while (buffer.includes('\n')) {
          const newlineIndex = buffer.indexOf('\n');
          const line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          const processedLine = processor.processLine(line);
          if (processedLine !== null) {
            const usable = processedLine.trim().length > 0;
            const wrote = write(
              `data: ${JSON.stringify({ response: processedLine + '\n' })}\n\n`,
            );
            if (usable && wrote) emittedOutput = true;
          }
        }
      }
      if (buffer && !disconnected) {
        const processedLine = processor.processLine(buffer);
        if (processedLine !== null) {
          const usable = processedLine.trim().length > 0;
          const wrote = write(
            `data: ${JSON.stringify({ response: processedLine })}\n\n`,
          );
          if (usable && wrote) emittedOutput = true;
        }
      }
      if (disconnected) return outcome(false);
      if (!emittedOutput && deferFailure) return outcome(false);
      if (!emittedOutput) {
        write(
          `data: ${JSON.stringify({ error: 'No response generated' })}\n\n`,
        );
        return outcome(false);
      }
      processor.onEnd?.();
      write(`data: ${JSON.stringify({ status: 'done' })}\n\n`);
      return outcome(true);
    } catch (error) {
      processor.onError?.(error);
      if (disconnected) return outcome(false);
      if (!emittedOutput && deferFailure) return outcome(false);
      write(`data: ${JSON.stringify({ error: 'AI generation failed' })}\n\n`);
      return outcome(false);
    } finally {
      res.removeListener('close', onClose);
      signal?.removeEventListener('abort', onAbort);
      if (disconnected) cancelIterator();
      if (!disconnected && (!deferFailure || emittedOutput)) res.end();
    }
  }

  // Stream generators with more permissive types
  async *createOpenAIStream(params: GenerationParams) {
    const stream = (await this.getOpenAI().chat.completions.create(
      {
        model: params.model,
        messages: params.messages as any[],
        temperature: params.temperature ?? 0.5,
        max_tokens: params.maxTokens ?? 4096,
        stream: true,
      },
      { signal: params.signal },
    )) as any;

    for await (const chunk of stream) {
      yield chunk.choices[0]?.delta?.content || '';
    }
  }

  async *createOpenRouterStream(params: GenerationParams) {
    const stream = (await this.getOpenRouter().chat.completions.create(
      {
        model: params.model,
        messages: params.messages as any[],
        temperature: params.temperature ?? 0.5,
        max_tokens: params.maxTokens ?? 4096,
        stream: true,
      },
      { signal: params.signal },
    )) as any;

    for await (const chunk of stream) {
      yield chunk.choices[0]?.delta?.content || '';
    }
  }

  async *createAnthropicStream(params: GenerationParams) {
    const stream = (await this.getAnthropic().messages.stream(
      {
        model: params.model,
        messages: params.messages as any[],
        max_tokens: params.maxTokens ?? 4096,
        temperature: params.temperature ?? 0.5,
        system: generationPrompt(),
      },
      { signal: params.signal },
    )) as any;

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
