import { describe, expect, test } from 'bun:test';
import {
    findPublicGroupAliasCollision,
    findThemeTokenReferences,
    getPublicGroupTokenAliases,
    hasThemeTokenNameCollision,
    isValidTokenKey,
    replaceExactTokenReferences,
    rewriteThemeTokenReferences,
} from './utils';

const theme = () => ({
    factors: [
        { key: 'space', value: '8' },
        { key: 'space-large', value: '--space * 2' },
    ],
    groups: {
        palette: {
            type: 'palette',
            options: [
                { key: 'base', value: 'hsl(${--space} 50% 50%)' },
                { key: 'accent', value: '--palette-base' },
            ],
        },
    },
    values: [
        { key: 'card', value: 'calc(--space + 2) --space-large --space-3 ${space}' },
    ],
});

describe('theme token reference integrity', () => {
    test('accepts only emitter-contract token names and rejects reserved object keys', () => {
        expect(isValidTokenKey('_primary-2')).toBe(true);
        expect(isValidTokenKey('primary--')).toBe(true);
        expect(isValidTokenKey('a'.repeat(64))).toBe(true);
        expect(isValidTokenKey('2primary')).toBe(false);
        expect(isValidTokenKey('a'.repeat(65))).toBe(false);
        expect(isValidTokenKey('__proto__')).toBe(false);
        expect(isValidTokenKey('prototype')).toBe(false);
        expect(isValidTokenKey('constructor')).toBe(false);
    });

    test('collects deprecated unprefixed aliases only for public group options', () => {
        const groups = {
            palette: { isPublic: true, options: [{ key: 'primary' }, { key: 'muted' }] },
            privatePalette: { isPublic: false, options: [{ key: 'secret' }] },
        };
        expect(getPublicGroupTokenAliases(groups)).toEqual([
            { key: 'primary', groupKey: 'palette', optionIndex: 0 },
            { key: 'muted', groupKey: 'palette', optionIndex: 1 },
        ]);
        const collisionTheme = { factors: [], values: [{ key: 'background' }], groups };
        expect(hasThemeTokenNameCollision(collisionTheme, 'background')).toBe(true);
        expect(hasThemeTokenNameCollision(collisionTheme, 'palette-primary')).toBe(true);
        expect(hasThemeTokenNameCollision(collisionTheme, 'primary')).toBe(true);
        expect(hasThemeTokenNameCollision(collisionTheme, 'secret')).toBe(false);
    });
    test('detects collisions when an existing group becomes public', () => {
        const candidate = {
            factors: [{ key: 'primary' }],
            values: [],
            groups: {
                palette: {
                    isPublic: true,
                    options: [{ key: 'primary' }, { key: 'duplicate' }, { key: 'duplicate' }],
                },
            },
        };
        expect(findPublicGroupAliasCollision(candidate, 'palette')).toBe('primary');
        candidate.factors = [];
        expect(findPublicGroupAliasCollision(candidate, 'palette')).toBe('duplicate');
        candidate.groups.palette.isPublic = false;
        expect(findPublicGroupAliasCollision(candidate, 'palette')).toBeNull();
    });

    test('renames complete direct and meta references without touching prefixes or text', () => {
        expect(replaceExactTokenReferences(
            '--space --space-large ${space} ${--space} space',
            { space: 'gap' },
        )).toBe('--gap --space-large ${gap} ${--gap} space');
        expect(replaceExactTokenReferences('--primary--', { 'primary--': 'accent--' }))
            .toBe('--accent--');
    });

    test('cascades a rename throughout factor, group-option, and value expressions', () => {
        const rewritten = rewriteThemeTokenReferences(theme(), { space: 'gap' });
        expect(rewritten.factors[1].value).toBe('--gap * 2');
        expect(rewritten.groups.palette.options[0].value).toBe('hsl(${--gap} 50% 50%)');
        expect(rewritten.values[0].value).toBe('calc(--gap + 2) --space-large --gap-3 ${gap}');
    });

    test('supports group and option composite-key renames', () => {
        const rewritten = rewriteThemeTokenReferences(theme(), {
            'palette-base': 'colors-primary',
        });
        expect(rewritten.groups.palette.options[1].value).toBe('--colors-primary');
    });

    test('reports only exact references remaining after a proposed deletion', () => {
        const references = findThemeTokenReferences(theme(), new Set(['space', 'palette-base']));
        expect(references).toEqual([
            { key: 'space', owner: 'factor "space-large"' },
            { key: 'space', owner: 'group option "palette-base"' },
            { key: 'palette-base', owner: 'group option "palette-accent"' },
            { key: 'space', owner: 'value "card"' },
        ]);
        expect(findThemeTokenReferences(theme(), ['palette'])).toEqual([]);
    });
});
