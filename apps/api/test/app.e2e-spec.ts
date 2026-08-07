import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { json, urlencoded } from 'express';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import {
  OPENAPI_JSON_PATH,
  setupOpenApi,
  SWAGGER_UI_PATH,
} from '../src/openapi';

describe('shipped AppModule HTTP contract', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication({ rawBody: true, bodyParser: false });
    setupOpenApi(app);
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.use(
      json({
        limit: '10mb',
        verify: (req: any, _res, buf) => {
          req.rawBody = buf.toString();
        },
      }),
    );
    app.use(urlencoded({ limit: '10mb', extended: true }));
    await app.init();
  }, 30_000);

  afterAll(async () => app?.close());

  it('publishes the real operation inventory with correct security schemes', async () => {
    const { body } = await request(app.getHttpServer())
      .get(OPENAPI_JSON_PATH)
      .expect(200)
      .expect('Content-Type', /json/);

    expect(body.paths['/health'].get.security).toBeUndefined();
    expect(body.paths['/component/my'].get.security).toContainEqual({
      bearer: [],
    });
    expect(body.paths['/component/my'].get.security).toContainEqual({
      'browser-cookie': [],
    });
    expect(body.paths['/theme/{id}'].get.security).toContainEqual({
      bearer: [],
    });
    expect(body.paths['/user/whoami'].get.security).toContainEqual({
      bearer: [],
    });
    expect(body.paths['/cli/get-all'].get.security).toContainEqual({
      'cli-token': [],
    });
    expect(body.paths['/cli/publish-story'].post.security).toContainEqual({
      'cli-bearer': [],
    });
    expect(body.paths['/c/fetch/sitemap/all'].get.security).toContainEqual({
      'internal-api-key': [],
    });
    expect(body.components.securitySchemes).toMatchObject({
      bearer: { type: 'http', scheme: 'bearer' },
      'browser-cookie': { type: 'apiKey', in: 'cookie', name: 'compify_auth' },
      'cli-token': { type: 'apiKey', in: 'header', name: 'x-cli-token' },
      'cli-bearer': { type: 'http', scheme: 'bearer' },
      'internal-api-key': { type: 'apiKey', in: 'header', name: 'x-api-key' },
    });
  });

  it('keeps Swagger UI read-only and authorization ephemeral', async () => {
    await request(app.getHttpServer()).get(SWAGGER_UI_PATH).expect(200);
    const initializer = await request(app.getHttpServer())
      .get(`${SWAGGER_UI_PATH}/swagger-ui-init.js`)
      .expect(200);
    expect(initializer.text).toContain(`"url": "${OPENAPI_JSON_PATH}"`);
    expect(initializer.text).toContain('"supportedSubmitMethods": []');
    expect(initializer.text).toContain('"tryItOutEnabled": false');
    expect(initializer.text).toContain('"persistAuthorization": false');
  });

  it.each([
    ['/component/my', 'bearer-protected component route'],
    ['/theme/not-a-real-id', 'bearer-protected theme route'],
    ['/user/whoami', 'bearer-protected user route'],
    ['/cli/get-all', 'CLI-token route'],
    ['/c/fetch/sitemap/all', 'internal-token route'],
  ])('rejects unauthenticated GET %s (%s)', async (path) => {
    await request(app.getHttpServer()).get(path).expect(401);
  });

  it('keeps liveness public without claiming dependency readiness', async () => {
    await request(app.getHttpServer())
      .get('/health')
      .expect(200, { status: 'ok' });
  });
});
