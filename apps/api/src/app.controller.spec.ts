import { ServiceUnavailableException } from '@nestjs/common';
import { AppController } from './app.controller';

const service = { checkReadiness: jest.fn() };
const controller = new AppController(service as any);

describe('AppController readiness', () => {
  beforeEach(() => service.checkReadiness.mockReset());

  it('reports ready after dependency checks pass', async () => {
    service.checkReadiness.mockResolvedValue(undefined);
    await expect(controller.readinessCheck()).resolves.toEqual({
      status: 'ready',
    });
  });

  it('returns 503 without leaking dependency details', async () => {
    service.checkReadiness.mockRejectedValue(new Error('database password'));
    await expect(controller.readinessCheck()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('publishes the AGPL corresponding-source offer', () => {
    const previousRevision = process.env.SOURCE_REVISION;
    const previousUrl = process.env.SOURCE_URL;
    process.env.SOURCE_REVISION = 'a'.repeat(40);
    delete process.env.SOURCE_URL;
    expect(controller.sourceOffer()).toEqual({
      license: 'AGPL-3.0-only',
      source: `https://github.com/kubet/compify/tree/${'a'.repeat(40)}`,
      revision: 'a'.repeat(40),
    });
    if (previousRevision === undefined) delete process.env.SOURCE_REVISION;
    else process.env.SOURCE_REVISION = previousRevision;
    if (previousUrl === undefined) delete process.env.SOURCE_URL;
    else process.env.SOURCE_URL = previousUrl;
  });
});
