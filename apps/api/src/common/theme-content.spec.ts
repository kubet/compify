import { projectThemeContent, THEME_CONTENT_LIMITS } from './theme-content';

const source = () => ({
  factors: [
    { key: 'hue', type: 'hue', value: 0, min: 0, max: 360, c: 'stale' },
    { key: 'draft', type: 'value', value: '' },
  ],
  groups: {
    mode: {
      type: 'value',
      options: [{ key: 'light', value: 'light', c: 'light' }],
      isPublic: false,
    },
    palette: {
      type: 'palette',
      options: [{ key: 'primary', value: 12 }],
    },
  },
  values: [
    { key: 'hue', value: '--hue', c: '--hue' },
    { key: '_empty', value: '' },
  ],
});

describe('authored theme content projection', () => {
  it('preserves supported legacy variants and overlap while stripping scalar c', () => {
    const result = projectThemeContent(source());
    expect(result).toEqual({
      factors: [
        { key: 'hue', type: 'hue', value: 0, min: 0, max: 360 },
        { key: 'draft', type: 'value', value: '' },
      ],
      groups: {
        mode: {
          type: 'value',
          options: [{ key: 'light', value: 'light' }],
          isPublic: false,
        },
        palette: {
          type: 'palette',
          options: [{ key: 'primary', value: 12 }],
        },
      },
      values: [
        { key: 'hue', value: '--hue' },
        { key: '_empty', value: '' },
      ],
    });
    expect(
      projectThemeContent({ factors: [], groups: [], values: [] }).groups,
    ).toEqual({});
  });

  it.each([
    [{ factors: {}, groups: {}, values: [] }, 'theme.factors'],
    [
      {
        factors: [],
        groups: { x: { type: 'values', options: {} } },
        values: [],
      },
      'options',
    ],
    [
      {
        factors: [{ key: 'x', type: 'wat', value: 1 }],
        groups: {},
        values: [],
      },
      'type',
    ],
    [
      { factors: [], groups: {}, values: [{ key: '2bad', value: 1 }] },
      'safe token name',
    ],
    [
      {
        factors: [{ key: 'x', type: 'slider', value: 1, min: 2, max: 1 }],
        groups: {},
        values: [],
      },
      'min must not exceed max',
    ],
    [
      { factors: [], groups: {}, values: [{ key: 'x', value: Infinity }] },
      'finite number',
    ],
    [
      {
        factors: [],
        groups: {},
        values: [{ key: 'x', value: 1, extra: true }],
      },
      'unsupported property',
    ],
    [
      { factors: [], groups: {}, values: [{ key: 'x', value: 1, c: {} }] },
      'must be a string or bounded finite number',
    ],
  ])('rejects malformed nested authored content %#', (input, message) => {
    expect(() => projectThemeContent(input)).toThrow(message as string);
  });

  it.each([
    {
      factors: [
        { key: 'x', type: 'value', value: 1 },
        { key: 'x', type: 'value', value: 2 },
      ],
      groups: {},
      values: [],
    },
    {
      factors: [],
      groups: {
        a: {
          type: 'values',
          options: [
            { key: 'x', value: 1 },
            { key: 'x', value: 2 },
          ],
        },
      },
      values: [],
    },
    {
      factors: [],
      groups: {
        a: { type: 'values', options: [{ key: 'b-c', value: 1 }] },
        'a-b': { type: 'values', options: [{ key: 'c', value: 2 }] },
      },
      values: [],
    },
    {
      factors: [{ key: 'primary', type: 'value', value: 1 }],
      groups: {
        palette: {
          type: 'palette',
          isPublic: true,
          options: [{ key: 'primary', value: 2 }],
        },
      },
      values: [],
    },
  ])('rejects namespace and exported-name ambiguity %#', (input) => {
    expect(() => projectThemeContent(input)).toThrow(/duplicate|collide/);
  });

  it('accepts every shipped factor and group type', () => {
    const factors = ['hue', 'saturation', 'lightness', 'slider', 'value'].map(
      (type, index) => ({ key: `factor${index}`, type, value: index }),
    );
    const groups = Object.fromEntries(
      ['palette', 'value', 'values'].map((type, index) => [
        `group${index}`,
        { type, options: [{ key: 'option', value: '' }] },
      ]),
    );
    expect(() =>
      projectThemeContent({ factors, groups, values: [] }),
    ).not.toThrow();
  });

  it.each([
    {
      factors: [],
      groups: [{ type: 'value', options: [] }],
      values: [],
    },
    {
      factors: [],
      groups: { group: { type: 'value', options: [], isPublic: 'false' } },
      values: [],
    },
    {
      factors: [],
      groups: {},
      values: [{ key: 'large', value: 1_000_001 }],
    },
    {
      factors: [],
      groups: {},
      values: [{ key: 'derived', value: '', c: null }],
    },
    {
      factors: [],
      groups: {
        gggggggggggggggggggggggggggggggggggggggg: {
          type: 'value',
          options: [{ key: 'oooooooooooooooooooooooooooooo', value: '' }],
        },
      },
      values: [],
    },
  ])('rejects unsafe legacy edge cases %#', (input) => {
    expect(() => projectThemeContent(input)).toThrow();
  });

  it('rejects reserved group keys without prototype mutation', () => {
    const groups = JSON.parse('{"__proto__":{"type":"value","options":[]}}');
    expect(() =>
      projectThemeContent({ factors: [], groups, values: [] }),
    ).toThrow('safe token name');
  });

  it('enforces explicit collection and total-token bounds', () => {
    const factors = Array.from(
      { length: THEME_CONTENT_LIMITS.factors + 1 },
      (_, index) => ({
        key: `f${index}`,
        type: 'value',
        value: index,
      }),
    );
    expect(() =>
      projectThemeContent({ factors, groups: {}, values: [] }),
    ).toThrow('too many');
  });
});
