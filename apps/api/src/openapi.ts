import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const OPENAPI_JSON_PATH = '/openapi.json';
export const SWAGGER_UI_PATH = '/api/docs';

/** Registers the read-only API reference and its machine-readable OpenAPI document. */
export function setupOpenApi(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Compify API')
    .setDescription(
      'HTTP API for Compify components, themes, users, and integrations.',
    )
    .setVersion('1.0')
    .addTag('System', 'Liveness and dependency readiness')
    .addTag('Authentication', 'OAuth authentication flows')
    .addTag('Users', 'Registration, sessions, profiles, and account operations')
    .addTag('Subscriptions', 'Plans, usage, checkout, and billing webhooks')
    .addTag('Components', 'Authenticated component management')
    .addTag(
      'Public components',
      'Public component metadata, assets, and discovery',
    )
    .addTag('Registry', 'shadcn-compatible registry endpoints')
    .addTag('Themes', 'Component theme management')
    .addTag('AI', 'Configured AI generation and completion providers')
    .addTag('CLI', 'CLI-authenticated component operations')
    .addTag('Newsletter', 'Newsletter subscriptions')
    .addServer(process.env.BACKEND_URL || 'http://localhost:3009')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'bearer',
    )
    .addApiKey(
      { type: 'apiKey', in: 'header', name: 'x-cli-token' },
      'cli-token',
    )
    .addApiKey(
      { type: 'apiKey', in: 'header', name: 'x-api-key' },
      'internal-api-key',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  for (const pathItem of Object.values(document.paths)) {
    for (const operation of Object.values(pathItem ?? {})) {
      if (
        !operation ||
        typeof operation !== 'object' ||
        !('operationId' in operation)
      ) {
        continue;
      }
      if (!operation.summary && typeof operation.operationId === 'string') {
        const methodName =
          operation.operationId.split('_').at(-1) ?? operation.operationId;
        operation.summary = methodName
          .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
          .replace(/^./, (character) => character.toUpperCase());
      }
    }
  }
  SwaggerModule.setup(SWAGGER_UI_PATH, app, document, {
    jsonDocumentUrl: OPENAPI_JSON_PATH,
    customSiteTitle: 'Compify API reference',
    swaggerOptions: {
      url: OPENAPI_JSON_PATH,
      // This is a reference surface, not an API client: disable "Try it out"
      // for every HTTP method, including otherwise-mutating operations.
      supportedSubmitMethods: [],
      tryItOutEnabled: false,
      persistAuthorization: false,
    },
  });
}
