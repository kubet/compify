import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';
import { setupOpenApi } from './openapi';
import { createCsrfProtection } from './common/csrf-protection';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
    bodyParser: false,
  });

  app.getHttpAdapter().getInstance().disable('x-powered-by');
  const trustProxyHops = Number(process.env.TRUST_PROXY_HOPS || 0);
  if (trustProxyHops > 0) {
    app.getHttpAdapter().getInstance().set('trust proxy', trustProxyHops);
  }

  app.enableCors({
    origin: process.env.FRONTEND_URL,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'If-Match'],
    exposedHeaders: ['ETag'],
    credentials: true,
  });

  // Credentialed CORS is restricted to the configured web origin. Cookies are
  // host-only, so self-hosted deployments do not need a hard-coded domain.
  app.use((request, response, next) => {
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Frame-Options', 'DENY');
    response.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains',
    );
    response.setHeader(
      'Content-Security-Policy',
      request.path.startsWith('/api/docs')
        ? "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'self'"
        : "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
    );
    next();
  });

  setupOpenApi(app);

  app.use(
    createCsrfProtection([process.env.FRONTEND_URL, process.env.BACKEND_URL]),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.use((_request, response, next) => {
    response.setHeader('Cache-Control', 'no-cache');
    next();
  });

  app.use(
    json({
      limit: '10mb',
      verify: (req: any, res, buf) => {
        req.rawBody = buf.toString();
      },
    }),
  );
  app.use(urlencoded({ limit: '10mb', extended: true }));

  await app.listen(
    process.env.PORT || 3009,
    process.env.HOST || '0.0.0.0',
    () => {
      if (process.send) {
        process.send('ready');
      }
    },
  );

  process.on('SIGINT', async () => {
    await app.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await app.close();
    process.exit(0);
  });
}
bootstrap();
