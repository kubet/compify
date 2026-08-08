import { databaseOptions, validateEnvironment } from './environment';

const valid = () => ({
  FRONTEND_URL: 'http://localhost:3000',
  BACKEND_URL: 'http://localhost:3009',
  DB_HOST: 'localhost',
  DB_USERNAME: 'postgres',
  DB_PASSWORD: 'secret',
  DB_DATABASE: 'compify',
  JWT_SECRET: 'x'.repeat(32),
  MINIO_ACCESS_KEY: 'minio',
  MINIO_SECRET_KEY: 'secret',
});

describe('environment configuration', () => {
  it('accepts missing optional integrations and coerces ports', () => {
    const config = { ...valid(), DB_PORT: '5433' };
    expect(validateEnvironment(config)).toBe(config);
    expect(config.DB_PORT).toBe(5433);
  });

  it('reports invalid required and paired configuration', () => {
    expect(() =>
      validateEnvironment({
        ...valid(),
        JWT_SECRET: 'short',
        GOOGLE_OAUTH_ENABLED: 'true',
        GOOGLE_CLIENT_ID: 'id',
      }),
    ).toThrow(/JWT_SECRET.*GOOGLE_CLIENT_SECRET is required/s);
  });

  it('requires complete credentials for enabled auth capabilities', () => {
    expect(() =>
      validateEnvironment({ ...valid(), GOOGLE_OAUTH_ENABLED: 'true' }),
    ).toThrow(/GOOGLE_CLIENT_ID.*GOOGLE_CLIENT_SECRET/s);
    expect(() =>
      validateEnvironment({ ...valid(), TURNSTILE_ENABLED: 'true' }),
    ).toThrow(/CLOUDFLARE_TURNSTILE_KEY.*TURNSTILE_SITE_KEY/s);
    expect(() =>
      validateEnvironment({
        ...valid(),
        GOOGLE_OAUTH_ENABLED: 'true',
        GOOGLE_CLIENT_ID: 'id',
        GOOGLE_CLIENT_SECRET: 'secret',
        TURNSTILE_ENABLED: 'true',
        CLOUDFLARE_TURNSTILE_KEY: 'secret',
        TURNSTILE_SITE_KEY: 'site-key',
      }),
    ).not.toThrow();
  });

  it('rejects invalid capability flags', () => {
    expect(() =>
      validateEnvironment({ ...valid(), GOOGLE_OAUTH_ENABLED: 'yes' }),
    ).toThrow(/GOOGLE_OAUTH_ENABLED must be either true or false/);
  });

  it('validates the optional bind address', () => {
    expect(validateEnvironment({ ...valid(), HOST: '127.0.0.1' })).toEqual(
      expect.objectContaining({ HOST: '127.0.0.1' }),
    );
    expect(() =>
      validateEnvironment({ ...valid(), HOST: 'localhost' }),
    ).toThrow(/HOST must be a valid IPv4 or IPv6 address/);
  });

  it('validates the trusted reverse-proxy hop count', () => {
    const config = { ...valid(), TRUST_PROXY_HOPS: '1' };
    expect(validateEnvironment(config)).toBe(config);
    expect(config.TRUST_PROXY_HOPS).toBe(1);
    expect(() =>
      validateEnvironment({ ...valid(), TRUST_PROXY_HOPS: 'all' }),
    ).toThrow(/TRUST_PROXY_HOPS/);
  });

  it('rejects non-loopback HTTP origins in production', () => {
    expect(() =>
      validateEnvironment({
        ...valid(),
        NODE_ENV: 'production',
        FRONTEND_URL: 'http://compify.example.test',
        BACKEND_URL: 'http://api.example.test',
      }),
    ).toThrow(/must use HTTPS in production/);
    expect(() =>
      validateEnvironment({ ...valid(), NODE_ENV: 'production' }),
    ).not.toThrow();
  });

  it('requires HTTPS when cross-site cookies are enabled', () => {
    expect(() =>
      validateEnvironment({ ...valid(), AUTH_COOKIE_SAME_SITE: 'none' }),
    ).toThrow(/requires an HTTPS BACKEND_URL/);
    expect(() =>
      validateEnvironment({
        ...valid(),
        BACKEND_URL: 'https://api.example.test',
        AUTH_COOKIE_SAME_SITE: 'none',
      }),
    ).not.toThrow();
  });

  it.each([
    ['production', 'true', false],
    ['test', 'true', false],
    ['development', 'false', false],
    ['development', 'true', true],
  ])('sets synchronize safely for %s / %s', (nodeEnv, toggle, expected) => {
    const values = { ...valid(), NODE_ENV: nodeEnv, DB_SYNCHRONIZE: toggle };
    const config = {
      get: (key: string, fallback?: unknown) => values[key] ?? fallback,
    };
    expect(databaseOptions(config as any).synchronize).toBe(expected);
  });
});
