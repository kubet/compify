import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';

const config = { get: jest.fn().mockReturnValue('x'.repeat(32)) } as any;

describe('JwtStrategy session invalidation', () => {
  it('accepts the current session version', async () => {
    const user = { id: 'user-1', sessionVersion: 3 } as any;
    const strategy = new JwtStrategy(
      { getUserById: jest.fn().mockResolvedValue(user) } as any,
      config,
    );
    await expect(
      strategy.validate({ id: user.id, plan: 'free', sessionVersion: 3 }),
    ).resolves.toBe(user);
  });

  it('rejects tokens issued before a credential change', async () => {
    const user = { id: 'user-1', sessionVersion: 4 } as any;
    const strategy = new JwtStrategy(
      { getUserById: jest.fn().mockResolvedValue(user) } as any,
      config,
    );
    await expect(
      strategy.validate({ id: user.id, plan: 'free', sessionVersion: 3 }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
