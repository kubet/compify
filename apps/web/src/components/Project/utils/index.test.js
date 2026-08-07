import { describe, expect, test } from 'bun:test';
import keyReplace from './index';

describe('keyReplace', () => {
    const tokens = [
        { key: 'space', value: '8px' },
        { key: 'space-2', value: '16px' },
        { key: 'nested', value: '--space * 2' },
    ];

    test('replaces tokens, arithmetic, suffixes, and balanced calc expressions', () => {
        expect(keyReplace(tokens, '--space')).toBe('8px');
        expect(keyReplace(tokens, '--space * 3')).toBe('24');
        expect(keyReplace(tokens, '--space-2')).toBe('16px');
        expect(keyReplace(tokens, '--space-3')).toBe('8px-3');
        expect(keyReplace(tokens, '--nested')).toBe('16');
        expect(keyReplace(tokens, 'calc((--space + 2) * 3)')).toBe('30');
    });

    test('parses only the supported arithmetic grammar', () => {
        expect(keyReplace(tokens, 'calc(-(--space + .5) * +2)')).toBe('-17');
        expect(keyReplace(tokens, 'calc(50% + 25%)')).toBe('75%');
        expect(keyReplace(tokens, 'calc(1 / 0)')).toBe('calc(1 / 0)');
        expect(keyReplace(tokens, 'calc(2 ** 3)')).toBe('calc(2 ** 3)');
    });

    test('does not execute malicious calc expressions', () => {
        globalThis.keyReplaceWasExecuted = false;
        const malicious = 'calc(globalThis.keyReplaceWasExecuted = true)';
        expect(keyReplace(tokens, malicious)).toBe(malicious);
        expect(globalThis.keyReplaceWasExecuted).toBe(false);
        delete globalThis.keyReplaceWasExecuted;
    });

    test('preserves a self-referencing token instead of recursing', () => {
        expect(keyReplace([{ key: 'self', value: '--self' }], '--self')).toBe('--self');
    });

    test('preserves unresolved text for a two-token cycle', () => {
        const cyclicTokens = [
            { key: 'a', value: '--b' },
            { key: 'b', value: '--a' },
        ];
        expect(keyReplace(cyclicTokens, '--a')).toBe('--a');
    });

    test('bounds very long token-reference chains', () => {
        const chain = Array.from({ length: 1_000 }, (_, index) => ({
            key: `chain-${index}`,
            value: `--chain-${index + 1}`,
        }));
        expect(keyReplace(chain, '--chain-0')).toBe('--chain-32');
    });

    test('handles a large unterminated calc expression with bounded scanning', () => {
        const malformed = `calc(${ '('.repeat(100_000) }1`;
        expect(keyReplace(tokens, malformed)).toBe(malformed);
    });
});
