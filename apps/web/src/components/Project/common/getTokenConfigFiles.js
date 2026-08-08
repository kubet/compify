const TOKEN_NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_-]{0,63}$/;
const RESERVED_TOKEN_NAMES = new Set(['__proto__', 'prototype', 'constructor']);

const serializeCssValue = (value, key) => {
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
    if (typeof value !== 'string' || value.trim() === '') {
        throw new Error(`Invalid design token value for "${key}"`);
    }

    const normalized = value.trim();
    let quote = null;
    let escaped = false;
    let comment = false;
    let parentheses = 0;
    for (let index = 0; index < normalized.length; index += 1) {
        const character = normalized[index];
        const next = normalized[index + 1];
        if (comment) {
            if (character === '*' && next === '/') {
                comment = false;
                index += 1;
            }
            continue;
        }
        if (quote) {
            if (escaped) escaped = false;
            else if (character === '\\') escaped = true;
            else if (character === quote) quote = null;
            else if (character === '\n' || character === '\r') throw new Error(`Unsafe design token value for "${key}"`);
            continue;
        }
        if (character === '/' && next === '*') {
            comment = true;
            index += 1;
        } else if (character === '"' || character === "'") quote = character;
        else if (character === '(') parentheses += 1;
        else if (character === ')') {
            parentheses -= 1;
            if (parentheses < 0) throw new Error(`Unsafe design token value for "${key}"`);
        } else if (character === '{' || character === '}' || (character === ';' && parentheses === 0)) {
            throw new Error(`Unsafe design token value for "${key}"`);
        } else if (/[^\t\x20-\x7e]/.test(character)) throw new Error(`Unsafe design token value for "${key}"`);
    }
    if (quote || comment || parentheses !== 0 || escaped) throw new Error(`Unsafe design token value for "${key}"`);
    return normalized;
};

const validateAndSortTokens = (tokens) => {
    const seen = new Set();

    const validatedTokens = tokens.map((token) => {
        const key = typeof token?.key === 'string' ? token.key : '';
        if (!TOKEN_NAME_PATTERN.test(key) || RESERVED_TOKEN_NAMES.has(key)) {
            throw new Error(`Unsafe design token name: "${key}"`);
        }
        if (seen.has(key)) {
            throw new Error(`Duplicate exported design token name: "${key}"`);
        }
        seen.add(key);
        return { key, c: serializeCssValue(token?.c, key) };
    });

    return validatedTokens.sort((a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0);
};

export const getExportedThemeTokens = ({ values = [], groups = {} } = {}) => {
    const valueTokens = Array.isArray(values) ? values : [];
    const publicGroupTokens = Object.entries(groups || {}).flatMap(([groupKey, group]) => {
        if (!group?.isPublic) return [];
        return (Array.isArray(group.options) ? group.options : []).flatMap((option) => {
            const optionKey = option?.key ?? '';
            return [
                { ...option, key: `${groupKey}-${optionKey}` },
                // Keep the original unprefixed key while consumers migrate to
                // the collision-safe canonical group-option name.
                { ...option, key: optionKey },
            ];
        });
    });

    return validateAndSortTokens([...valueTokens, ...publicGroupTokens]);
};

export const getCssVariables = (tokens) => {
    const safeTokens = validateAndSortTokens(tokens);
    const variables = safeTokens.map(token => `--${token.key}: ${token.c};`).join('\n');
    return `:root {\n${variables}\n}`;
}

export const getJSONConfig = (tokens) => {
    const safeTokens = validateAndSortTokens(tokens);
    return safeTokens.reduce((acc, token) => {
        Object.defineProperty(acc, token.key, {
            value: token.c,
            enumerable: true,
            configurable: true,
            writable: true,
        });
        return acc;
    }, {});
}

export const emitThemeConfigFiles = (theme) => {
    const tokens = getExportedThemeTokens(theme);
    if (tokens.length === 0) return null;

    return {
        '/theme.css': {
            code: getCssVariables(tokens),
            hidden: false,
        },
        '/theme.json': {
            code: JSON.stringify(getJSONConfig(tokens), null, 2),
            hidden: false,
        },
    };
};

export const applyThemeConfigFiles = (files, emittedFiles) => {
    if (emittedFiles) return { ...files, ...emittedFiles };
    if (!files['/theme.css'] && !files['/theme.json']) return files;

    const nextFiles = { ...files };
    delete nextFiles['/theme.css'];
    delete nextFiles['/theme.json'];
    return nextFiles;
};
