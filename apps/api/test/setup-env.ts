// Explicit test-only defaults. CI/Compose may override every value.
process.env.NODE_ENV = 'test';
process.env.STAGE = 'test';
process.env.FRONTEND_URL ??= 'http://localhost:3000';
process.env.BACKEND_URL ??= 'http://localhost:3009';
process.env.DB_HOST ??= '127.0.0.1';
process.env.DB_PORT ??= '5432';
process.env.DB_USERNAME ??= 'compify';
process.env.DB_PASSWORD ??= 'compify-test';
process.env.DB_DATABASE ??= 'compify';
process.env.DB_SYNCHRONIZE ??= 'false';
process.env.JWT_SECRET ??= 'test-only-jwt-secret-never-use-in-production';
process.env.MINIO_ENDPOINT ??= '127.0.0.1';
process.env.MINIO_PORT ??= '9000';
process.env.MINIO_USE_SSL ??= 'false';
process.env.MINIO_ACCESS_KEY ??= 'compify';
process.env.MINIO_SECRET_KEY ??= 'compify-test';
process.env.INTERNAL_API_TOKEN ??= 'test-only-internal-api-token';
