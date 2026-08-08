import { describe, expect, test } from 'bun:test';
import keyReplace, { compileThemeCollections, createThemeTokenResolver } from './index';

describe('theme token resolver', () => {
    const tokens = [
        { key: 'space', value: '8px' },
        { key: 'space-2', value: '16px' },
        { key: 'nested', value: '--space * 2' },
        { key: 'meta', value: '${space}' },
    ];

    test('preserves legacy direct, meta, suffix, arithmetic, and calc outputs', () => {
        expect(keyReplace(tokens, '--space')).toBe('8px');
        expect(keyReplace(tokens, '--space * 3')).toBe('24');
        expect(keyReplace(tokens, '--space-2')).toBe('16px');
        expect(keyReplace(tokens, '--space-3')).toBe('8px-3');
        expect(keyReplace(tokens, '--nested')).toBe('16');
        expect(keyReplace(tokens, '${space}-3')).toBe('8px-3');
        expect(keyReplace(tokens, '--meta')).toBe('${space}');
        expect(keyReplace(tokens, '${meta}')).toBe('8px');
        expect(keyReplace(tokens, 'calc((--space + 2) * 3)')).toBe('30');
        expect(keyReplace(tokens, 'calc(-(--space + .5) * +2)')).toBe('-17');
        expect(keyReplace(tokens, 'calc(50% + 25%)')).toBe('75%');
        expect(keyReplace(tokens, 'calc(1 / 0)')).toBe('calc(1 / 0)');
        expect(keyReplace(tokens, 'calc(2 ** 3)')).toBe('calc(2 ** 3)');
        expect(() => keyReplace(tokens, '--space / 0'))
            .toThrow('Theme token arithmetic produced a non-finite result');
        expect(keyReplace(tokens, '--unknown ${unknown}')).toBe('--unknown ${unknown}');

        const dynamic = [
            { key: 'theme', value: 'light' },
            { key: 'palette-light-background', value: '#fff' },
            { key: 'background', value: '--palette-${--theme}-background' },
        ];
        expect(keyReplace(dynamic, '--background')).toBe('#fff');
    });

    test('preserves legacy phases for meta-only direct values and dynamic names', () => {
        const phaseTokens = [
            { key: 'base', value: '8px' },
            { key: 'meta-only', value: 'pre-${base}-post' },
            { key: 'name', value: 'base' },
        ];
        expect(keyReplace(phaseTokens, '--meta-only')).toBe('pre-${base}-post');
        expect(keyReplace(phaseTokens, '--${name}')).toBe('8px');

        const compiled = compileThemeCollections({
            factors: phaseTokens,
            groups: {},
            values: [
                { key: 'chosen', value: '--${name}' },
                { key: 'indirect', value: '--meta-only' },
            ],
        });
        expect(compiled.factors[1].c).toBe('pre-8px-post');
        expect(compiled.values[0].c).toBe('8px');
        expect(compiled.values[1].c).toBe('pre-${base}-post');
    });

    test('does not execute malicious calc expressions', () => {
        globalThis.keyReplaceWasExecuted = false;
        const malicious = 'calc(globalThis.keyReplaceWasExecuted = true)';
        expect(keyReplace(tokens, malicious)).toBe(malicious);
        expect(globalThis.keyReplaceWasExecuted).toBe(false);
        delete globalThis.keyReplaceWasExecuted;
    });

    test.each([
        [[{ key: 'a', value: '--a' }], '--a'],
        [[{ key: 'a', value: '${b}' }, { key: 'b', value: '${a}' }], '${a}'],
        [[{ key: 'a', value: '--b' }, { key: 'b', value: '${a}' }], '--a'],
    ])('throws for direct, meta, and mixed cycles', (cyclicTokens, input) => {
        expect(() => keyReplace(cyclicTokens, input)).toThrow('Theme token cycle detected');
    });

    test('fails closed when a 33-token chain exhausts depth', () => {
        const chain = Array.from({ length: 33 }, (_, index) => ({
            key: `chain-${index}`,
            value: index === 32 ? 'done' : `--chain-${index + 1}`,
        }));
        expect(() => keyReplace(chain, '--chain-0')).toThrow('Theme token resolution depth limit exceeded');
    });

    test('enforces deterministic input, per-result output, and substitution limits', () => {
        expect(() => keyReplace([], 'x'.repeat(100_001))).toThrow('Theme token resolution input limit exceeded');
        expect(() => keyReplace([{ key: 'wide', value: 'x'.repeat(101) }], '--wide'.repeat(1_000)))
            .toThrow('Theme token resolution output limit exceeded');
        expect(() => keyReplace([{ key: 'x', value: 'x' }], '--x'.repeat(10_001)))
            .toThrow('Theme token resolution substitution limit exceeded');
    });

    test('enforces aggregate final-output and work limits on one resolver instance', () => {
        const outputResolver = createThemeTokenResolver([{ key: 'wide', value: 'x'.repeat(90_000) }]);
        for (let index = 0; index < 11; index++) {
            expect(outputResolver('--wide')).toHaveLength(90_000);
        }
        expect(() => outputResolver('--wide')).toThrow('Theme token resolution final output limit exceeded');

        const workResolver = createThemeTokenResolver([]);
        const costly = `calc(${'1+'.repeat(49_995)}1)`;
        let workError;
        for (let index = 0; index < 100 && !workError; index++) {
            try { workResolver(costly); } catch (error) { workError = error; }
        }
        expect(workError?.message).toBe('Theme token resolution work limit exceeded');
        expect(() => keyReplace([], '${'.repeat(49_999)))
            .toThrow('Theme token resolution work limit exceeded');
    });

    test('rejects oversized collections before resolver allocation', () => {
        const tokens = Array.from({ length: 5_001 }, (_, index) => ({ key: `t${index}`, value: 1 }));
        expect(() => createThemeTokenResolver(tokens)).toThrow('Theme token collection limit exceeded');
        expect(() => compileThemeCollections({
            factors: Array.from({ length: 101 }, (_, index) => ({ key: `f${index}`, value: 1 })),
            groups: {},
            values: [],
        })).toThrow('Theme token collection limit exceeded');
        expect(() => compileThemeCollections({
            factors: [],
            groups: { oversized: { options: Array.from({ length: 501 }, (_, index) => ({ key: `o${index}`, value: 1 })) } },
            values: [],
        })).toThrow('Theme token collection limit exceeded');
        expect(() => compileThemeCollections({ factors: [], groups: [], values: [] }))
            .toThrow('Theme token collections are malformed');
        expect(() => compileThemeCollections({
            factors: [],
            groups: {
                ['g'.repeat(5_000)]: {
                    options: Array.from({ length: 500 }, (_, index) => ({ key: `o${index}`, value: 1 })),
                },
            },
            values: [],
        })).toThrow('Theme token collection limit exceeded');

        const boundedResolver = createThemeTokenResolver([{ key: 'wide', value: 'x'.repeat(90_000) }]);
        expect(boundedResolver.intermediate).toBeUndefined();
        for (let index = 0; index < 11; index++) boundedResolver.compile('--wide');
        expect(() => boundedResolver.compile('--wide'))
            .toThrow('Theme token resolution final output limit exceeded');
    });

    test('charges only final compiler output while retaining bounded work', () => {
        const values = Array.from({ length: 90 }, (_, index) => ({
            key: `v${index}`,
            value: `${'x'.repeat(9_975)}--external`,
        }));
        const compiled = compileThemeCollections({ factors: [], groups: {}, values });
        expect(compiled.values).toHaveLength(90);
        expect(compiled.values[89].c).toBe(values[89].value);
    });

    test('compileThemeCollections throws without returning a partial object', () => {
        const source = {
            factors: [{ key: 'ok', value: '1' }],
            groups: {},
            values: [{ key: 'bad', value: '--bad' }],
        };
        let compiled;
        expect(() => { compiled = compileThemeCollections(source); }).toThrow('Theme token cycle detected');
        expect(compiled).toBeUndefined();
        expect(source.factors[0].c).toBeUndefined();
    });
});
