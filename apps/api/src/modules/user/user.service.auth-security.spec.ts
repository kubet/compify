import { BadRequestException } from '@nestjs/common';
import { UserService } from './user.service';

function service(userRepo: any, tokenRepo: any = {}) {
  return new UserService(
    {} as any,
    userRepo,
    tokenRepo,
    {} as any,
    {} as any,
    { isConfigured: () => false } as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
  );
}

describe('UserService auth token boundaries', () => {
  it.each([null, { email: 'person@example.com' }])(
    'returns the same forgot-password response regardless of account existence',
    async (found) => {
      const qb: any = {
        where: jest.fn(),
        getOne: jest.fn().mockResolvedValue(found),
      };
      qb.where.mockReturnValue(qb);
      const instance = service({ createQueryBuilder: () => qb });
      jest.spyOn(instance, 'sendResetPassword').mockResolvedValue({} as any);
      await expect(
        instance.resetPasswordUser('Person@Example.com'),
      ).resolves.toEqual({
        message: 'If an account exists, a password reset email has been sent',
      });
      if (found)
        expect(instance.sendResetPassword).toHaveBeenCalledWith(
          'person@example.com',
        );
      else expect(instance.sendResetPassword).not.toHaveBeenCalled();
    },
  );

  it('does not expose reset cooldown failures', async () => {
    const qb: any = {
      where: jest.fn(),
      getOne: jest.fn().mockResolvedValue({ email: 'a@b.com' }),
    };
    qb.where.mockReturnValue(qb);
    const instance = service({ createQueryBuilder: () => qb });
    jest
      .spyOn(instance, 'sendResetPassword')
      .mockRejectedValue(new Error('cooldown'));
    await expect(instance.resetPasswordUser('a@b.com')).resolves.toHaveProperty(
      'message',
    );
  });

  it('atomically consumes an unexpired email-change token and bumps sessions', async () => {
    const update = jest.fn().mockResolvedValue(undefined);
    const execute = jest.fn().mockResolvedValue({ affected: 1 });
    const chain: any = {};
    for (const name of ['delete', 'from', 'where', 'andWhere', 'returning'])
      chain[name] = jest.fn().mockReturnValue(chain);
    chain.execute = execute;
    const manager = {
      createQueryBuilder: () => chain,
      getRepository: () => ({ update }),
    };
    const userRepo = {
      manager: { transaction: (callback: any) => callback(manager) },
    };
    const instance = service(userRepo);
    await expect(
      instance.changeVerifyEmail(' New@Example.com ', '1234567', {
        id: 'u1',
      } as any),
    ).resolves.toEqual({ email: 'new@example.com', changed: true });
    expect(update).toHaveBeenCalledWith(
      { id: 'u1' },
      expect.objectContaining({
        email: 'new@example.com',
        sessionVersion: expect.any(Function),
      }),
    );
  });

  it('rejects a replayed or expired email-change token', async () => {
    const chain: any = {};
    for (const name of ['delete', 'from', 'where', 'andWhere', 'returning'])
      chain[name] = jest.fn().mockReturnValue(chain);
    chain.execute = jest.fn().mockResolvedValue({ affected: 0 });
    const manager = { createQueryBuilder: () => chain };
    const instance = service({
      manager: { transaction: (callback: any) => callback(manager) },
    });
    await expect(
      instance.changeVerifyEmail('new@example.com', 'used', {
        id: 'u1',
      } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
