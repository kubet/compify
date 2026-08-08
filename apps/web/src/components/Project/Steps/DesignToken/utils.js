import { constructColorValue } from "./InputControl";

export const DELETE_CONFIGS = {
    factor: {
        title: 'Delete Factor',
        message: 'Are you sure you want to delete this factor? This action cannot be undone.',
    },
    groupItem: {
        title: 'Delete Group Item',
        message: 'Are you sure you want to delete this group item? This action cannot be undone.',
    },
    group: {
        title: 'Delete Group',
        message: 'Are you sure you want to delete this entire group? This action cannot be undone.',
    },
    value: {
        title: 'Delete Value',
        message: 'Are you sure you want to delete this value? This action cannot be undone.',
    }
};

export const hasKeysToBeReplaced = (tokens, value) => {
    if (typeof value !== 'string') return false;

    const tokenKeys = tokens.map(token => token.key);
    const regex = new RegExp(`--(?:${tokenKeys.join('|')})(?:[^\\w-]|$)`);
    const hasKeys = regex.test(value);

    return hasKeys;
}

export const isValidColor = (color) => {
    const s = new Option().style;
    s.color = color;
    return s.color !== '';
};

export const isValidColorValue = (color) => {
    const colorValue = constructColorValue(color);
    return isValidColor(colorValue) || isValidColor(color);
};


const DIRECT_TOKEN_REFERENCE = /--[A-Za-z_][A-Za-z0-9_-]{0,63}(?![A-Za-z0-9_-])/g;
const META_TOKEN_REFERENCE = /\$\{(--)?([A-Za-z_][A-Za-z0-9_-]{0,63})\}/g;

const getThemeTokenKeys = (theme) => new Set([
    ...theme.factors.map(factor => factor.key),
    ...Object.entries(theme.groups).flatMap(([groupKey, group]) =>
        group.options.map(option => `${groupKey}-${option.key}`)),
    ...theme.values.map(value => value.key),
]);

export const getPublicGroupTokenAliases = (groups) =>
    Object.entries(groups).flatMap(([groupKey, group]) =>
        group.isPublic
            ? group.options.map((option, optionIndex) => ({ key: option.key, groupKey, optionIndex }))
            : []
    );

export const hasThemeTokenNameCollision = (theme, key) =>
    getThemeTokenKeys(theme).has(key) ||
    getPublicGroupTokenAliases(theme.groups).some(alias => alias.key === key);

export const findPublicGroupAliasCollision = (theme, groupKey) => {
    const group = theme.groups[groupKey];
    if (!group?.isPublic) return null;
    const occupied = getThemeTokenKeys(theme);
    getPublicGroupTokenAliases(theme.groups)
        .filter(alias => alias.groupKey !== groupKey)
        .forEach(alias => occupied.add(alias.key));
    const seen = new Set();
    return group.options.map(option => option.key).find(key => {
        const collision = seen.has(key) || occupied.has(key);
        seen.add(key);
        return collision;
    }) || null;
};

const resolveDirectReferenceKey = (key, knownKeys) => {
    if (!knownKeys || knownKeys.has(key)) return key;
    const suffix = key.match(/^(.*)-(\d+)$/);
    return suffix && knownKeys.has(suffix[1]) ? suffix[1] : key;
};

const RESERVED_TOKEN_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

export const isValidTokenKey = (key) =>
    typeof key === 'string' &&
    /^[A-Za-z_][A-Za-z0-9_-]{0,63}$/.test(key) &&
    !RESERVED_TOKEN_KEYS.has(key);

/**
 * Rewrites only complete token references. In particular, renaming `space` does
 * not alter `--space-large`, plain text, or another token's name.
 */
export const replaceExactTokenReferences = (value, renames, knownKeys = null) => {
    if (typeof value !== 'string') return value;
    const renameMap = renames instanceof Map ? renames : new Map(Object.entries(renames));
    const tokenReference = /\$\{(--)?([A-Za-z_][A-Za-z0-9_-]{0,63})\}|--[A-Za-z_][A-Za-z0-9_-]{0,63}(?![A-Za-z0-9_-])/g;
    return value.replace(tokenReference, (match, prefix, metaKey) => {
        if (metaKey !== undefined) {
            const replacement = renameMap.get(metaKey);
            return replacement === undefined ? match : `\${${prefix || ''}${replacement}}`;
        }
        const fullKey = match.slice(2);
        const key = resolveDirectReferenceKey(fullKey, knownKeys);
        if (!renameMap.has(key)) return match;
        return `--${renameMap.get(key)}${fullKey.slice(key.length)}`;
    });
};

export const rewriteThemeTokenReferences = (theme, renames) => {
    const renameMap = renames instanceof Map ? renames : new Map(Object.entries(renames));
    const knownKeys = getThemeTokenKeys(theme);
    renameMap.forEach((_newKey, oldKey) => knownKeys.add(oldKey));
    return {
        factors: theme.factors.map(factor => ({
            ...factor,
            value: replaceExactTokenReferences(factor.value, renameMap, knownKeys)
        })),
        groups: Object.fromEntries(Object.entries(theme.groups).map(([groupKey, group]) => [
            groupKey,
            {
                ...group,
                options: group.options.map(option => ({
                    ...option,
                    value: replaceExactTokenReferences(option.value, renameMap, knownKeys)
                }))
            }
        ])),
        values: theme.values.map(value => ({
            ...value,
            value: replaceExactTokenReferences(value.value, renameMap, knownKeys)
        }))
    };
};


export const prepareThemeTokenDeletion = (theme, target) => {
    const { type, groupKey = null, index = null, key } = target;
    if (type === 'factor') {
        if (theme.factors[index]?.key !== key) return null;
        return {
            tokenKeys: [key],
            remainingTheme: { ...theme, factors: theme.factors.filter((_, itemIndex) => itemIndex !== index) }
        };
    }
    if (type === 'value') {
        if (theme.values[index]?.key !== key) return null;
        return {
            tokenKeys: [key],
            remainingTheme: { ...theme, values: theme.values.filter((_, itemIndex) => itemIndex !== index) }
        };
    }
    if (type !== 'group' || !groupKey || !Object.prototype.hasOwnProperty.call(theme.groups, groupKey)) return null;
    const group = theme.groups[groupKey];
    if (index !== null) {
        const option = group.options[index];
        if (option?.key !== key) return null;
        return {
            tokenKeys: [
                `${groupKey}-${key}`,
                ...(group.isPublic ? [key] : [])
            ],
            remainingTheme: {
                ...theme,
                groups: {
                    ...theme.groups,
                    [groupKey]: {
                        ...group,
                        options: group.options.filter((_, itemIndex) => itemIndex !== index)
                    }
                }
            }
        };
    }
    if (key !== groupKey) return null;
    const tokenKeys = group.options.flatMap(option => [
        `${groupKey}-${option.key}`,
        ...(group.isPublic ? [option.key] : [])
    ]);
    const { [groupKey]: _removed, ...remainingGroups } = theme.groups;
    return { tokenKeys, remainingTheme: { ...theme, groups: remainingGroups } };
};

export const findThemeTokenReferences = (theme, tokenKeys) => {
    const keys = tokenKeys instanceof Set ? tokenKeys : new Set(tokenKeys);
    const references = [];
    const knownKeys = getThemeTokenKeys(theme);
    keys.forEach(key => knownKeys.add(key));
    const inspect = (value, owner) => {
        if (typeof value !== 'string') return;
        const found = new Set();
        value.replace(META_TOKEN_REFERENCE, (_match, _prefix, key) => {
            if (keys.has(key)) found.add(key);
            return _match;
        });
        value.replace(DIRECT_TOKEN_REFERENCE, (match) => {
            const key = resolveDirectReferenceKey(match.slice(2), knownKeys);
            if (keys.has(key)) found.add(key);
            return match;
        });
        found.forEach(key => references.push({ key, owner }));
    };

    theme.factors.forEach(factor => inspect(factor.value, `factor "${factor.key}"`));
    Object.entries(theme.groups).forEach(([groupKey, group]) => {
        group.options.forEach(option => inspect(option.value, `group option "${groupKey}-${option.key}"`));
    });
    theme.values.forEach(value => inspect(value.value, `value "${value.key}"`));
    return references;
};
