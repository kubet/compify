import { NotFoundException } from '@nestjs/common';
import { ComponentService } from './component.service';
import { ComponentVisibility } from 'src/entities/project/component.entity';

describe('ComponentService authorization boundaries', () => {
  it.each([ComponentVisibility.PRIVATE, ComponentVisibility.DRAFT])(
    'does not allow voting on a %s component',
    async (visibility) => {
      const qb: any = {
        where: jest.fn(),
        getOne: jest.fn().mockResolvedValue({
          id: '00000000-0000-0000-0000-000000000001',
          visibility,
          upvotesCount: 0,
        }),
      };
      qb.where.mockReturnValue(qb);
      const componentRepository: any = {
        createQueryBuilder: jest.fn().mockReturnValue(qb),
        save: jest.fn(),
      };
      const upvoteRepository: any = {
        createQueryBuilder: jest.fn(),
        save: jest.fn(),
      };
      const service = new ComponentService(
        componentRepository,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        upvoteRepository,
        {} as any,
      );

      await expect(
        service.upvote(
          { id: '1111111111111111111111', status: 'upvote' as any },
          { id: 'attacker' } as any,
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(upvoteRepository.createQueryBuilder).not.toHaveBeenCalled();
      expect(componentRepository.save).not.toHaveBeenCalled();
    },
  );

  it('does not generate an OG image before update ownership is verified', async () => {
    const availabilityQb: any = {
      where: jest.fn(),
      andWhere: jest.fn(),
      getOne: jest.fn().mockResolvedValue(null),
    };
    const ownerQb: any = {
      leftJoinAndSelect: jest.fn(),
      where: jest.fn(),
      getOne: jest.fn().mockResolvedValue(null),
    };
    for (const qb of [availabilityQb, ownerQb]) {
      for (const method of ['where', 'andWhere', 'leftJoinAndSelect']) {
        if (qb[method]) qb[method].mockReturnValue(qb);
      }
    }
    const componentRepository: any = {
      createQueryBuilder: jest
        .fn()
        .mockReturnValueOnce(availabilityQb)
        .mockReturnValueOnce(ownerQb),
      save: jest.fn(),
    };
    const constructImageService = { constructOGImage: jest.fn() };
    const userQb: any = {
      leftJoinAndSelect: jest.fn(),
      where: jest.fn(),
      orderBy: jest.fn(),
      getOne: jest.fn().mockResolvedValue(null),
    };
    for (const method of ['leftJoinAndSelect', 'where', 'orderBy'])
      userQb[method].mockReturnValue(userQb);
    const service = new ComponentService(
      componentRepository,
      constructImageService as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      { createQueryBuilder: () => userQb } as any,
    );

    await expect(
      service.create(
        {
          id: '1111111111111111111111',
          name: 'Victim renamed',
          code: '{}',
          language: 'react' as any,
          visibility: ComponentVisibility.PUBLIC,
          isShared: true,
          publishingName: 'victim',
        },
        { id: 'attacker', username: 'attacker' } as any,
      ),
    ).rejects.toMatchObject({ status: 403 });
    expect(constructImageService.constructOGImage).not.toHaveBeenCalled();
    expect(componentRepository.save).not.toHaveBeenCalled();
  });

  it.each(['not json', 'null', '[]'])(
    'rejects malformed persisted source: %s',
    async (code) => {
      const componentRepository = { save: jest.fn() };
      const service = new ComponentService(
        componentRepository as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
        {} as any,
      );
      await expect(
        service.create({ name: 'Broken', code, language: 'react' as any }, {
          id: 'user',
        } as any),
      ).rejects.toMatchObject({ status: 400 });
      expect(componentRepository.save).not.toHaveBeenCalled();
    },
  );
});
