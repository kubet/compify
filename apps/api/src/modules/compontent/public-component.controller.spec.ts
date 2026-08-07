import { UnauthorizedException } from '@nestjs/common';

// Avoid loading service dependency graphs; this is a controller unit test.
jest.mock('./component.service', () => ({ ComponentService: class {} }));
jest.mock('../minio/minio.service', () => ({ MinioClientService: class {} }));

import { PublicComponentController } from './public-component.controller';

describe('PublicComponentController security behavior', () => {
  const componentService = {
    getAllComponentIdsForSitemap: jest.fn(),
    checkIfComponentIsPublicOrThrow404: jest.fn(),
  };
  const minioService = { getFile: jest.fn() };
  const configService = { get: jest.fn() };
  let controller: PublicComponentController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new PublicComponentController(
      minioService as any,
      componentService as any,
      configService as any,
    );
  });

  it('throws a real 401 and does not query sitemap data for a bad key', async () => {
    configService.get.mockReturnValue('expected');

    await expect(
      controller.getAllComponentsForSitemap({ 'x-api-key': 'wrong' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(
      componentService.getAllComponentIdsForSitemap,
    ).not.toHaveBeenCalled();
  });

  it('returns immediately after an image 404', async () => {
    minioService.getFile.mockResolvedValue({
      buffer: null,
      mimetype: 'image/webp',
    });
    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnValue('404 response'),
      setHeader: jest.fn(),
      end: jest.fn(),
      headersSent: false,
    };

    await expect(
      controller.getImage('public-id', response as any),
    ).resolves.toBe('404 response');
    expect(response.status).toHaveBeenCalledWith(404);
    expect(response.setHeader).not.toHaveBeenCalled();
    expect(response.end).not.toHaveBeenCalled();
  });
});
