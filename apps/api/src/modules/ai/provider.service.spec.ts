import { ProviderService } from './provider.service';

describe('ProviderService optional integrations', () => {
  const providerKeys = [
    'OPENAI_API_KEY',
    'ANTHROPIC_API_KEY',
    'OPENROUTER_API_KEY',
  ] as const;
  const originalValues = new Map<string, string | undefined>();

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
});
