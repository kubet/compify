import { BadRequestException } from '@nestjs/common';
import { uuidToShortId } from 'src/common/short-id';
import { ComponentVisibility } from 'src/entities/project/component.entity';
import { ComponentService } from './component.service';

const originalId = '11111111-1111-4111-8111-111111111111';
const forkId = '22222222-2222-4222-8222-222222222222';
const user = { id: 'user-id' } as any;

function fixture(
  theme: any,
  code = '{"/index.tsx":{"code":"export default null","main":true}}',
) {
  const original = {
    id: originalId,
    name: 'Card',
    visibility: ComponentVisibility.PUBLIC,
    publishingDomain: 'publisher.example',
    imageUploaded: true,
    themes: theme ? [theme] : [],
  };
  const qb: any = {
    leftJoinAndSelect: jest.fn(),
    where: jest.fn(),
    getOne: jest.fn().mockResolvedValue(original),
  };
  qb.leftJoinAndSelect.mockReturnValue(qb);
  qb.where.mockReturnValue(qb);
  const componentRepository: any = {
    createQueryBuilder: jest.fn().mockReturnValue(qb),
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => ({ ...value, id: forkId })),
    delete: jest.fn(),
  };
  const themeRepository: any = { save: jest.fn(async (value) => value) };
  const minioService: any = {
    getFile: jest.fn().mockResolvedValue({ buffer: Buffer.from(code) }),
    uploadFile: jest.fn(),
    deleteFile: jest.fn(),
  };
  const limiterService: any = { componentUsage: jest.fn() };
  const service = new ComponentService(
    componentRepository,
    {} as any,
    themeRepository,
    {} as any,
    {} as any,
    minioService,
    limiterService,
    {} as any,
    {} as any,
  );
  return {
    service,
    componentRepository,
    themeRepository,
    minioService,
    limiterService,
  };
}

describe('ComponentService authored-theme fork boundary', () => {
  it('validates first and persists a fresh version-one sanitized theme', async () => {
    const originalTheme = {
      id: '33333333-3333-4333-8333-333333333333',
      name: 'Brand',
      version: 19,
      componentId: originalId,
      factors: [{ key: 'hue', type: 'hue', value: 10, c: 11 }],
      groups: {
        mode: {
          type: 'values',
          options: [{ key: 'light', value: 'light', c: 'compiled' }],
        },
      },
      values: [{ key: 'primary', value: '--hue', c: '--hue' }],
      createdAt: new Date(),
    };
    const f = fixture(originalTheme);
    await expect(
      f.service.fork({ componentId: uuidToShortId(originalId) }, user),
    ).resolves.toMatchObject({ id: uuidToShortId(forkId) });

    expect(
      f.limiterService.componentUsage.mock.invocationCallOrder[0],
    ).toBeLessThan(f.componentRepository.save.mock.invocationCallOrder[0]);
    expect(f.componentRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        publishingDomain: null,
        imageUploaded: false,
        visibility: ComponentVisibility.DRAFT,
      }),
    );
    const [[savedThemes]] = f.themeRepository.save.mock.calls;
    expect(savedThemes).toHaveLength(1);
    expect(savedThemes[0]).toMatchObject({
      name: 'Brand',
      componentId: forkId,
      version: 1,
      factors: [{ key: 'hue', type: 'hue', value: 10 }],
      groups: {
        mode: { type: 'values', options: [{ key: 'light', value: 'light' }] },
      },
      values: [{ key: 'primary', value: '--hue' }],
    });
    expect(savedThemes[0]).not.toHaveProperty('id');
    expect(savedThemes[0]).not.toHaveProperty('createdAt');
    const [, uploaded, bucket] = f.minioService.uploadFile.mock.calls[0];
    expect(bucket).toBe('components');
    expect(uploaded.buffer.toString()).toBe(
      '{"/index.tsx":{"code":"export default null","main":true}}',
    );
    expect(uploaded.size).toBe(uploaded.buffer.length);
  });

  it.each([
    {
      code: '{"/index.tsx":{"code":"ok","main":true}}',
      theme: {
        name: 'Bad',
        factors: [{ key: 'x', type: 'unknown', value: 1 }],
        groups: {},
        values: [],
      },
    },
    { code: 'not json', theme: null },
  ])(
    'rejects invalid source before quota or any save %#',
    async ({ code, theme }) => {
      const f = fixture(theme, code);
      await expect(
        f.service.fork({ componentId: uuidToShortId(originalId) }, user),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(f.limiterService.componentUsage).not.toHaveBeenCalled();
      expect(f.componentRepository.save).not.toHaveBeenCalled();
      expect(f.themeRepository.save).not.toHaveBeenCalled();
      expect(f.minioService.uploadFile).not.toHaveBeenCalled();
    },
  );

  it('rejects a missing source object before quota or metadata writes', async () => {
    const f = fixture(null);
    f.minioService.getFile.mockResolvedValue(undefined);
    await expect(
      f.service.fork({ componentId: uuidToShortId(originalId) }, user),
    ).rejects.toThrow('Component source is unavailable');
    expect(f.limiterService.componentUsage).not.toHaveBeenCalled();
    expect(f.componentRepository.save).not.toHaveBeenCalled();
  });

  it('removes the fork component if the theme write fails', async () => {
    const theme = {
      name: 'Brand',
      factors: [],
      groups: {},
      values: [],
    };
    const f = fixture(theme);
    f.themeRepository.save.mockRejectedValue(new Error('theme write failed'));
    await expect(
      f.service.fork({ componentId: uuidToShortId(originalId) }, user),
    ).rejects.toThrow('theme write failed');
    expect(f.componentRepository.delete).toHaveBeenCalledWith(forkId);
    expect(f.minioService.uploadFile).not.toHaveBeenCalled();
  });

  it('removes a partial object and database rows if source upload fails', async () => {
    const f = fixture(null);
    f.minioService.uploadFile.mockRejectedValue(new Error('storage failed'));
    await expect(
      f.service.fork({ componentId: uuidToShortId(originalId) }, user),
    ).rejects.toThrow('storage failed');
    expect(f.minioService.deleteFile).toHaveBeenCalledWith(
      'components',
      forkId,
    );
    expect(f.componentRepository.delete).toHaveBeenCalledWith(forkId);
  });
});
