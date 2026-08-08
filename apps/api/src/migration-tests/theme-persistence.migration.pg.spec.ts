import { DataSource, EntitySchema } from 'typeorm';
import { InitialSchema1786121078241 } from '../migrations/1786121078241-InitialSchema';
import { AddUserSessionVersion1786121078242 } from '../migrations/1786121078242-AddUserSessionVersion';
import { AddComponentRevision1786121078243 } from '../migrations/1786121078243-AddComponentRevision';
import { HardenThemePersistence1786121078244 } from '../migrations/1786121078244-HardenThemePersistence';

const databaseUrl = process.env.TEST_DATABASE_URL;

if (process.env.CI && !databaseUrl) {
  throw new Error('PostgreSQL migration tests require TEST_DATABASE_URL in CI');
}

const describePostgres = databaseUrl ? describe : describe.skip;

interface ThemeRow {
  id: string;
  name: string;
  factors: unknown;
  groups: unknown;
  values: unknown;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  componentId: string;
}

const ThemeRowSchema = new EntitySchema<ThemeRow>({
  name: 'MigrationTestTheme',
  tableName: 'themes',
  columns: {
    id: { type: 'uuid', primary: true, generated: 'uuid' },
    name: { type: String, length: 100 },
    factors: { type: 'jsonb' },
    groups: { type: 'jsonb' },
    values: { type: 'jsonb' },
    createdAt: { name: 'created_at', type: Date, createDate: true },
    updatedAt: { name: 'updated_at', type: Date, updateDate: true },
    version: { type: Number, version: true, default: 1 },
    componentId: { type: 'uuid' },
  },
});

const ids = {
  normalComponent: '10000000-0000-4000-8000-000000000001',
  normalizedComponent: '10000000-0000-4000-8000-000000000002',
  duplicateComponent: '10000000-0000-4000-8000-000000000003',
  invalidGroupsComponent: '10000000-0000-4000-8000-000000000004',
  invalidFactorsComponent: '10000000-0000-4000-8000-000000000005',
  invalidValuesComponent: '10000000-0000-4000-8000-000000000006',
  invalidNullComponent: '10000000-0000-4000-8000-000000000007',
  normalTheme: '20000000-0000-4000-8000-000000000001',
  normalizedTheme: '20000000-0000-4000-8000-000000000002',
  duplicateWinner: '20000000-0000-4000-8000-000000000010',
  duplicateSecond: '20000000-0000-4000-8000-000000000011',
  duplicateNewest: '20000000-0000-4000-8000-000000000012',
  invalidGroups: '20000000-0000-4000-8000-000000000020',
  invalidFactors: '20000000-0000-4000-8000-000000000021',
  invalidValues: '20000000-0000-4000-8000-000000000022',
  invalidNull: '20000000-0000-4000-8000-000000000023',
  nullOrphan: '20000000-0000-4000-8000-000000000030',
  danglingOrphan: '20000000-0000-4000-8000-000000000031',
  missingComponent: '10000000-0000-4000-8000-000000000099',
};

async function insertTheme(
  dataSource: DataSource,
  id: string,
  componentId: string | null,
  factors: unknown,
  groups: unknown,
  values: unknown,
  createdAt = '2026-01-01T00:00:00.000Z',
) {
  await dataSource.query(
    `INSERT INTO "themes"
      ("id", "name", "factors", "groups", "values", "created_at", "componentId")
     VALUES ($1, $2, $3::jsonb, $4::jsonb, $5::jsonb, $6, $7)`,
    [
      id,
      `theme-${id.slice(-2)}`,
      JSON.stringify(factors),
      JSON.stringify(groups),
      JSON.stringify(values),
      createdAt,
      componentId,
    ],
  );
}

describePostgres('HardenThemePersistence1786121078244 (PostgreSQL 16)', () => {
  let dataSource: DataSource;
  let destructiveTargetConfirmed = false;
  const migration = new HardenThemePersistence1786121078244();

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'postgres',
      url: databaseUrl,
      entities: [ThemeRowSchema],
      migrations: [
        InitialSchema1786121078241,
        AddUserSessionVersion1786121078242,
        AddComponentRevision1786121078243,
      ],
      migrationsTransactionMode: 'all',
    });
    await dataSource.initialize();
    const [{ current_database: currentDatabase }] = await dataSource.query(
      `SELECT current_database()`,
    );
    if (currentDatabase !== 'compify_migration_test') {
      throw new Error(
        `Refusing destructive migration test against database "${currentDatabase}"`,
      );
    }
    destructiveTargetConfirmed = true;
    const [{ server_version_num: serverVersion }] = await dataSource.query(
      `SELECT current_setting('server_version_num')::integer AS server_version_num`,
    );
    expect(serverVersion).toBeGreaterThanOrEqual(160000);
    expect(serverVersion).toBeLessThan(170000);
    await dataSource.query('DROP SCHEMA IF EXISTS public CASCADE');
    await dataSource.query('CREATE SCHEMA public');
    await dataSource.runMigrations();

    const componentIds = Object.entries(ids)
      .filter(
        ([key]) => key.endsWith('Component') && key !== 'missingComponent',
      )
      .map(([, value]) => value);
    for (const componentId of componentIds) {
      await dataSource.query(
        `INSERT INTO "component" ("id", "name", "language") VALUES ($1, $2, 'react')`,
        [componentId, `component-${componentId.slice(-2)}`],
      );
    }

    await insertTheme(
      dataSource,
      ids.normalTheme,
      ids.normalComponent,
      [],
      {},
      [],
    );
    await insertTheme(
      dataSource,
      ids.normalizedTheme,
      ids.normalizedComponent,
      [],
      [],
      [],
    );
    await insertTheme(
      dataSource,
      ids.duplicateWinner,
      ids.duplicateComponent,
      [],
      {},
      [],
      '2025-01-01T00:00:00.000Z',
    );
    await insertTheme(
      dataSource,
      ids.duplicateSecond,
      ids.duplicateComponent,
      [],
      [],
      [],
      '2025-01-01T00:00:00.000Z',
    );
    await insertTheme(
      dataSource,
      ids.duplicateNewest,
      ids.duplicateComponent,
      [],
      {},
      [],
      '2026-01-01T00:00:00.000Z',
    );
    await insertTheme(
      dataSource,
      ids.invalidGroups,
      ids.invalidGroupsComponent,
      [],
      ['not-empty'],
      [],
    );
    await insertTheme(
      dataSource,
      ids.invalidFactors,
      ids.invalidFactorsComponent,
      {},
      {},
      [],
    );
    await insertTheme(
      dataSource,
      ids.invalidValues,
      ids.invalidValuesComponent,
      [],
      {},
      {},
    );
    await insertTheme(
      dataSource,
      ids.invalidNull,
      ids.invalidNullComponent,
      [],
      null,
      [],
    );
    await insertTheme(dataSource, ids.nullOrphan, null, [], [], []);

    // Model a database where the legacy FK was disabled or lost.
    await dataSource.query(
      `ALTER TABLE "themes" DROP CONSTRAINT "FK_a681db15d57d1c7de5bfb5e4ecf"`,
    );
    await insertTheme(
      dataSource,
      ids.danglingOrphan,
      ids.missingComponent,
      [],
      {},
      [],
    );

    const runner = dataSource.createQueryRunner();
    await runner.startTransaction();
    try {
      await migration.up(runner);
      await runner.commitTransaction();
    } catch (error) {
      await runner.rollbackTransaction();
      throw error;
    } finally {
      await runner.release();
    }
  }, 60_000);

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      if (destructiveTargetConfirmed) {
        await dataSource.query('DROP SCHEMA IF EXISTS public CASCADE');
        await dataSource.query('CREATE SCHEMA public');
      }
      await dataSource.destroy();
    }
  });

  it('normalizes losslessly and deterministically quarantines bad rows', async () => {
    const survivors = await dataSource.query(
      `SELECT "id", "groups", "version", "created_at", "updated_at"
       FROM "themes" ORDER BY "id"`,
    );
    expect(survivors.map((row: { id: string }) => row.id)).toEqual([
      ids.normalTheme,
      ids.normalizedTheme,
      ids.duplicateWinner,
    ]);
    expect(survivors[1].groups).toEqual({});
    for (const survivor of survivors) {
      expect(survivor.version).toBe(1);
      expect(survivor.updated_at).toEqual(survivor.created_at);
    }

    const archive = await dataSource.query(
      `SELECT "id", "reason" FROM "themes_quarantine_1786121078244"
       ORDER BY "id"`,
    );
    expect(archive).toEqual([
      { id: ids.duplicateSecond, reason: 'duplicate_component' },
      { id: ids.duplicateNewest, reason: 'duplicate_component' },
      { id: ids.invalidGroups, reason: 'invalid_shape' },
      { id: ids.invalidFactors, reason: 'invalid_shape' },
      { id: ids.invalidValues, reason: 'invalid_shape' },
      { id: ids.invalidNull, reason: 'invalid_shape' },
      { id: ids.nullOrphan, reason: 'orphan_component' },
      { id: ids.danglingOrphan, reason: 'orphan_component' },
    ]);
    const unnormalizedEvidence = await dataSource.query(
      `SELECT "id", "groups" FROM "themes_quarantine_1786121078244"
       WHERE "id" = ANY($1::uuid[]) ORDER BY "id"`,
      [[ids.duplicateSecond, ids.nullOrphan]],
    );
    expect(unnormalizedEvidence).toEqual([
      { id: ids.duplicateSecond, groups: [] },
      { id: ids.nullOrphan, groups: [] },
    ]);
  });

  it('installs the named non-null, unique, cascade, version and JSON constraints', async () => {
    const nullable = await dataSource.query(
      `SELECT is_nullable FROM information_schema.columns
       WHERE table_schema='public' AND table_name='themes' AND column_name='componentId'`,
    );
    expect(nullable[0].is_nullable).toBe('NO');

    const constraints = await dataSource.query(
      `SELECT conname, contype, confdeltype
       FROM pg_constraint WHERE conrelid='themes'::regclass ORDER BY conname`,
    );
    expect(constraints).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          conname: 'UQ_themes_component',
          contype: 'u',
        }),
        expect.objectContaining({
          conname: 'FK_themes_component',
          contype: 'f',
          confdeltype: 'c',
        }),
        expect.objectContaining({
          conname: 'CHK_themes_version',
          contype: 'c',
        }),
        expect.objectContaining({
          conname: 'CHK_themes_groups_object',
          contype: 'c',
        }),
        expect.objectContaining({
          conname: 'CHK_themes_factors_array',
          contype: 'c',
        }),
        expect.objectContaining({
          conname: 'CHK_themes_values_array',
          contype: 'c',
        }),
      ]),
    );
  });

  it('rejects duplicate and malformed direct writes with the fixed constraints', async () => {
    await expect(
      insertTheme(
        dataSource,
        '20000000-0000-4000-8000-000000000040',
        ids.normalComponent,
        [],
        {},
        [],
      ),
    ).rejects.toMatchObject({
      driverError: { code: '23505', constraint: 'UQ_themes_component' },
    });

    await expect(
      insertTheme(
        dataSource,
        '20000000-0000-4000-8000-000000000041',
        ids.invalidGroupsComponent,
        [],
        [],
        [],
      ),
    ).rejects.toMatchObject({
      driverError: { code: '23514', constraint: 'CHK_themes_groups_object' },
    });
  });

  it('increments the ORM-managed version and update timestamp on a normal save', async () => {
    const repository = dataSource.getRepository<ThemeRow>('MigrationTestTheme');
    const theme = await repository.findOneByOrFail({ id: ids.normalTheme });
    const previousUpdatedAt = theme.updatedAt;
    theme.name = 'normal-updated';

    const saved = await repository.save(theme);

    expect(saved.version).toBe(2);
    expect(saved.updatedAt.getTime()).toBeGreaterThan(
      previousUpdatedAt.getTime(),
    );
  });

  it('cascades component deletion and safely reverses while retaining evidence', async () => {
    await dataSource.query(`DELETE FROM "component" WHERE "id"=$1`, [
      ids.normalComponent,
    ]);
    expect(
      await dataSource.query(`SELECT 1 FROM "themes" WHERE "id"=$1`, [
        ids.normalTheme,
      ]),
    ).toHaveLength(0);

    const runner = dataSource.createQueryRunner();
    await runner.startTransaction();
    try {
      await migration.down(runner);
      await runner.commitTransaction();
    } catch (error) {
      await runner.rollbackTransaction();
      throw error;
    } finally {
      await runner.release();
    }

    const columns = await dataSource.query(
      `SELECT column_name, is_nullable FROM information_schema.columns
       WHERE table_name='themes' AND column_name IN ('componentId','version','updated_at')`,
    );
    expect(columns).toEqual([
      { column_name: 'componentId', is_nullable: 'YES' },
    ]);
    const oldFk = await dataSource.query(
      `SELECT conname, confdeltype FROM pg_constraint
       WHERE conrelid='themes'::regclass AND contype='f'`,
    );
    expect(oldFk).toEqual([
      {
        conname: 'FK_a681db15d57d1c7de5bfb5e4ecf',
        confdeltype: 'a',
      },
    ]);

    const restored = await dataSource.query(
      `SELECT "id" FROM "themes" WHERE "id" = ANY($1::uuid[]) ORDER BY "id"`,
      [
        [
          ids.duplicateSecond,
          ids.duplicateNewest,
          ids.invalidGroups,
          ids.nullOrphan,
        ],
      ],
    );
    expect(restored.map((row: { id: string }) => row.id)).toEqual([
      ids.duplicateSecond,
      ids.duplicateNewest,
      ids.invalidGroups,
      ids.nullOrphan,
    ]);
    expect(
      await dataSource.query(`SELECT 1 FROM "themes" WHERE "id"=$1`, [
        ids.danglingOrphan,
      ]),
    ).toHaveLength(0);
    expect(
      await dataSource.query(`SELECT 1 FROM "themes_quarantine_1786121078244"`),
    ).toHaveLength(8);

    await dataSource.query(`UPDATE "themes" SET "name"=$1 WHERE "id"=$2`, [
      'latest-cycle-snapshot',
      ids.duplicateSecond,
    ]);
    const secondUp = dataSource.createQueryRunner();
    await secondUp.startTransaction();
    try {
      await migration.up(secondUp);
      await secondUp.commitTransaction();
    } catch (error) {
      await secondUp.rollbackTransaction();
      throw error;
    } finally {
      await secondUp.release();
    }
    const secondDown = dataSource.createQueryRunner();
    await secondDown.startTransaction();
    try {
      await migration.down(secondDown);
      await secondDown.commitTransaction();
    } catch (error) {
      await secondDown.rollbackTransaction();
      throw error;
    } finally {
      await secondDown.release();
    }

    const [latestRestored] = await dataSource.query(
      `SELECT "name", "groups" FROM "themes" WHERE "id"=$1`,
      [ids.duplicateSecond],
    );
    expect(latestRestored).toEqual({
      name: 'latest-cycle-snapshot',
      groups: [],
    });
    const [{ count: archivedVersions }] = await dataSource.query(
      `SELECT count(*)::integer AS count
       FROM "themes_quarantine_1786121078244" WHERE "id"=$1`,
      [ids.duplicateSecond],
    );
    expect(archivedVersions).toBe(2);
  });
});
