import { BadRequestException, HttpException } from '@nestjs/common';
import {
  parseThemeIfMatch,
  ThemeController,
  themeEtag,
} from './theme.controller';

const user = { id: 'user-a' } as any;
const theme = {
  id: 'short-id',
  name: 'Brand',
  factors: [],
  groups: {},
  values: [],
  version: 7,
  componentId: 'component-id',
  component: { id: 'component-id', name: 'mutable component' },
};
const response = () => ({ setHeader: jest.fn() }) as any;

describe('ThemeController ETag contract', () => {
  it('accepts only one exact strong theme ETag', () => {
    expect(parseThemeIfMatch('"theme-v12"')).toBe(12);
    for (const invalid of [
      'W/"theme-v1"',
      '*',
      '"theme-v1", "theme-v2"',
      'theme-v1',
      '"theme-v0"',
      '"other-v1"',
      '"theme-v2147483648"',
    ]) {
      expect(() => parseThemeIfMatch(invalid)).toThrow(BadRequestException);
    }
    try {
      parseThemeIfMatch(undefined);
      throw new Error('expected failure');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(428);
    }
  });

  it('emits strong ETags, retains versions, and omits mutable component data', async () => {
    const service = {
      findOne: jest.fn().mockResolvedValue(theme),
      createOrUpdate: jest.fn().mockResolvedValue(theme),
    } as any;
    const controller = new ThemeController(service);

    const getResponse = response();
    const getBody = await controller.getTheme('short-id', user, getResponse);
    expect(getResponse.setHeader).toHaveBeenCalledWith('ETag', themeEtag(7));
    expect(getBody).toEqual(expect.objectContaining({ id: 'short-id' }));
    expect(getBody).toHaveProperty('version', 7);
    expect(getBody).toHaveProperty('componentId', 'component-id');
    expect(getBody).not.toHaveProperty('component');

    const createResponse = response();
    const createBody = await controller.createOrUpdate(
      { componentId: 'component' },
      user,
      undefined,
      createResponse,
    );
    expect(createBody).not.toHaveProperty('component');
    expect(service.createOrUpdate).toHaveBeenLastCalledWith(
      { componentId: 'component' },
      user,
      undefined,
    );
    expect(createResponse.setHeader).toHaveBeenCalledWith('ETag', '"theme-v7"');

    const legacyCreateResponse = response();
    await controller.createOrUpdate(
      { id: 'null', componentId: 'component' },
      user,
      undefined,
      legacyCreateResponse,
    );
    expect(service.createOrUpdate).toHaveBeenLastCalledWith(
      { id: 'null', componentId: 'component' },
      user,
      undefined,
    );
    expect(legacyCreateResponse.setHeader).toHaveBeenCalledWith(
      'ETag',
      '"theme-v7"',
    );

    const updateResponse = response();
    const updateBody = await controller.createOrUpdate(
      { id: 'short-id', name: 'New' },
      user,
      '"theme-v7"',
      updateResponse,
    );
    expect(updateBody).not.toHaveProperty('component');
    expect(service.createOrUpdate).toHaveBeenLastCalledWith(
      { id: 'short-id', name: 'New' },
      user,
      7,
    );
  });

  it('requires If-Match before invoking update/delete persistence', async () => {
    const service = {
      createOrUpdate: jest.fn(),
      delete: jest.fn(),
    } as any;
    const controller = new ThemeController(service);
    await expect(
      controller.createOrUpdate(
        { id: 'short-id' },
        user,
        undefined,
        response(),
      ),
    ).rejects.toMatchObject({ status: 428 });
    await expect(
      controller.deleteTheme('short-id', user, undefined),
    ).rejects.toMatchObject({ status: 428 });
    await expect(
      controller.createOrUpdate(
        { componentId: 'component' },
        user,
        '"theme-v1"',
        response(),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(service.createOrUpdate).not.toHaveBeenCalled();
    expect(service.delete).not.toHaveBeenCalled();
  });
});
