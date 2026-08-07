import * as crypto from 'crypto';
import { UserService } from './user.service';
import { TokenType } from 'src/entities/user/token.entity';

describe('UserService cryptographic randomness', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const createService = ({
    userRepo = {},
    tokenRepo = {},
    emailService = {},
  }: {
    userRepo?: any;
    tokenRepo?: any;
    emailService?: any;
  } = {}) =>
    new UserService(
      {} as any,
      userRepo,
      tokenRepo,
      {} as any,
      {} as any,
      emailService,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );

  it('generates a uniformly distributed seven-digit verification token', async () => {
    const queryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
    };
    const tokenRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      save: jest.fn().mockResolvedValue(undefined),
    };
    const emailService = { sendEmail: jest.fn() };
    const randomInt = jest.spyOn(
      crypto,
      'randomInt',
    ) as unknown as jest.SpyInstance<number, [number, number]>;
    randomInt.mockReturnValue(1_234_567);
    const service = createService({ tokenRepo, emailService });

    await service.sendRegisterEmail('User@Example.com', 'User');

    expect(randomInt).toHaveBeenCalledWith(1_000_000, 10_000_000);
    expect(tokenRepo.save).toHaveBeenCalledWith({
      email: 'user@example.com',
      token: '1234567',
      type: TokenType.EMAIL_VERIFICATION,
    });
  });

  it('uses cryptographic randomness when the email has no usable local part', async () => {
    const userRepo = { findOneBy: jest.fn().mockResolvedValue(null) };
    const randomInt = jest.spyOn(
      crypto,
      'randomInt',
    ) as unknown as jest.SpyInstance<number, [number, number]>;
    randomInt.mockReturnValue(42);
    const service = createService({ userRepo });

    await expect(
      (service as any).generateUniqueUsername('@example.com'),
    ).resolves.toBe('user42');
    expect(randomInt).toHaveBeenCalledWith(0, 10_000);
  });

  it('uses progressively larger cryptographic suffixes for collisions', async () => {
    const userRepo = {
      findOneBy: jest
        .fn()
        .mockResolvedValueOnce({ id: 'existing' })
        .mockResolvedValueOnce(null),
    };
    const randomInt = jest.spyOn(
      crypto,
      'randomInt',
    ) as unknown as jest.SpyInstance<number, [number, number]>;
    randomInt.mockReturnValue(73);
    const service = createService({ userRepo });

    await expect(
      (service as any).generateUniqueUsername('alice@example.com'),
    ).resolves.toBe('alice73');
    expect(randomInt).toHaveBeenCalledWith(0, 100);
  });

  it('uses cryptographic randomness in the last-resort unique username', async () => {
    const userRepo = {
      findOneBy: jest.fn().mockResolvedValue({ id: 'existing' }),
    };
    const randomInt = jest.spyOn(
      crypto,
      'randomInt',
    ) as unknown as jest.SpyInstance<number, [number, number]>;
    randomInt
      .mockReturnValueOnce(1)
      .mockReturnValueOnce(2)
      .mockReturnValueOnce(3)
      .mockReturnValueOnce(4)
      .mockReturnValueOnce(5)
      .mockReturnValueOnce(9);
    jest.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);
    const service = createService({ userRepo });

    await expect(
      (service as any).generateUniqueUsername('alice@example.com'),
    ).resolves.toBe('user17000000000009');
    expect(randomInt).toHaveBeenLastCalledWith(0, 1_000);
  });
});
