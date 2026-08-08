import { describe, expect, test } from 'bun:test';
import {
    applyThemeConfigFiles,
    emitThemeConfigFiles,
    getExportedThemeTokens,
} from './getTokenConfigFiles';

describe('theme config emitter', () => {
    test('exports public group options with canonical group-prefixed names', () => {
        const emitted = emitThemeConfigFiles({
            values: [{ key: 'background', c: '#fff' }],
            groups: {
                palette: {
                    isPublic: true,
                    options: [{ key: 'primary', c: '#123456' }],
                },
                privatePalette: {
                    isPublic: false,
                    options: [{ key: 'secret', c: '#000' }],
                },
            },
        });

        expect(emitted['/theme.css'].code).toContain('--palette-primary: #123456;');
        expect(emitted['/theme.css'].code).toContain('--primary: #123456;');
        expect(JSON.parse(emitted['/theme.json'].code)).toEqual({
            background: '#fff',
            'palette-primary': '#123456',
            primary: '#123456',
        });
    });

    test('emits deterministically regardless of input ordering', () => {
        const tokens = getExportedThemeTokens({
            values: [
                { key: 'z-index', c: '1' },
                { key: 'background', c: '#fff' },
            ],
            groups: {},
        });

        expect(tokens.map(token => token.key)).toEqual(['background', 'z-index']);
    });

    test('rejects collisions instead of silently overwriting JSON keys', () => {
        expect(() => emitThemeConfigFiles({
            values: [{ key: 'palette-primary', c: '#fff' }],
            groups: {
                palette: {
                    isPublic: true,
                    options: [{ key: 'primary', c: '#000' }],
                },
            },
        })).toThrow('Duplicate exported design token name: "palette-primary"');
    });

    test('rejects ambiguous legacy aliases shared by public groups', () => {
        expect(() => emitThemeConfigFiles({
            groups: {
                palette: { isPublic: true, options: [{ key: 'primary', c: '#000' }] },
                brand: { isPublic: true, options: [{ key: 'primary', c: '#fff' }] },
            },
        })).toThrow('Duplicate exported design token name: "primary"');
    });

    test('rejects unsafe CSS custom-property names', () => {
        expect(() => emitThemeConfigFiles({
            values: [{ key: 'bad; } body', c: 'red' }],
            groups: {},
        })).toThrow('Unsafe design token name');
    });

    test('rejects declaration and rule injection through token values', () => {
        expect(() => emitThemeConfigFiles({
            values: [{ key: 'primary', c: 'red; } body { display: none' }],
            groups: {},
        })).toThrow('Unsafe design token value for "primary"');
    });

    test('preserves semicolons inside a balanced CSS function', () => {
        const emitted = emitThemeConfigFiles({
            values: [{ key: 'asset', c: 'url(data:image/svg+xml;utf8,safe)' }],
            groups: {},
        });
        expect(emitted['/theme.css'].code).toContain('--asset: url(data:image/svg+xml;utf8,safe);');
    });

    test('rejects reserved object keys and overlong names', () => {
        expect(() => emitThemeConfigFiles({
            values: [{ key: '__proto__', c: 'safe-data' }],
            groups: {},
        })).toThrow('Unsafe design token name');
        expect(() => emitThemeConfigFiles({
            values: [{ key: 'a'.repeat(65), c: 'safe-data' }],
            groups: {},
        })).toThrow('Unsafe design token name');
    });

    test('removes stale generated files when no exports remain', () => {
        const files = {
            '/App.js': { code: 'export default function App() {}' },
            '/theme.css': { code: ':root { --old: red; }', hidden: false },
            '/theme.json': { code: '{"old":"red"}', hidden: false },
        };

        const emitted = emitThemeConfigFiles({ values: [], groups: {} });
        const updated = applyThemeConfigFiles(files, emitted);

        expect(emitted).toBeNull();
        expect(updated['/theme.css']).toBeUndefined();
        expect(updated['/theme.json']).toBeUndefined();
        expect(updated['/App.js']).toEqual(files['/App.js']);
    });
});
