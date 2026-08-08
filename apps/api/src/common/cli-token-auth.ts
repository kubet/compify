import { UnauthorizedException } from '@nestjs/common';
import { createHash } from 'crypto';
import { Repository } from 'typeorm';
import { CliToken } from 'src/entities/cli/cli-tokens.entity';
import { User } from 'src/entities/user/user.entity';

/** Validate a raw `cli_…` credential, migrate legacy storage, and record use. */
export async function authenticateCliToken(
  repository: Repository<CliToken>,
  token: string,
): Promise<User> {
  if (typeof token !== 'string' || !/^cli_[a-f0-9]{64}$/.test(token)) {
    throw new UnauthorizedException('Invalid CLI token');
  }
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const find = (candidate: string) =>
    repository
      .createQueryBuilder('cliToken')
      .addSelect('cliToken.token')
      .leftJoinAndSelect('cliToken.user', 'user')
      .where('cliToken.token = :token', { token: candidate })
      .getOne();
  let entity = await find(tokenHash);
  // Legacy rows stored the complete raw token. A presented credential cannot
  // have the shape of the stored 64-hex digest, so this cannot make a digest
  // replayable as a credential.
  if (!entity) entity = await find(token);
  if (!entity) throw new UnauthorizedException('Invalid CLI token');
  entity.token = tokenHash;
  entity.lastUsedAt = new Date();
  await repository.save(entity);
  return entity.user;
}

export function bearerCliToken(authorization?: string): string {
  const match =
    typeof authorization === 'string'
      ? /^Bearer ([^\s]+)$/.exec(authorization)
      : null;
  if (!match) throw new UnauthorizedException('Bearer CLI token required');
  return match[1];
}
