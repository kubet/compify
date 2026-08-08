import { LimiterService } from './limiter.service';

describe('LimiterService AI credit reservations', () => {
  const subscriptionQuery = (
    result: unknown = { subscriptionId: 'subscription' },
  ) => ({
    leftJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getRawOne: jest.fn().mockResolvedValue(result),
  });
  const updateQuery = (affected = 1, reject?: Error) => ({
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    execute: reject
      ? jest.fn().mockRejectedValue(reject)
      : jest.fn().mockResolvedValue({ affected }),
  });
  const serviceWith = (...queries: any[]) => {
    const userRepository = { createQueryBuilder: jest.fn() };
    queries.forEach((query) =>
      userRepository.createQueryBuilder.mockReturnValueOnce(query),
    );
    return {
      service: new LimiterService(
        userRepository as any,
        {} as any,
        {} as any,
        {} as any,
      ),
      userRepository,
    };
  };

  it('uses an awaited conditional decrement that cannot make credits negative', async () => {
    const update = updateQuery();
    const { service } = serviceWith(subscriptionQuery(), update);
    const reservation = await service.reserveAiCredits('user', 3, 'paid');
    expect(update.andWhere).toHaveBeenCalledWith(
      '"availableAiCredits" >= :credits',
      { credits: 3 },
    );
    expect(update.execute).toHaveBeenCalledTimes(1);
    expect(reservation).toMatchObject({ credits: 3, active: true });
  });

  it('rejects a user without an actual subscription row', async () => {
    const { service } = serviceWith(
      subscriptionQuery({ subscriptionId: null }),
    );
    await expect(
      service.reserveAiCredits('user', 1, 'paid'),
    ).rejects.toMatchObject({
      status: 404,
    });
  });

  it('does not create a reservation when the conditional update loses a race', async () => {
    const { service } = serviceWith(subscriptionQuery(), updateQuery(0));
    await expect(
      service.reserveAiCredits('user', 1, 'paid'),
    ).rejects.toMatchObject({ status: 402 });
  });

  it('applies a successful refund at most once', async () => {
    const update = updateQuery();
    const { service } = serviceWith(update);
    const reservation = {
      userId: 'user',
      credits: 2,
      kind: 'free' as const,
      active: true,
    };
    await expect(service.refundAiCreditReservation(reservation)).resolves.toBe(
      true,
    );
    await expect(service.refundAiCreditReservation(reservation)).resolves.toBe(
      false,
    );
    expect(update.execute).toHaveBeenCalledTimes(1);
  });

  it('guards duplicate refunds and reactivates a reservation when the DB refund fails', async () => {
    const failedUpdate = updateQuery(0, new Error('db unavailable'));
    const { service } = serviceWith(failedUpdate);
    const reservation = {
      userId: 'user',
      credits: 1,
      kind: 'paid' as const,
      active: true,
    };
    await expect(
      service.refundAiCreditReservation(reservation),
    ).rejects.toThrow('db unavailable');
    expect(reservation.active).toBe(true);
  });

  it('partially refunds a max reservation when the cheaper model succeeds', async () => {
    const update = updateQuery();
    const { service } = serviceWith(update);
    const reservation = {
      userId: 'user',
      credits: 3,
      kind: 'paid' as const,
      active: true,
    };
    await expect(
      service.settleAiCreditReservation(reservation, 1),
    ).resolves.toBe(true);
    const setter = update.set.mock.calls[0][0].availableAiCredits;
    expect(setter()).toBe('"availableAiCredits" + 2');
    expect(reservation.active).toBe(false);
  });
});
