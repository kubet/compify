import { ThrottlerException } from '@nestjs/throttler';
import {
  extractBearerToken,
  SubscriptionThrottlerGuard,
} from './subscription-throttler.guard';

function contextWith(authorization: unknown, user: unknown = { id: 'user-1' }) {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ headers: { authorization }, user }),
    }),
  } as any;
}

describe('SubscriptionThrottlerGuard authorization parsing', () => {
  const configService = { getOrThrow: jest.fn().mockReturnValue('jwt-secret') };
  it('extracts a normal bearer token case-insensitively', () => {
    expect(extractBearerToken('bearer token-value')).toBe('token-value');
  });

  it('rejects non-string, missing, and empty bearer values', () => {
    expect(extractBearerToken(['Bearer token'])).toBeNull();
    expect(extractBearerToken('Basic token')).toBeNull();
    expect(extractBearerToken('Bearer    ')).toBeNull();
  });

  it('handles a large adversarial whitespace header without a backtracking regex', () => {
    const header = `Bearer ${' '.repeat(250_000)}`;
    expect(extractBearerToken(header)).toBeNull();
  });

  it('rejects a token that fails cryptographic verification', async () => {
    const jwtService = {
      verifyAsync: jest.fn().mockRejectedValue(new Error('invalid signature')),
    };
    const guard = new SubscriptionThrottlerGuard(
      jwtService as any,
      configService as any,
    );

    await expect(
      guard.canActivate(contextWith('Bearer tampered-token')),
    ).rejects.toBeInstanceOf(ThrottlerException);
  });

  it('rejects malformed verified claims before using them', async () => {
    const jwtService = {
      verifyAsync: jest.fn().mockResolvedValue('not-an-object'),
    };
    const guard = new SubscriptionThrottlerGuard(
      jwtService as any,
      configService as any,
    );

    await expect(
      guard.canActivate(contextWith('Bearer token')),
    ).rejects.toBeInstanceOf(ThrottlerException);
  });

  it('rejects a valid token belonging to a different user', async () => {
    const jwtService = {
      verifyAsync: jest.fn().mockResolvedValue({
        id: 'other-user',
        plan: 'Visionary',
      }),
    };
    const guard = new SubscriptionThrottlerGuard(
      jwtService as any,
      configService as any,
    );

    await expect(
      guard.canActivate(contextWith('Bearer token')),
    ).rejects.toBeInstanceOf(ThrottlerException);
  });

  it('counts a request with cryptographically verified claims and user identity', async () => {
    const jwtService = {
      verifyAsync: jest.fn().mockResolvedValue({
        id: 'unique-user',
        plan: 'Entrepreneur',
      }),
    };
    const guard = new SubscriptionThrottlerGuard(
      jwtService as any,
      configService as any,
    );

    await expect(
      guard.canActivate(contextWith('Bearer token', { id: 'unique-user' })),
    ).resolves.toBe(true);
    expect(jwtService.verifyAsync).toHaveBeenCalledWith('token', {
      secret: 'jwt-secret',
    });
  });
});
