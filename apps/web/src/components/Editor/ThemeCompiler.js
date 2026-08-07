import React, { useMemo, useCallback, useEffect } from 'react'
import keyReplace from '../Project/utils';
import { getCssVariables, getJSONConfig } from '../Project/common/getTokenConfigFiles';

function ThemeCompiler({ initialTheme, setTheme, setFilesState }) {
    const factors = useMemo(() => Array.isArray(initialTheme?.factors) ? initialTheme.factors : [], [initialTheme?.factors]);
    const groups = useMemo(() => initialTheme?.groups || {}, [initialTheme?.groups]);
    const values = useMemo(() => Array.isArray(initialTheme?.values) ? initialTheme.values : [], [initialTheme?.values]);

    const getAllTokens = useMemo(() => {
        if (!factors || !groups) return [];

        const factorTokens = factors.map(factor => ({
            key: factor.key,
            value: factor.value,
            c: factor.c
        }));

        const groupTokens = Object.entries(groups).flatMap(([groupKey, group]) =>
            (group?.options || []).map(item => ({
                key: `${groupKey}-${item.key}`,
                value: item.value,
                c: item.c
            }))
        );

        return [...factorTokens, ...groupTokens, ...values];
    }, [factors, groups, values]); // Changed dependency array to specific properties

    const compileValue = useCallback((value, tokens) => {
        if (typeof value !== 'string') {
            return value;
        }
        let compiledValue = keyReplace(tokens, value);
        if (typeof compiledValue === 'string' && compiledValue.includes('--')) {
            compiledValue = keyReplace(tokens, compiledValue);
        }
        return compiledValue;
    }, []);

    const updateCompiledValues = useCallback(() => {
        const allTokens = getAllTokens;

        const updatedFactors = factors.map(factor => ({
            ...factor,
            c: compileValue(factor.value, allTokens)
        }));

        const updatedGroups = Object.fromEntries(
            Object.entries(groups).map(([key, group]) => [
                key,
                {
                    ...group,
                    options: group.options.map(item => ({
                        ...item,
                        c: compileValue(item.value, allTokens)
                    }))
                }
            ])
        );

        const updatedValues = values.map(value => ({
            ...value,
            c: compileValue(value.value, allTokens)
        }));

        return { updatedFactors, updatedGroups, updatedValues };
    }, [compileValue, getAllTokens, factors, groups, values]);

    useEffect(() => {
        const { updatedFactors, updatedGroups, updatedValues } = updateCompiledValues();
        // Only update if there are actual changes
        const hasChanges =
            JSON.stringify(updatedFactors) !== JSON.stringify(factors) ||
            JSON.stringify(updatedGroups) !== JSON.stringify(groups) ||
            JSON.stringify(updatedValues) !== JSON.stringify(values);
        if (updatedValues.length > 0 || Object.values(updatedGroups).some(group => group.isPublic)) {
            // Get all public group options
            const publicGroupOptions = Object.values(updatedGroups)
                .filter(group => group.isPublic)
                .flatMap(group => group.options || []);

            // Combine updatedValues with public group options
            const allValues = [...updatedValues, ...publicGroupOptions];

            const cssContent = getCssVariables(allValues);
            const jsonContent = JSON.stringify(getJSONConfig(allValues), null, 2);

            setFilesState(prev => ({
                ...prev,
                '/theme.css': {
                    code: cssContent,
                    hidden: false
                },
                '/theme.json': {
                    code: jsonContent,
                    hidden: false
                }
            }));
        }
        if (hasChanges) {
            setTheme(prev => ({
                ...prev,
                factors: updatedFactors,
                groups: updatedGroups,
                values: updatedValues
            }));
        }
    }, [updateCompiledValues, setFilesState, setTheme, factors, groups, values]);

    return null;
}

export default ThemeCompiler;