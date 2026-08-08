import { RegistryController } from './registry.controller';
import { ComponentVisibility } from 'src/entities/project/component.entity';

describe('RegistryController visibility', () => {
  it('excludes FREE/unlisted components from the registry index', async () => {
    const qb: any = {
      leftJoinAndSelect: jest.fn(),
      where: jest.fn(),
      andWhere: jest.fn(),
      orderBy: jest.fn(),
      getMany: jest.fn().mockResolvedValue([]),
    };
    for (const method of ['leftJoinAndSelect', 'where', 'andWhere', 'orderBy'])
      qb[method].mockReturnValue(qb);
    const controller = new RegistryController(
      { createQueryBuilder: () => qb } as any,
      {} as any,
      {} as any,
      { get: () => 'https://web.test' } as any,
    );
    await controller.index();
    expect(qb.where).toHaveBeenCalledWith(
      'component.visibility = :visibility',
      { visibility: ComponentVisibility.PUBLIC },
    );
  });

  it('continues allowing a FREE component through direct lookup', async () => {
    const component: any = {
      id: 'id',
      name: 'X',
      visibility: ComponentVisibility.FREE,
      publishingDomain: 'alice/x',
      usedDeps: {},
      user: { username: 'alice' },
    };
    const qb: any = {
      leftJoinAndSelect: jest.fn(),
      where: jest.fn(),
      getOne: jest.fn().mockResolvedValue(component),
    };
    for (const method of ['leftJoinAndSelect', 'where'])
      qb[method].mockReturnValue(qb);
    const controller = new RegistryController(
      { createQueryBuilder: () => qb } as any,
      {} as any,
      {
        getFile: jest.fn().mockResolvedValue({ buffer: Buffer.from('{}') }),
      } as any,
      { get: () => 'https://web.test' } as any,
    );
    await expect(controller.item('alice', 'x')).resolves.toMatchObject({
      name: 'alice/x',
    });
  });

  it('returns a controlled not-found response for malformed stored source', async () => {
    const component: any = {
      id: 'id',
      name: 'Broken',
      visibility: ComponentVisibility.PUBLIC,
      publishingDomain: 'alice/broken',
      usedDeps: {},
      user: { username: 'alice' },
    };
    const qb: any = {
      leftJoinAndSelect: jest.fn(),
      where: jest.fn(),
      getOne: jest.fn().mockResolvedValue(component),
    };
    for (const method of ['leftJoinAndSelect', 'where'])
      qb[method].mockReturnValue(qb);
    const controller = new RegistryController(
      { createQueryBuilder: () => qb } as any,
      {} as any,
      {
        getFile: jest.fn().mockResolvedValue({ buffer: Buffer.from('{bad') }),
      } as any,
      { get: () => 'https://web.test' } as any,
    );
    await expect(controller.item('alice', 'broken')).rejects.toMatchObject({
      status: 404,
    });
  });

  it('serves a private item only to its owning Bearer token', async () => {
    const component: any = {
      id: 'id',
      name: 'Secret',
      visibility: ComponentVisibility.PRIVATE,
      publishingDomain: 'alice/secret',
      usedDeps: {},
      user: { id: 'alice-id', username: 'alice' },
    };
    const componentQb: any = {
      leftJoinAndSelect: jest.fn(),
      where: jest.fn(),
      getOne: jest.fn().mockResolvedValue(component),
    };
    componentQb.leftJoinAndSelect.mockReturnValue(componentQb);
    componentQb.where.mockReturnValue(componentQb);
    const tokenQb: any = {
      addSelect: jest.fn(),
      leftJoinAndSelect: jest.fn(),
      where: jest.fn(),
      getOne: jest.fn().mockResolvedValue({
        token: 'stored',
        user: { id: 'alice-id', username: 'alice' },
      }),
    };
    for (const method of ['addSelect', 'leftJoinAndSelect', 'where'])
      tokenQb[method].mockReturnValue(tokenQb);
    const tokenRepo = {
      createQueryBuilder: () => tokenQb,
      save: jest.fn().mockResolvedValue(undefined),
    };
    const controller = new RegistryController(
      { createQueryBuilder: () => componentQb } as any,
      tokenRepo as any,
      {
        getFile: jest.fn().mockResolvedValue({ buffer: Buffer.from('{}') }),
      } as any,
      { get: () => 'https://web.test' } as any,
    );
    await expect(
      controller.item('alice', 'secret', `Bearer cli_${'a'.repeat(64)}`),
    ).resolves.toMatchObject({ name: 'alice/secret' });
    expect(tokenRepo.save).toHaveBeenCalled();
  });

  it('does not reveal a private item without a valid owner token', async () => {
    const component: any = {
      id: 'id',
      name: 'Secret',
      visibility: ComponentVisibility.PRIVATE,
      publishingDomain: 'alice/secret',
      usedDeps: {},
      user: { id: 'alice-id', username: 'alice' },
    };
    const qb: any = {
      leftJoinAndSelect: jest.fn(),
      where: jest.fn(),
      getOne: jest.fn().mockResolvedValue(component),
    };
    qb.leftJoinAndSelect.mockReturnValue(qb);
    qb.where.mockReturnValue(qb);
    const controller = new RegistryController(
      { createQueryBuilder: () => qb } as any,
      {} as any,
      {} as any,
      { get: () => 'https://web.test' } as any,
    );
    await expect(controller.item('alice', 'secret')).rejects.toMatchObject({
      status: 404,
    });
  });

  it('preserves a CLI-published Storybook graph instead of legacy editor remapping', async () => {
    const storybook = {
      schemaVersion: 1,
      entry: 'src/Button.tsx',
      stories: [{ exportName: 'Primary' }],
      provenance: { storyPath: 'src/Button.stories.tsx' },
      digest: 'a'.repeat(64),
    };
    const component: any = {
      id: 'id',
      name: 'button',
      description: 'Reviewed',
      visibility: ComponentVisibility.PUBLIC,
      publishingDomain: 'alice/button',
      usedDeps: { global: { react: '^19.0.0' }, files: {} },
      pageSettings: { storybook },
      user: { id: 'alice-id', username: 'alice' },
    };
    const qb: any = {
      leftJoinAndSelect: jest.fn(),
      where: jest.fn(),
      getOne: jest.fn().mockResolvedValue(component),
    };
    qb.leftJoinAndSelect.mockReturnValue(qb);
    qb.where.mockReturnValue(qb);
    const controller = new RegistryController(
      { createQueryBuilder: () => qb } as any,
      {} as any,
      {
        getFile: jest.fn().mockResolvedValue({
          buffer: Buffer.from(
            JSON.stringify({
              'src/Button.tsx': { code: 'export const Button = () => null' },
            }),
          ),
        }),
      } as any,
      { get: () => 'https://web.test' } as any,
    );
    await expect(controller.item('alice', 'button')).resolves.toMatchObject({
      name: 'button',
      dependencies: ['react'],
      meta: { compify: storybook },
      files: [{ path: 'src/Button.tsx', type: 'registry:component' }],
    });
  });
});
