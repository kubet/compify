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
});
