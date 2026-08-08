import React, { useMemo, useEffect } from 'react'
import { compileThemeCollections } from '../Project/utils';
import { applyThemeConfigFiles, emitThemeConfigFiles } from '../Project/common/getTokenConfigFiles';

function ThemeCompiler({ initialTheme, setTheme, setFilesState, onExportError }) {
    const factors = useMemo(() => Array.isArray(initialTheme?.factors) ? initialTheme.factors : [], [initialTheme?.factors]);
    const groups = useMemo(() => initialTheme?.groups || {}, [initialTheme?.groups]);
    const values = useMemo(() => Array.isArray(initialTheme?.values) ? initialTheme.values : [], [initialTheme?.values]);

    useEffect(() => () => onExportError?.(null), [onExportError]);

    useEffect(() => {
        try {
            // Compile and validate exports before scheduling either state update.
            // A resolver failure therefore leaves both the theme and files untouched.
            const compiled = compileThemeCollections({ factors, groups, values });
            const emittedFiles = emitThemeConfigFiles({
                values: compiled.values,
                groups: compiled.groups,
            });
            const hasChanges =
                JSON.stringify(compiled.factors) !== JSON.stringify(factors) ||
                JSON.stringify(compiled.groups) !== JSON.stringify(groups) ||
                JSON.stringify(compiled.values) !== JSON.stringify(values);

            setFilesState(prev => applyThemeConfigFiles(prev, emittedFiles));
            if (hasChanges) {
                setTheme(prev => ({ ...prev, ...compiled }));
            }
            onExportError?.(null);
        } catch (error) {
            // Preserve the last known-good theme/files and block saving until fixed.
            const message = error instanceof Error ? error.message : String(error);
            console.error('Theme compilation failed:', error);
            onExportError?.(message);
        }
    }, [setFilesState, setTheme, factors, groups, values, onExportError]);

    return null;
}

export default ThemeCompiler;