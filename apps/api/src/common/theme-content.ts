export const THEME_CONTENT_MAX_BYTES = 1024 * 1024;

export const THEME_CONTENT_LIMITS = Object.freeze({
  factors: 100,
  groups: 100,
  optionsPerGroup: 500,
  values: 1000,
  totalTokens: 5000,
  valueCharacters: 10_000,
  absoluteNumber: 1_000_000,
});

export type ThemeScalar = string | number;

export interface AuthoredThemeToken {
  key: string;
  value: ThemeScalar;
}

export interface AuthoredThemeFactor extends AuthoredThemeToken {
  type: 'hue' | 'saturation' | 'lightness' | 'slider' | 'value';
  min?: number;
  max?: number;
}

export interface AuthoredThemeGroup {
  type: 'palette' | 'value' | 'values';
  options: AuthoredThemeToken[];
  isPublic?: boolean;
}

export interface AuthoredThemeContent {
  factors: AuthoredThemeFactor[];
  groups: Record<string, AuthoredThemeGroup>;
  values: AuthoredThemeToken[];
}

const NAME = /^[A-Za-z_][A-Za-z0-9_-]{0,63}$/;
const RESERVED_NAMES = new Set(['__proto__', 'prototype', 'constructor']);
const FACTOR_TYPES = new Set([
  'hue',
  'saturation',
  'lightness',
  'slider',
  'value',
]);
const GROUP_TYPES = new Set(['palette', 'value', 'values']);

function fail(path: string, detail: string): never {
  throw new TypeError(`Invalid theme content at ${path}: ${detail}`);
}

function record(value: unknown, path: string): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    fail(path, 'must be an object');
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    fail(path, 'must be a plain object');
  }
  return value as Record<string, unknown>;
}

function onlyKeys(
  value: Record<string, unknown>,
  allowed: ReadonlySet<string>,
  path: string,
) {
  const unknown = Object.keys(value).find((key) => !allowed.has(key));
  if (unknown) {
    const encoded = JSON.stringify(unknown).slice(0, 120);
    fail(path, `contains unsupported property ${encoded}`);
  }
}

function name(value: unknown, path: string): string {
  if (
    typeof value !== 'string' ||
    !NAME.test(value) ||
    RESERVED_NAMES.has(value)
  ) {
    fail(path, 'must be a safe token name');
  }
  return value;
}

function authoredValue(value: unknown, path: string): ThemeScalar {
  if (typeof value === 'string') {
    if (value.length > THEME_CONTENT_LIMITS.valueCharacters) {
      fail(path, 'is too long');
    }
    return value;
  }
  if (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    Math.abs(value) <= THEME_CONTENT_LIMITS.absoluteNumber
  )
    return value;
  fail(path, 'must be a string or bounded finite number');
}

function tolerateDerivedC(value: Record<string, unknown>, path: string) {
  if (!Object.prototype.hasOwnProperty.call(value, 'c')) return;
  // `c` is accepted only as the legacy compiler scalar and is never returned.
  authoredValue(value.c, `${path}.c`);
}

function token(
  input: unknown,
  path: string,
  allowed = new Set(['key', 'value', 'c']),
): AuthoredThemeToken {
  const source = record(input, path);
  onlyKeys(source, allowed, path);
  tolerateDerivedC(source, path);
  return {
    key: name(source.key, `${path}.key`),
    value: authoredValue(source.value, `${path}.value`),
  };
}

function addUnique(set: Set<string>, key: string, path: string) {
  if (set.has(key)) fail(path, `duplicates token name "${key}"`);
  set.add(key);
}

/**
 * Validates legacy editor-authored content and returns a new persistence-safe
 * projection. The projection deliberately omits compiler-derived `c` fields.
 */
export function projectThemeContent(input: unknown): AuthoredThemeContent {
  const source = record(input, 'theme');
  onlyKeys(source, new Set(['factors', 'groups', 'values']), 'theme');

  if (!Array.isArray(source.factors)) fail('theme.factors', 'must be an array');
  if (!Array.isArray(source.values)) fail('theme.values', 'must be an array');
  const groupSource =
    Array.isArray(source.groups) && source.groups.length === 0
      ? {}
      : record(source.groups, 'theme.groups');
  if (Array.isArray(source.groups)) {
    if (source.groups.length !== 0) fail('theme.groups', 'must be an object');
  }

  if (source.factors.length > THEME_CONTENT_LIMITS.factors)
    fail('theme.factors', 'has too many entries');
  if (source.values.length > THEME_CONTENT_LIMITS.values)
    fail('theme.values', 'has too many entries');
  const groupEntries = Object.entries(groupSource);
  if (groupEntries.length > THEME_CONTENT_LIMITS.groups)
    fail('theme.groups', 'has too many entries');

  const factorNames = new Set<string>();
  const factors = source.factors.map((item, index): AuthoredThemeFactor => {
    const path = `theme.factors[${index}]`;
    const projected = token(
      item,
      path,
      new Set(['key', 'type', 'value', 'min', 'max', 'c']),
    );
    const itemSource = item as Record<string, unknown>;
    if (
      typeof itemSource.type !== 'string' ||
      !FACTOR_TYPES.has(itemSource.type)
    )
      fail(`${path}.type`, 'is not a supported factor type');
    addUnique(factorNames, projected.key, `${path}.key`);
    const result: AuthoredThemeFactor = {
      ...projected,
      type: itemSource.type as AuthoredThemeFactor['type'],
    };
    for (const bound of ['min', 'max'] as const) {
      if (itemSource[bound] !== undefined) {
        if (
          typeof itemSource[bound] !== 'number' ||
          !Number.isFinite(itemSource[bound]) ||
          Math.abs(itemSource[bound]) > THEME_CONTENT_LIMITS.absoluteNumber
        )
          fail(`${path}.${bound}`, 'must be bounded and finite');
        result[bound] = itemSource[bound] as number;
      }
    }
    if (
      result.min !== undefined &&
      result.max !== undefined &&
      result.min > result.max
    )
      fail(path, 'min must not exceed max');
    return result;
  });

  const valueNames = new Set<string>();
  const values = source.values.map((item, index) => {
    const projected = token(item, `theme.values[${index}]`);
    addUnique(valueNames, projected.key, `theme.values[${index}].key`);
    return projected;
  });

  const canonicalNames = new Set<string>();
  const publicAliases: Array<{ key: string; path: string }> = [];
  const groups: Record<string, AuthoredThemeGroup> = {};
  let optionCount = 0;
  for (const [groupIndex, [groupKeyInput, item]] of groupEntries.entries()) {
    const groupKey = name(
      groupKeyInput,
      `theme.groups entry ${groupIndex} key`,
    );
    const path = `theme.groups.${groupKey}`;
    const group = record(item, path);
    onlyKeys(group, new Set(['type', 'options', 'isPublic']), path);
    if (typeof group.type !== 'string' || !GROUP_TYPES.has(group.type))
      fail(`${path}.type`, 'is not a supported group type');
    if (!Array.isArray(group.options))
      fail(`${path}.options`, 'must be an array');
    if (group.options.length > THEME_CONTENT_LIMITS.optionsPerGroup)
      fail(`${path}.options`, 'has too many entries');
    if (group.isPublic !== undefined && typeof group.isPublic !== 'boolean')
      fail(`${path}.isPublic`, 'must be a boolean');

    const optionNames = new Set<string>();
    const options = group.options.map((option, index) => {
      const optionPath = `${path}.options[${index}]`;
      const projected = token(option, optionPath);
      addUnique(optionNames, projected.key, `${optionPath}.key`);
      const canonical = name(
        `${groupKey}-${projected.key}`,
        `${optionPath}.canonicalName`,
      );
      addUnique(canonicalNames, canonical, `${optionPath}.key`);
      if (group.isPublic === true)
        publicAliases.push({ key: projected.key, path: `${optionPath}.key` });
      return projected;
    });
    optionCount += options.length;
    groups[groupKey] = {
      type: group.type as AuthoredThemeGroup['type'],
      options,
      ...(group.isPublic === undefined
        ? {}
        : { isPublic: group.isPublic as boolean }),
    };
  }

  if (
    factors.length + values.length + optionCount >
    THEME_CONTENT_LIMITS.totalTokens
  )
    fail('theme', 'has too many tokens');

  for (const canonical of canonicalNames) {
    if (factorNames.has(canonical) || valueNames.has(canonical))
      fail('theme.groups', `canonical token name "${canonical}" collides`);
  }
  const exported = new Set([...factorNames, ...valueNames, ...canonicalNames]);
  for (const alias of publicAliases) {
    if (exported.has(alias.key))
      fail(alias.path, `public alias "${alias.key}" collides`);
    exported.add(alias.key);
  }

  return { factors, groups, values };
}

export function themeContentBytes(input: unknown): number {
  return Buffer.byteLength(JSON.stringify(input), 'utf8');
}
