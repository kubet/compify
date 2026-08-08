import * as path from 'path';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InitialSchema1786121078241 } from '../migrations/1786121078241-InitialSchema';
import { AddUserSessionVersion1786121078242 } from '../migrations/1786121078242-AddUserSessionVersion';
import { AddComponentRevision1786121078243 } from '../migrations/1786121078243-AddComponentRevision';
import { HardenThemePersistence1786121078244 } from '../migrations/1786121078244-HardenThemePersistence';
import { Theme } from '../entities/project/theme.entity';
import { Component } from '../entities/project/component.entity';
import { ThemeService } from '../modules/theme/theme.service';
import { uuidToShortId } from '../common/short-id';

const databaseUrl =
  process.env.THEME_CAS_TEST_DATABASE_URL ?? process.env.TEST_DATABASE_URL;
const describePostgres = databaseUrl ? describe : describe.skip;
const ownerId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const foreignId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const ownerComponent = '11111111-1111-4111-8111-111111111111';
const foreignComponent = '22222222-2222-4222-8222-222222222222';
const ownerTheme = '33333333-3333-4333-8333-333333333333';
const foreignTheme = '44444444-4444-4444-8444-444444444444';

function options() {
  return {
    type: 'postgres' as const,
    url: databaseUrl,
    entities: [path.join(__dirname, '../entities/**/*.entity{.ts,.js}')],
    migrations: [
      InitialSchema1786121078241,
      AddUserSessionVersion1786121078242,
      AddComponentRevision1786121078243,
      HardenThemePersistence1786121078244,
    ],
    migrationsTransactionMode: 'all' as const,
  };
}

describePostgres('Theme CAS (PostgreSQL 16, two connections)', () => {
  let first: DataSource;
  let second: DataSource;
  let destructiveTargetConfirmed = false;

  beforeAll(async () => {
    first = new DataSource(options());
    await first.initialize();
    const [{ current_database: database }] = await first.query(
      'SELECT current_database()',
    );
    if (database !== 'compify_migration_test') {
      throw new Error(
        `Refusing destructive theme CAS test against database "${database}"`,
      );
    }
    destructiveTargetConfirmed = true;
    const [{ server_version_num: version }] = await first.query(
      `SELECT current_setting('server_version_num')::integer AS server_version_num`,
    );
    expect(version).toBeGreaterThanOrEqual(160000);
    expect(version).toBeLessThan(170000);
    await first.query('DROP SCHEMA IF EXISTS public CASCADE');
    await first.query('CREATE SCHEMA public');
    await first.runMigrations();
    await first.query(
      `INSERT INTO "user" ("id", "email") VALUES ($1, 'owner@example.test'), ($2, 'foreign@example.test')`,
      [ownerId, foreignId],
    );
    await first.query(
      `INSERT INTO "component" ("id", "name", "language", "userId")
       VALUES ($1, 'owner-component', 'react', $2), ($3, 'foreign-component', 'react', $4)`,
      [ownerComponent, ownerId, foreignComponent, foreignId],
    );
    await first.query(
      `INSERT INTO "themes" ("id", "name", "factors", "groups", "values", "componentId")
       VALUES ($1, 'Owner', '[]', '{}', '[]', $2), ($3, 'Foreign', '[]', '{}', '[]', $4)`,
      [ownerTheme, ownerComponent, foreignTheme, foreignComponent],
    );
    second = new DataSource(options());
    await second.initialize();
  }, 60_000);

  afterAll(async () => {
    if (second?.isInitialized) await second.destroy();
    if (first?.isInitialized) {
      if (destructiveTargetConfirmed) {
        await first.query('DROP SCHEMA IF EXISTS public CASCADE');
        await first.query('CREATE SCHEMA public');
      }
      await first.destroy();
    }
  });

  function service(connection: DataSource) {
    return new ThemeService(
      connection.getRepository(Theme),
      connection.getRepository(Component),
    );
  }

  async function resetOwnerTheme() {
    await first.query(
      `INSERT INTO "themes" ("id", "name", "factors", "groups", "values", "version", "updated_at", "componentId")
       VALUES ($1, 'Owner', '[{"key":"hue","type":"hue","value":"10"}]', '{"palette":{"type":"palette","options":[]}}', '[{"key":"primary","value":"red"}]', 1, '2000-01-01T00:00:00Z', $2)
       ON CONFLICT ("id") DO UPDATE SET
         "name"=EXCLUDED."name", "factors"=EXCLUDED."factors", "groups"=EXCLUDED."groups",
         "values"=EXCLUDED."values", "version"=1, "updated_at"=EXCLUDED."updated_at"`,
      [ownerTheme, ownerComponent],
    );
  }

  it('allows exactly one of two writes using the same ETag', async () => {
    await resetOwnerTheme();
    const writes = await Promise.allSettled([
      service(first).createOrUpdate(
        { id: uuidToShortId(ownerTheme), name: 'First' },
        { id: ownerId } as any,
        1,
      ),
      service(second).createOrUpdate(
        { id: uuidToShortId(ownerTheme), name: 'Second' },
        { id: ownerId } as any,
        1,
      ),
    ]);
    expect(
      writes.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);
    const rejected = writes.find((result) => result.status === 'rejected');
    expect((rejected as PromiseRejectedResult).reason).toBeInstanceOf(
      ConflictException,
    );
    const [row] = await first.query(
      `SELECT "name", "version" FROM "themes" WHERE "id"=$1`,
      [ownerTheme],
    );
    expect(['First', 'Second']).toContain(row.name);
    expect(row.version).toBe(2);
  });

  it('serializes an update/delete race and never applies both', async () => {
    await resetOwnerTheme();
    const race = await Promise.allSettled([
      service(first).createOrUpdate(
        { id: uuidToShortId(ownerTheme), name: 'Race update' },
        { id: ownerId } as any,
        1,
      ),
      service(second).delete(
        uuidToShortId(ownerTheme),
        { id: ownerId } as any,
        1,
      ),
    ]);
    expect(race.filter((result) => result.status === 'fulfilled')).toHaveLength(
      1,
    );
    const failure = (
      race.find(
        (result) => result.status === 'rejected',
      ) as PromiseRejectedResult
    ).reason;
    expect(
      failure instanceof ConflictException ||
        failure instanceof NotFoundException,
    ).toBe(true);
  });

  it('rejects a sequential stale update and stale delete without changing the winner', async () => {
    await resetOwnerTheme();
    const winner = await service(first).createOrUpdate(
      { id: uuidToShortId(ownerTheme), name: 'Winner' },
      { id: ownerId } as any,
      1,
    );
    expect(winner.version).toBe(2);
    await expect(
      service(second).createOrUpdate(
        { id: uuidToShortId(ownerTheme), name: 'Stale update' },
        { id: ownerId } as any,
        1,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    await expect(
      service(second).delete(
        uuidToShortId(ownerTheme),
        { id: ownerId } as any,
        1,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    const [row] = await first.query(
      `SELECT "name", "version" FROM "themes" WHERE "id"=$1`,
      [ownerTheme],
    );
    expect(row).toEqual({ name: 'Winner', version: 2 });
  });

  it('allows exactly one of two concurrent deletes using the same ETag', async () => {
    await resetOwnerTheme();
    const deletes = await Promise.allSettled([
      service(first).delete(
        uuidToShortId(ownerTheme),
        { id: ownerId } as any,
        1,
      ),
      service(second).delete(
        uuidToShortId(ownerTheme),
        { id: ownerId } as any,
        1,
      ),
    ]);
    expect(
      deletes.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);
    const rejected = deletes.find(
      (result) => result.status === 'rejected',
    ) as PromiseRejectedResult;
    expect(rejected.reason).toBeInstanceOf(NotFoundException);
  });

  it('allows one fresh delete and reports the second fresh delete as not found', async () => {
    await resetOwnerTheme();
    await expect(
      service(first).delete(
        uuidToShortId(ownerTheme),
        { id: ownerId } as any,
        1,
      ),
    ).resolves.toEqual({ id: uuidToShortId(ownerTheme) });
    await expect(
      service(second).delete(
        uuidToShortId(ownerTheme),
        { id: ownerId } as any,
        1,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('preserves omitted fields and explicitly advances version and updated_at', async () => {
    await resetOwnerTheme();
    const saved = await service(first).createOrUpdate(
      { id: uuidToShortId(ownerTheme), name: 'Partial' },
      { id: ownerId } as any,
      1,
    );
    expect(saved.version).toBe(2);
    const [row] = await first.query(
      `SELECT "name", "factors", "groups", "values", "version", "updated_at"
       FROM "themes" WHERE "id"=$1`,
      [ownerTheme],
    );
    expect(row).toMatchObject({
      name: 'Partial',
      factors: [{ key: 'hue', type: 'hue', value: '10' }],
      groups: { palette: { type: 'palette', options: [] } },
      values: [{ key: 'primary', value: 'red' }],
      version: 2,
    });
    expect(row.updated_at.getTime()).toBeGreaterThan(
      new Date('2000-01-01T00:00:00Z').getTime(),
    );
  });

  it('does not disclose or mutate a foreign theme when its ETag is guessed', async () => {
    await expect(
      service(first).createOrUpdate(
        { id: uuidToShortId(foreignTheme), name: 'Guessed update' },
        { id: ownerId } as any,
        1,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    const [beforeDelete] = await first.query(
      `SELECT "name", "version" FROM "themes" WHERE "id"=$1`,
      [foreignTheme],
    );
    expect(beforeDelete).toEqual({ name: 'Foreign', version: 1 });

    await expect(
      service(first).delete(
        uuidToShortId(foreignTheme),
        { id: ownerId } as any,
        1,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    const [afterDelete] = await first.query(
      `SELECT "name", "version" FROM "themes" WHERE "id"=$1`,
      [foreignTheme],
    );
    expect(afterDelete).toEqual({ name: 'Foreign', version: 1 });
  });
});
