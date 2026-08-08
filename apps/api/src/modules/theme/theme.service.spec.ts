import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { uuidToShortId } from 'src/common/short-id';
import { InsertThemeDto } from 'src/models/theme/insert-theme.dto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ThemeService } from './theme.service';

const user = { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' } as any;
const componentId = '11111111-1111-4111-8111-111111111111';
const otherComponentId = '22222222-2222-4222-8222-222222222222';
const themeId = '33333333-3333-4333-8333-333333333333';

function repositories({ theme = null, component = null, result }: any = {}) {
  const queryResult = result ?? {
    affected: 1,
    raw: [
      {
        id: themeId,
        name: 'Updated',
        factors: [],
        groups: {},
        values: [],
        version: 2,
        created_at: new Date('2026-01-01T00:00:00Z'),
        updated_at: new Date('2026-01-02T00:00:00Z'),
        componentId,
      },
    ],
  };
  const qb: any = {};
  for (const method of [
    'delete',
    'from',
    'update',
    'set',
    'where',
    'andWhere',
    'returning',
  ]) {
    qb[method] = jest.fn().mockReturnValue(qb);
  }
  qb.execute = jest.fn().mockResolvedValue(queryResult);
  const themeRepository = {
    findOne: jest.fn().mockResolvedValue(theme),
    save: jest.fn().mockImplementation(async (entity) => ({
      id: entity.id || themeId,
      version: 1,
      ...entity,
    })),
    createQueryBuilder: jest.fn().mockReturnValue(qb),
  };
  const componentRepository = {
    findOne: jest.fn().mockResolvedValue(component),
  };
  return { themeRepository, componentRepository, qb };
}

function service(repos: ReturnType<typeof repositories>) {
  return new ThemeService(
    repos.themeRepository as any,
    repos.componentRepository as any,
  );
}

const ownedTheme = {
  id: themeId,
  name: 'Brand',
  factors: [{ key: 'hue', value: '10' }],
  groups: {},
  values: [],
  version: 1,
  componentId,
  component: { id: componentId },
};

describe('ThemeService CAS persistence', () => {
  it('keeps create save behavior and maps only the named uniqueness conflict', async () => {
    const component = { id: componentId, user };
    const repos = repositories({ component });
    const result = await service(repos).createOrUpdate(
      { componentId: uuidToShortId(componentId) },
      user,
    );
    expect(repos.themeRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Default',
        factors: [],
        groups: {},
        values: [],
        component,
      }),
    );
    expect(result).toMatchObject({ id: uuidToShortId(themeId), version: 1 });

    const failure = repositories({ component });
    failure.themeRepository.save.mockRejectedValueOnce({
      driverError: { code: '23505', constraint: 'UQ_themes_component' },
    });
    await expect(
      service(failure).createOrUpdate(
        { componentId: uuidToShortId(componentId) },
        user,
      ),
    ).rejects.toThrow('A theme already exists for this component');
  });

  it('updates only through an owner/id/version conditional statement and returns version + 1', async () => {
    const repos = repositories({ theme: ownedTheme });
    const result = await service(repos).createOrUpdate(
      {
        id: uuidToShortId(themeId),
        componentId: uuidToShortId(componentId),
        name: 'Updated',
        values: [{ key: 'primary', value: 'red' }],
      },
      user,
      1,
    );

    expect(repos.qb.set).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Updated',
        values: [{ key: 'primary', value: 'red' }],
        version: expect.any(Function),
        updatedAt: expect.any(Function),
      }),
    );
    expect(repos.qb.where.mock.calls[0][0]).toContain('"userId" = :userId');
    expect(repos.qb.andWhere).toHaveBeenCalledWith(
      '"version" = :expectedVersion',
      { expectedVersion: 1 },
    );
    expect(repos.themeRepository.save).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      id: uuidToShortId(themeId),
      version: 2,
      name: 'Updated',
    });
  });

  it('returns 409 for a stale owned ETag and 404 for a foreign guessed ETag', async () => {
    const stale = repositories({
      theme: ownedTheme,
      result: { affected: 0, raw: [] },
    });
    await expect(
      service(stale).createOrUpdate(
        { id: uuidToShortId(themeId), name: 'Stale' },
        user,
        1,
      ),
    ).rejects.toBeInstanceOf(ConflictException);

    const foreign = repositories({ result: { affected: 0, raw: [] } });
    await expect(
      service(foreign).createOrUpdate(
        { id: uuidToShortId(themeId), name: 'Guess' },
        user,
        99,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('conditionally deletes and distinguishes stale from absent/foreign rows', async () => {
    const ok = repositories();
    await expect(
      service(ok).delete(uuidToShortId(themeId), user, 1),
    ).resolves.toEqual({ id: uuidToShortId(themeId) });
    expect(ok.qb.andWhere).toHaveBeenCalledWith(
      '"version" = :expectedVersion',
      { expectedVersion: 1 },
    );

    const stale = repositories({ theme: ownedTheme, result: { affected: 0 } });
    await expect(
      service(stale).delete(uuidToShortId(themeId), user, 1),
    ).rejects.toBeInstanceOf(ConflictException);

    const missing = repositories({ result: { affected: 0 } });
    await expect(
      service(missing).delete(uuidToShortId(themeId), user, 1),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('still rejects moving themes and orphan creation', async () => {
    const repos = repositories({ theme: ownedTheme });
    await expect(
      service(repos).createOrUpdate(
        {
          id: uuidToShortId(themeId),
          componentId: uuidToShortId(otherComponentId),
        },
        user,
        1,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service(repositories()).createOrUpdate({ factors: [] }, user),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('ThemeService retained persistence regressions', () => {
  it('normalizes legacy empty groups but rejects malformed collections', async () => {
    const legacy = plainToInstance(InsertThemeDto, {
      groups: [],
      factors: [],
      values: [],
    });
    expect(await validate(legacy)).toHaveLength(0);
    expect(legacy.groups).toEqual({});

    const malformed = plainToInstance(InsertThemeDto, {
      groups: [{ key: 'not-a-map' }],
      factors: {},
      values: {},
    });
    const errors = await validate(malformed);
    expect(errors.map((error) => error.property).sort()).toEqual([
      'factors',
      'groups',
      'values',
    ]);
  });

  it('does not disclose or create under a component outside the user namespace', async () => {
    const repos = repositories();
    await expect(
      service(repos).createOrUpdate(
        { componentId: uuidToShortId(componentId), factors: [] },
        user,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repos.themeRepository.save).not.toHaveBeenCalled();
  });

  it('creates safe defaults when optional token content is omitted', async () => {
    const component = { id: componentId, user };
    const repos = repositories({ component });
    await service(repos).createOrUpdate(
      { componentId: uuidToShortId(componentId), name: 'Brand' },
      user,
    );
    expect(repos.themeRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Brand',
        groups: {},
        factors: [],
        values: [],
      }),
    );
  });

  it.each([
    { driverError: { code: '23505', constraint: 'UQ_other' } },
    new Error('database unavailable'),
  ])('rethrows unrelated create failures unchanged', async (failure) => {
    const repos = repositories({ component: { id: componentId, user } });
    repos.themeRepository.save.mockRejectedValueOnce(failure);
    await expect(
      service(repos).createOrUpdate(
        { componentId: uuidToShortId(componentId) },
        user,
      ),
    ).rejects.toBe(failure);
  });

  it('does not remap a named create uniqueness error from the update statement', async () => {
    const failure = {
      driverError: { code: '23505', constraint: 'UQ_themes_component' },
    };
    const repos = repositories({ theme: ownedTheme });
    repos.qb.execute.mockRejectedValueOnce(failure);
    await expect(
      service(repos).createOrUpdate(
        { id: uuidToShortId(themeId), name: 'Updated' },
        user,
        1,
      ),
    ).rejects.toBe(failure);
  });

  it('preserves omitted fields on partial updates', async () => {
    const updatedAt = new Date('2026-01-02T03:04:05Z');
    const repos = repositories({
      theme: ownedTheme,
      result: {
        affected: 1,
        raw: [
          {
            name: 'Renamed',
            factors: ownedTheme.factors,
            groups: ownedTheme.groups,
            values: ownedTheme.values,
            version: 2,
            created_at: new Date('2026-01-01T00:00:00Z'),
            updated_at: updatedAt,
          },
        ],
      },
    });
    const result = await service(repos).createOrUpdate(
      { id: uuidToShortId(themeId), name: 'Renamed' },
      user,
      1,
    );
    const changes = repos.qb.set.mock.calls[0][0];
    expect(changes).not.toHaveProperty('factors');
    expect(changes).not.toHaveProperty('groups');
    expect(changes).not.toHaveProperty('values');
    expect(result).toMatchObject({
      factors: ownedTheme.factors,
      groups: ownedTheme.groups,
      values: ownedTheme.values,
      version: 2,
      updatedAt,
    });
  });

  it('returns persistence-managed create version and update timestamp', async () => {
    const updatedAt = new Date('2026-01-02T03:04:05Z');
    const repos = repositories({ component: { id: componentId, user } });
    repos.themeRepository.save.mockResolvedValueOnce({
      id: themeId,
      name: 'Default',
      groups: {},
      factors: [],
      values: [],
      version: 1,
      updatedAt,
    });
    const result = await service(repos).createOrUpdate(
      { componentId: uuidToShortId(componentId) },
      user,
    );
    expect(result).toMatchObject({ version: 1, updatedAt });
  });
});
