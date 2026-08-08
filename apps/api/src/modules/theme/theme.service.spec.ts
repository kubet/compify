import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { uuidToShortId } from 'src/common/short-id';
import { InsertThemeDto } from 'src/models/theme/insert-theme.dto';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ThemeService } from './theme.service';

const user = { id: 'user-a' } as any;
const componentId = '11111111-1111-4111-8111-111111111111';
const otherComponentId = '22222222-2222-4222-8222-222222222222';
const themeId = '33333333-3333-4333-8333-333333333333';

function repositories({ theme = null, component = null } = {} as any) {
  const themeRepository = {
    findOne: jest.fn().mockResolvedValue(theme),
    save: jest.fn().mockImplementation(async (entity) => ({
      id: entity.id || themeId,
      ...entity,
    })),
    remove: jest.fn(),
  };
  const componentRepository = {
    findOne: jest.fn().mockResolvedValue(component),
  };
  return { themeRepository, componentRepository };
}

function service(repos: ReturnType<typeof repositories>) {
  return new ThemeService(
    repos.themeRepository as any,
    repos.componentRepository as any,
  );
}

describe('ThemeService ownership boundaries', () => {
  it('normalizes the legacy empty groups array but rejects other malformed collections', async () => {
    const legacy = plainToInstance(InsertThemeDto, {
      groups: [],
      factors: [],
      values: [],
    });
    expect(await validate(legacy)).toHaveLength(0);
    expect(legacy.groups).toEqual({});

    const malformed = plainToInstance(InsertThemeDto, {
      groups: [{ key: 'not-a-group-map' }],
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

  it('returns not found for a missing theme instead of passing undefined to persistence', async () => {
    const repos = repositories();

    await expect(
      service(repos).delete(uuidToShortId(themeId), user),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repos.themeRepository.remove).not.toHaveBeenCalled();
  });

  it('creates a theme only after resolving the component in the user namespace', async () => {
    const component = { id: componentId, user };
    const repos = repositories({ component });

    const result = await service(repos).createOrUpdate(
      {
        componentId: uuidToShortId(componentId),
        name: 'Brand',
        factors: [],
        groups: {},
        values: [],
      },
      user,
    );

    expect(repos.componentRepository.findOne).toHaveBeenCalledWith({
      where: { id: componentId, user: { id: user.id } },
    });
    expect(repos.themeRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Brand', component }),
    );
    expect(result.id).toBe(uuidToShortId(themeId));
  });

  it('creates safe empty token collections when optional content is omitted', async () => {
    const component = { id: componentId, user };
    const repos = repositories({ component });

    await service(repos).createOrUpdate(
      { componentId: uuidToShortId(componentId) },
      user,
    );

    expect(repos.themeRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ factors: [], groups: {}, values: [] }),
    );
  });

  it('does not disclose or use a component outside the user namespace', async () => {
    const repos = repositories();

    await expect(
      service(repos).createOrUpdate(
        {
          componentId: uuidToShortId(componentId),
          factors: [],
          groups: {},
          values: [],
        },
        user,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repos.themeRepository.save).not.toHaveBeenCalled();
  });

  it('rejects orphan theme creation', async () => {
    const repos = repositories();

    await expect(
      service(repos).createOrUpdate(
        { factors: [], groups: {}, values: [] },
        user,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repos.componentRepository.findOne).not.toHaveBeenCalled();
    expect(repos.themeRepository.save).not.toHaveBeenCalled();
  });

  it('rejects moving an owned theme to any other component', async () => {
    const theme = {
      id: themeId,
      name: 'Brand',
      factors: [],
      groups: {},
      values: [],
      component: { id: componentId },
    };
    const repos = repositories({ theme });

    await expect(
      service(repos).createOrUpdate(
        {
          id: uuidToShortId(themeId),
          componentId: uuidToShortId(otherComponentId),
          values: [{ key: 'primary', value: 'red' }],
        },
        user,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repos.themeRepository.save).not.toHaveBeenCalled();
  });

  it('updates an owned theme in place without resetting omitted fields', async () => {
    const component = { id: componentId };
    const theme = {
      id: themeId,
      name: 'Brand',
      factors: [{ key: 'hue', value: '10' }],
      groups: {},
      values: [],
      component,
    };
    const repos = repositories({ theme });
    const values = [{ key: 'primary', value: 'red' }];

    const result = await service(repos).createOrUpdate(
      {
        id: uuidToShortId(themeId),
        componentId: uuidToShortId(componentId),
        values,
      },
      user,
    );

    expect(repos.themeRepository.findOne).toHaveBeenCalledWith({
      where: {
        id: themeId,
        component: { user: { id: user.id } },
      },
      relations: ['component'],
    });
    expect(repos.themeRepository.save).toHaveBeenCalledWith(theme);
    expect(theme).toMatchObject({ name: 'Brand', component, values });
    expect(result.id).toBe(uuidToShortId(themeId));
  });

  it('maps only the named component uniqueness violation on create to conflict', async () => {
    const component = { id: componentId, user };
    const repos = repositories({ component });
    repos.themeRepository.save.mockRejectedValueOnce({
      driverError: {
        code: '23505',
        constraint: 'UQ_themes_component',
      },
    });

    const promise = service(repos).createOrUpdate(
      { componentId: uuidToShortId(componentId) },
      user,
    );
    await expect(promise).rejects.toBeInstanceOf(ConflictException);
    await expect(promise).rejects.toThrow(
      'A theme already exists for this component',
    );
  });

  it.each([
    {
      driverError: { code: '23505', constraint: 'UQ_some_other_constraint' },
    },
    new Error('database unavailable'),
  ])('rethrows unrelated create failures unchanged', async (failure) => {
    const component = { id: componentId, user };
    const repos = repositories({ component });
    repos.themeRepository.save.mockRejectedValueOnce(failure);

    await expect(
      service(repos).createOrUpdate(
        { componentId: uuidToShortId(componentId) },
        user,
      ),
    ).rejects.toBe(failure);
  });

  it('does not map the named uniqueness violation on the update path', async () => {
    const failure = {
      driverError: { code: '23505', constraint: 'UQ_themes_component' },
    };
    const theme = {
      id: themeId,
      name: 'Brand',
      factors: [],
      groups: {},
      values: [],
      component: { id: componentId },
    };
    const repos = repositories({ theme });
    repos.themeRepository.save.mockRejectedValueOnce(failure);

    await expect(
      service(repos).createOrUpdate(
        { id: uuidToShortId(themeId), name: 'Updated' },
        user,
      ),
    ).rejects.toBe(failure);
  });

  it('returns persistence-managed version and update timestamp', async () => {
    const component = { id: componentId, user };
    const updatedAt = new Date('2026-01-02T03:04:05.000Z');
    const repos = repositories({ component });
    repos.themeRepository.save.mockResolvedValueOnce({
      id: themeId,
      name: 'Default',
      factors: [],
      groups: {},
      values: [],
      component,
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
