import { EventEmitter } from 'events';
import { ProviderService } from './provider.service';

describe('ProviderService optional integrations', () => {
  const providerKeys = [
    'OPENAI_API_KEY',
    'ANTHROPIC_API_KEY',
    'OPENROUTER_API_KEY',
  ] as const;
  const originalValues = new Map<string, string | undefined>();

  const response = (headersSent = false) => {
    const res: any = new EventEmitter();
    res.headersSent = headersSent;
    res.writableEnded = false;
    res.setHeader = jest.fn();
    res.write = jest.fn(() => {
      res.headersSent = true;
      return true;
    });
    res.end = jest.fn(() => {
      res.writableEnded = true;
    });
    return res;
  };

  beforeEach(() => {
    for (const key of providerKeys) {
      originalValues.set(key, process.env[key]);
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const key of providerKeys) {
      const value = originalValues.get(key);
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it('allows the API to start when optional AI providers are not configured', () => {
    expect(() => new ProviderService()).not.toThrow();
  });

  it('defers a pre-output stream failure so a backup may run', async () => {
    const service = new ProviderService();
    const res = response();
    async function* failed() {
      throw new Error('provider secret');
    }
    const outcome = await service.streamResponse(
      res,
      failed(),
      service.defaultLineProcessor(),
      true,
    );
    expect(outcome).toEqual({
      emittedOutput: false,
      succeeded: false,
      disconnected: false,
    });
    expect(res.end).not.toHaveBeenCalled();
    expect(res.write).not.toHaveBeenCalledWith(
      expect.stringContaining('provider secret'),
    );
  });

  it('ends after an emitted chunk and never permits fallback concatenation', async () => {
    const service = new ProviderService();
    const res = response();
    async function* partial() {
      yield 'const value = 1\n';
      throw new Error('later');
    }
    const outcome = await service.streamResponse(
      res,
      partial(),
      service.defaultLineProcessor(),
      true,
    );
    expect(outcome.emittedOutput).toBe(true);
    expect(res.end).toHaveBeenCalledTimes(1);
  });
  it('does not charge whitespace and emits only an error terminal for empty output', async () => {
    const service = new ProviderService();
    const writes: string[] = [];
    const res = response();
    res.write.mockImplementation((value: string) => {
      res.headersSent = true;
      writes.push(value);
      return true;
    });
    async function* empty() {
      yield '   \n';
    }
    const outcome = await service.streamResponse(
      res,
      empty(),
      service.defaultLineProcessor(),
    );
    expect(outcome.emittedOutput).toBe(false);
    expect(writes.some((value) => value.includes('"response":"   \\n"'))).toBe(
      true,
    );
    expect(
      writes.filter((value) => value.includes('No response generated')),
    ).toHaveLength(1);
    expect(writes.some((value) => value.includes('"done"'))).toBe(false);
  });

  it('caps cumulative provider output', async () => {
    const service = new ProviderService();
    const res = response();
    async function* huge() {
      yield 'x'.repeat(1_000_001);
    }
    const outcome = await service.streamResponse(
      res,
      huge(),
      service.defaultLineProcessor(),
    );
    expect(outcome).toEqual({
      emittedOutput: false,
      succeeded: false,
      disconnected: false,
    });
    expect(res.write).toHaveBeenCalledWith(
      expect.stringContaining('AI generation failed'),
    );
  });

  it('reuses already-sent SSE headers for a deferred backup', async () => {
    const service = new ProviderService();
    const res = response();
    async function* failed() {
      throw new Error('primary');
    }
    async function* backup() {
      yield 'backup\n';
    }
    await service.streamResponse(
      res,
      failed(),
      service.defaultLineProcessor(),
      true,
    );
    await service.streamResponse(res, backup(), service.defaultLineProcessor());
    expect(res.setHeader).toHaveBeenCalledTimes(3);
    expect(
      res.write.mock.calls.filter(([value]) => value.includes('connected')),
    ).toHaveLength(1);
  });

  it('cancels upstream and reports a pre-output disconnect without ending or emitting', async () => {
    const service = new ProviderService();
    const res = response();
    let cancelled = false;
    async function* slow() {
      try {
        await new Promise((resolve) => setTimeout(resolve, 10));
        yield 'late\n';
      } finally {
        cancelled = true;
      }
    }
    const pending = service.streamResponse(
      res,
      slow(),
      service.defaultLineProcessor(),
      true,
    );
    res.emit('close');
    const outcome = await pending;
    expect(outcome).toEqual({
      emittedOutput: false,
      succeeded: false,
      disconnected: true,
    });
    expect(outcome.disconnected).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 15));
    expect(cancelled).toBe(true);
    expect(res.end).not.toHaveBeenCalled();
  });

  it('does not write or start an iterator for an already-destroyed response', async () => {
    const service = new ProviderService();
    const res = response();
    res.destroyed = true;
    const next = jest.fn();
    const generator = { [Symbol.asyncIterator]: () => ({ next }) } as any;
    const outcome = await service.streamResponse(
      res,
      generator,
      service.defaultLineProcessor(),
    );
    expect(outcome).toEqual({
      emittedOutput: false,
      succeeded: false,
      disconnected: true,
    });
    expect(next).not.toHaveBeenCalled();
    expect(res.write).not.toHaveBeenCalled();
  });

  it('passes abort to provider creation and returns promptly when creation is aborted', async () => {
    process.env.OPENROUTER_API_KEY = 'test-key';
    const service = new ProviderService();
    const controller = new AbortController();
    const create = jest.fn(
      (_body, options) =>
        new Promise((_resolve, reject) => {
          options.signal.addEventListener(
            'abort',
            () => reject(new Error('aborted')),
            { once: true },
          );
        }),
    );
    (service as any).openrouter = { chat: { completions: { create } } };
    const stream = service.createOpenRouterStream({
      messages: [],
      model: 'model',
      signal: controller.signal,
    });
    const res = response();
    const pending = service.streamResponse(
      res,
      stream,
      service.defaultLineProcessor(),
      true,
      controller.signal,
    );
    controller.abort();
    const outcome = await pending;
    expect(outcome.disconnected).toBe(true);
    expect(create.mock.calls[0][1]).toEqual({ signal: controller.signal });
  });
});
