import { Controller, Get, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import * as request from 'supertest';
import { OPENAPI_JSON_PATH, setupOpenApi, SWAGGER_UI_PATH } from './openapi';

@ApiTags('Test resources')
@ApiBearerAuth('bearer')
@Controller('test-resources')
class TestResourceController {
  @Get()
  list() {
    return [];
  }
}

describe('OpenAPI', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [TestResourceController],
    }).compile();
    app = module.createNestApplication();
    setupOpenApi(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('serves the generated document at the stable public endpoint', async () => {
    const response = await request(app.getHttpServer())
      .get(OPENAPI_JSON_PATH)
      .expect(200)
      .expect('Content-Type', /json/);

    expect(response.body.openapi).toMatch(/^3\./);
    expect(response.body.info.title).toBe('Compify API');
    expect(response.body.servers).toEqual([
      { url: process.env.BACKEND_URL || 'http://localhost:3009' },
    ]);
    expect(response.body.paths['/test-resources'].get.tags).toContain(
      'Test resources',
    );
    expect(response.body.paths['/test-resources'].get.summary).toBe('List');
    expect(response.body.tags).toContainEqual(
      expect.objectContaining({ name: 'System' }),
    );
    expect(response.body.paths['/test-resources'].get.security).toContainEqual({
      bearer: [],
    });
    expect(response.body.components.securitySchemes.bearer).toMatchObject({
      type: 'http',
      scheme: 'bearer',
    });
  });

  it('serves a read-only Swagger UI configured to use /openapi.json', async () => {
    await request(app.getHttpServer()).get(SWAGGER_UI_PATH).expect(200);
    const initializer = await request(app.getHttpServer())
      .get(`${SWAGGER_UI_PATH}/swagger-ui-init.js`)
      .expect(200);

    expect(initializer.text).toContain(`"url": "${OPENAPI_JSON_PATH}"`);
    expect(initializer.text).toContain('"supportedSubmitMethods": []');
    expect(initializer.text).toContain('"tryItOutEnabled": false');
  });
});
