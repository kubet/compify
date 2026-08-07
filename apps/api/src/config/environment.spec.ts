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
      validateEnvironment({ ...valid(), JWT_SECRET: 'short', GOOGLE_CLIENT_ID: 'id' }),
    ).toThrow(/JWT_SECRET.*GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET/s);
  });

  it.each([
    ['production', 'true', false],
    ['test', 'true', false],
    ['development', 'false', false],
    ['development', 'true', true],
  ])('sets synchronize safely for %s / %s', (nodeEnv, toggle, expected) => {
    const values = { ...valid(), NODE_ENV: nodeEnv, DB_SYNCHRONIZE: toggle };
    const config = { get: (key: string, fallback?: unknown) => values[key] ?? fallback };
    expect(databaseOptions(config as any).synchronize).toBe(expected);
  });
});
