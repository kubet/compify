import { ComponentService } from './component.service';
import {
  ComponentVisibility,
  RuntimeLanguage,
} from 'src/entities/project/component.entity';
import { uuidToShortId } from 'src/common/short-id';

describe('ComponentService create compensation', () => {
  it('deletes a newly saved row if object upload fails', async () => {
    const availabilityQb: any = {
      where: jest.fn(),
      getOne: jest.fn().mockResolvedValue(null),
    };
    availabilityQb.where.mockReturnValue(availabilityQb);
    const componentRepo: any = {
      createQueryBuilder: jest.fn().mockReturnValue(availabilityQb),
      save: jest
        .fn()
        .mockResolvedValue({ id: 'uuid', publishingDomain: 'alice/card' }),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    const userQb: any = {
      leftJoinAndSelect: jest.fn(),
      where: jest.fn(),
      orderBy: jest.fn(),
      getOne: jest.fn().mockResolvedValue(null),
    };
    for (const method of ['leftJoinAndSelect', 'where', 'orderBy'])
      userQb[method].mockReturnValue(userQb);
    const minio = {
      uploadFile: jest.fn().mockRejectedValue(new Error('storage down')),
    };
    const service = new ComponentService(
      componentRepo,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      minio as any,
      { componentUsage: jest.fn().mockResolvedValue(undefined) } as any,
      {} as any,
      { createQueryBuilder: () => userQb } as any,
    );
    await expect(
      service.create(
        {
          name: 'Card',
          code: '{}',
          publishingName: 'card',
          visibility: ComponentVisibility.PUBLIC,
          language: RuntimeLanguage.REACT_TS,
        },
        { id: 'user', username: 'alice' } as any,
      ),
    ).rejects.toThrow('storage down');
    expect(componentRepo.delete).toHaveBeenCalledWith('uuid');
  });

  it.each([ComponentVisibility.PUBLIC, ComponentVisibility.FREE])(
    'stages %s as PRIVATE and promotes only after source upload',
    async (desiredVisibility) => {
      const availabilityQb: any = {
        where: jest.fn(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      availabilityQb.where.mockReturnValue(availabilityQb);
      const componentRepo: any = {
        createQueryBuilder: jest.fn().mockReturnValue(availabilityQb),
        save: jest.fn().mockImplementation(async (entity) => ({
          id: '11111111-1111-4111-8111-111111111111',
          ...entity,
        })),
        delete: jest.fn(),
      };
      const userQb: any = {
        leftJoinAndSelect: jest.fn(),
        where: jest.fn(),
        orderBy: jest.fn(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      for (const method of ['leftJoinAndSelect', 'where', 'orderBy'])
        userQb[method].mockReturnValue(userQb);
      const minio = { uploadFile: jest.fn().mockResolvedValue(undefined) };
      const service = new ComponentService(
        componentRepo,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        minio as any,
        { componentUsage: jest.fn().mockResolvedValue(undefined) } as any,
        {} as any,
        { createQueryBuilder: () => userQb } as any,
      );
      const result = await service.create(
        {
          name: 'Card',
          code: '{}',
          publishingName: 'card',
          visibility: desiredVisibility,
          language: RuntimeLanguage.REACT_TS,
        },
        { id: 'user', username: 'alice' } as any,
      );
      expect(componentRepo.save.mock.calls[0][0].visibility).toBe(
        ComponentVisibility.PRIVATE,
      );
      expect(componentRepo.save.mock.calls[1][0].visibility).toBe(
        desiredVisibility,
      );
      expect(componentRepo.save.mock.invocationCallOrder[0]).toBeLessThan(
        minio.uploadFile.mock.invocationCallOrder[0],
      );
      expect(minio.uploadFile.mock.invocationCallOrder[0]).toBeLessThan(
        componentRepo.save.mock.invocationCallOrder[1],
      );
      expect(result.visibility).toBe(desiredVisibility);
    },
  );

  it('restores the previous entity if an update upload fails', async () => {
    const uuid = '11111111-1111-4111-8111-111111111111';
    const previous: any = {
      id: uuid,
      name: 'Before',
      description: 'old',
      publishingDomain: 'alice/card',
      language: RuntimeLanguage.REACT,
      visibility: ComponentVisibility.PRIVATE,
      user: { id: 'user' },
    };
    const availabilityQb: any = {
      where: jest.fn(),
      andWhere: jest.fn(),
      getOne: jest.fn().mockResolvedValue(null),
    };
    const ownerQb: any = {
      leftJoinAndSelect: jest.fn(),
      where: jest.fn(),
      getOne: jest.fn().mockResolvedValue(previous),
    };
    for (const qb of [availabilityQb, ownerQb]) {
      for (const method of ['where', 'andWhere', 'leftJoinAndSelect'])
        if (qb[method]) qb[method].mockReturnValue(qb);
    }
    const componentRepo: any = {
      createQueryBuilder: jest
        .fn()
        .mockReturnValueOnce(availabilityQb)
        .mockReturnValueOnce(ownerQb),
      save: jest
        .fn()
        .mockResolvedValueOnce({ ...previous, name: 'After' })
        .mockResolvedValueOnce(previous),
      delete: jest.fn(),
    };
    const userQb: any = {
      leftJoinAndSelect: jest.fn(),
      where: jest.fn(),
      orderBy: jest.fn(),
      getOne: jest.fn().mockResolvedValue(null),
    };
    for (const method of ['leftJoinAndSelect', 'where', 'orderBy'])
      userQb[method].mockReturnValue(userQb);
    const service = new ComponentService(
      componentRepo,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {
        uploadFile: jest.fn().mockRejectedValue(new Error('storage down')),
      } as any,
      {} as any,
      {} as any,
      { createQueryBuilder: () => userQb } as any,
    );
    await expect(
      service.create(
        {
          id: uuidToShortId(uuid),
          name: 'After',
          code: '{}',
          publishingName: 'card',
          visibility: ComponentVisibility.PUBLIC,
          language: RuntimeLanguage.REACT_TS,
        },
        { id: 'user', username: 'alice' } as any,
      ),
    ).rejects.toThrow('storage down');
    expect(componentRepo.save).toHaveBeenLastCalledWith(previous);
    expect(componentRepo.delete).not.toHaveBeenCalled();
  });
});
