const TOKEN_NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_-]*$/;

const validateAndSortTokens = (tokens) => {
    const seen = new Set();

    const validatedTokens = tokens.map((token) => {
        const key = typeof token?.key === 'string' ? token.key : '';
        if (!TOKEN_NAME_PATTERN.test(key)) {
            throw new Error(`Unsafe design token name: "${key}"`);
        }
        if (seen.has(key)) {
            throw new Error(`Duplicate exported design token name: "${key}"`);
        }
        seen.add(key);
        return { key, c: token?.c ?? '' };
    });

    return validatedTokens.sort((a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0);
};

export const getExportedThemeTokens = ({ values = [], groups = {} } = {}) => {
    const valueTokens = Array.isArray(values) ? values : [];
    const publicGroupTokens = Object.entries(groups || {}).flatMap(([groupKey, group]) => {
        if (!group?.isPublic) return [];
        return (Array.isArray(group.options) ? group.options : []).map((option) => ({
            ...option,
            key: `${groupKey}-${option?.key ?? ''}`,
        }));
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
