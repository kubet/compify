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
      {
        getFile: jest.fn().mockResolvedValue({ buffer: Buffer.from('{bad') }),
      } as any,
      { get: () => 'https://web.test' } as any,
    );
    await expect(controller.item('alice', 'broken')).rejects.toMatchObject({
      status: 404,
    });
  });
});
