import { BadRequestException } from '@nestjs/common';

// Keep this controller unit test independent of its service dependency graphs.
jest.mock('./component.service', () => ({ ComponentService: class {} }));
jest.mock('../minio/minio.service', () => ({ MinioClientService: class {} }));
jest.mock('./construct-image.service', () => ({
  ConstructImageService: class {},
}));

import { ComponentController } from './component.controller';

describe('ComponentController animated image validation', () => {
  const componentService = {
    checkIfUserIsOwnerOrThrow403: jest.fn(),
    updateComponentImageUploaded: jest.fn(),
    checkDomain: jest.fn(),
  };
  const minioService = { uploadFile: jest.fn(), getFile: jest.fn() };
  const constructImageService = { constructAnimatedImg: jest.fn() };
  let controller: ComponentController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new ComponentController(
      componentService as any,
      minioService as any,
      constructImageService as any,
    );
  });

  it.each([
    undefined,
    null,
    'not-an-array',
    { length: 1, 0: 'capture' },
    [],
    [42],
    [''],
    ['1', '2', '3', '4', '5', '6'],
  ])(
    'rejects malformed captures without using attacker-controlled length (%p)',
    async (captures) => {
      await expect(
        controller.getAnimatedImg(captures as any, 'component-id', {} as any),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(
        componentService.checkIfUserIsOwnerOrThrow403,
      ).not.toHaveBeenCalled();
      expect(constructImageService.constructAnimatedImg).not.toHaveBeenCalled();
    },
  );

  it('rejects a non-string component id before calling services', async () => {
    await expect(
      controller.getAnimatedImg(['capture'], {} as any, {} as any),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(
      componentService.checkIfUserIsOwnerOrThrow403,
    ).not.toHaveBeenCalled();
  });

  it('accepts a validated capture array', async () => {
    componentService.checkIfUserIsOwnerOrThrow403.mockResolvedValue(undefined);
    constructImageService.constructAnimatedImg.mockResolvedValue(
      'data:image/gif;base64,YQ==',
    );
    minioService.uploadFile.mockResolvedValue(undefined);
    componentService.updateComponentImageUploaded.mockResolvedValue(undefined);

    await expect(
      controller.getAnimatedImg(['capture'], 'component-id', {} as any),
    ).resolves.toEqual({ message: 'File uploaded successfully' });
    expect(constructImageService.constructAnimatedImg).toHaveBeenCalledWith([
      'capture',
    ]);
  });
  it('validates and uploads a real WebP under the Node runtime', async () => {
    const buffer = Buffer.from(
      'UklGRjwAAABXRUJQVlA4IDAAAADQAQCdASoCAAIAAUAmJaACdLoB+AADsAD+8ut//NgVzXPv9//S4P0uD9Lg/9KQAAA=',
      'base64',
    );
    componentService.checkIfUserIsOwnerOrThrow403.mockResolvedValue(undefined);
    minioService.uploadFile.mockResolvedValue(undefined);
    componentService.updateComponentImageUploaded.mockResolvedValue(undefined);

    await expect(
      controller.uploadFile(
        {
          buffer,
          size: buffer.length,
          mimetype: 'image/webp',
        } as Express.Multer.File,
        'component-id',
        { id: 'owner' } as any,
      ),
    ).resolves.toEqual({ message: 'File uploaded successfully' });
    expect(minioService.uploadFile).toHaveBeenCalled();
  });

  it('forwards domain checks with the authenticated user boundary', async () => {
    const user = { id: 'user-id', username: 'alice' } as any;
    componentService.checkDomain.mockResolvedValue({ available: true });
    await expect(
      controller.checkDomain('button', 'component-id', user),
    ).resolves.toEqual({
      available: true,
    });
    expect(componentService.checkDomain).toHaveBeenCalledWith(
      'button',
      'component-id',
      user,
    );
  });

  it("does not read another user's private component image", async () => {
    componentService.checkIfUserIsOwnerOrThrow403.mockRejectedValue(
      new Error('not owner'),
    );
    const response = {
      status: jest.fn(),
      json: jest.fn(),
    };
    response.status.mockReturnValue(response);

    await controller.getImage(
      'victim-component',
      { id: 'attacker' } as any,
      response as any,
    );

    expect(componentService.checkIfUserIsOwnerOrThrow403).toHaveBeenCalledWith(
      'victim-component',
      { id: 'attacker' },
    );
    expect((minioService as any).getFile).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(404);
  });
});
