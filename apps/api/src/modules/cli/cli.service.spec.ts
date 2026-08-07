import { UnauthorizedException } from '@nestjs/common';
import { createHash } from 'crypto';
import { CliService } from './cli.service';

function serviceWith(entity: any) {
  const queryBuilder: any = {
    addSelect: jest.fn(),
    leftJoinAndSelect: jest.fn(),
    where: jest.fn(),
    getOne: jest.fn().mockResolvedValue(entity),
  };
  for (const method of ['addSelect', 'leftJoinAndSelect', 'where']) {
    queryBuilder[method].mockReturnValue(queryBuilder);
  }
  const tokenRepo: any = {
    createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    save: jest.fn().mockResolvedValue(entity),
  };
  return {
    service: new CliService({} as any, tokenRepo, {} as any),
    queryBuilder,
    tokenRepo,
  };
}

describe('CliService token storage', () => {
  it('matches a digest, upgrades legacy plaintext and updates last-used time', async () => {
    const entity = { token: 'legacy', user: { id: 'user-1' }, lastUsedAt: new Date(0) };
    const { service, queryBuilder, tokenRepo } = serviceWith(entity);
    await expect(service.getUserByCliToken('cli_secret')).resolves.toEqual(entity.user);
    const digest = createHash('sha256').update('cli_secret').digest('hex');
    expect(queryBuilder.where).toHaveBeenCalledWith(
      'cliToken.token IN (:...tokens)',
      { tokens: [digest, 'cli_secret'] },
    );
    expect(entity.token).toBe(digest);
    expect(entity.lastUsedAt.getTime()).toBeGreaterThan(0);
    expect(tokenRepo.save).toHaveBeenCalledWith(entity);
  });

  it('rejects an unknown token', async () => {
    const { service } = serviceWith(null);
    await expect(service.getUserByCliToken('bad')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
