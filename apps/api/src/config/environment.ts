import { TypeOrmModuleOptions } from '@nestjs/typeorm';

const required = [
  'FRONTEND_URL',
  'BACKEND_URL',
  'DB_HOST',
  'DB_USERNAME',
  'DB_PASSWORD',
  'DB_DATABASE',
  'JWT_SECRET',
  'MINIO_ACCESS_KEY',
  'MINIO_SECRET_KEY',
] as const;

function isUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function validatePort(config: Record<string, unknown>, key: string, errors: string[]) {
  if (config[key] === undefined || config[key] === '') return;
  const port = Number(config[key]);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    errors.push(`${key} must be an integer between 1 and 65535`);
  } else {
    config[key] = port;
  }
}

function requireTogether(config: Record<string, unknown>, keys: string[], errors: string[]) {
  const present = keys.filter((key) => Boolean(config[key]));
  if (present.length > 0 && present.length !== keys.length) {
    errors.push(`${keys.join(', ')} must be configured together`);
  }
}

/** Validate core configuration while allowing integrations to be omitted. */
export function validateEnvironment(config: Record<string, unknown>) {
  const errors: string[] = [];
  for (const key of required) {
    if (typeof config[key] !== 'string' || !(config[key] as string).trim()) {
      errors.push(`${key} is required`);
    }
  }

  for (const key of ['FRONTEND_URL', 'BACKEND_URL']) {
    if (typeof config[key] === 'string' && config[key] && !isUrl(config[key] as string)) {
      errors.push(`${key} must be an http(s) URL`);
    }
  }
  validatePort(config, 'PORT', errors);
  validatePort(config, 'DB_PORT', errors);
  validatePort(config, 'MINIO_PORT', errors);

  for (const key of ['DB_SYNCHRONIZE', 'MINIO_USE_SSL']) {
    if (config[key] !== undefined && !['true', 'false'].includes(String(config[key]))) {
      errors.push(`${key} must be either true or false`);
    }
  }
  if (
    config.NODE_ENV !== undefined &&
    !['development', 'test', 'production'].includes(String(config.NODE_ENV))
  ) {
    errors.push('NODE_ENV must be development, test, or production');
  }

  const jwtSecret = config.JWT_SECRET;
  if (typeof jwtSecret === 'string' && jwtSecret.length < 32) {
    errors.push('JWT_SECRET must contain at least 32 characters');
  }

  requireTogether(config, ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'], errors);
  requireTogether(
    config,
    ['ZEPTOMAIL_API_URL', 'ZEPTOMAIL_API_TOKEN', 'EMAIL_FROM_ADDRESS'],
    errors,
  );

  if (errors.length) {
    throw new Error(`Invalid environment configuration:\n- ${errors.join('\n- ')}`);
  }
  return config;
}

export function databaseOptions(config: { get<T = any>(key: string, defaultValue?: T): T }): TypeOrmModuleOptions {
  const development = config.get<string>('NODE_ENV') === 'development';
  const synchronize = development && config.get<string>('DB_SYNCHRONIZE', 'false') === 'true';
  return {
    type: 'postgres',
    autoLoadEntities: true,
    synchronize,
    host: config.get<string>('DB_HOST'),
    port: Number(config.get<number>('DB_PORT', 5432)),
    username: config.get<string>('DB_USERNAME'),
    password: config.get<string>('DB_PASSWORD'),
    database: config.get<string>('DB_DATABASE'),
    migrations: ['dist/migrations/*.js'],
    migrationsRun: false,
  };
}
