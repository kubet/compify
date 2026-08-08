import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Chip, Slider, Tab, Input, InputField } from "@/components/Elements";
import { ShowPalette } from "../common";
import DesignTokens from './DesignTokens';
import { compileThemeCollections } from '../utils';
import ThemeConfigurator from '../theme/ThemeConfigurator';
import LabelButton from '@/components/Elements/LabelButton';
import { getCssVariables, getJSONConfig } from '../common/getTokenConfigFiles';


const SimpleAi = () => {
    const [activeTab, setActiveTab] = useState('preview');
    const [compileError, setCompileError] = useState('');

    const [factors, setFactors] = useState([
        { key: 'hue', value: 1, c: '1', max: 360, min: 0, type: 'hue' },
        { key: 'lightness', value: 50, c: '50', max: 100, min: 0, type: 'lightness' },
        { key: 'saturation', value: '50', type: 'saturation', max: 100, min: 0 },
        { key: 'spacing', value: 8, c: '8', type: 'value' },
    ]);
    const [groups, setGroups] = useState({
        palette: {
            type: 'palette',
            isPublic: true,
            options: [
                { key: 'primary-100', value: 'hsl(--hue, --saturation%, calc(--lightness - 10%))', c: '' },
                { key: 'primary-200', value: 'hsl(--hue, --saturation%, calc(--lightness - 20%))', c: '' },
                { key: 'primary-300', value: 'hsl(--hue, --saturation%, calc(--lightness - 30%))', c: '' },
                { key: 'primary-400', value: 'hsl(--hue, --saturation%, calc(--lightness - 40%))', c: '' },
                { key: 'primary-500', value: 'hsl(--hue, --saturation%, calc(--lightness - 50%))', c: '' },
                { key: 'primary-600', value: 'hsl(--hue, --saturation%, calc(--lightness - 60%))', c: '' },
                { key: 'primary-700', value: 'hsl(--hue, --saturation%, calc(--lightness - 70%))', c: '' },
                { key: 'primary-800', value: 'hsl(--hue, --saturation%, calc(--lightness - 80%))', c: '' },
                { key: 'primary-900', value: 'hsl(--hue, --saturation%, calc(--lightness - 90%))', c: '' },
            ]
        },
        spacing: {
            type: 'value',
            options: [
                { key: 'small', value: 'calc(--spacing * 1)px', c: '' },
                { key: 'medium', value: 'calc(--spacing * 2)px', c: '' },
                { key: 'large', value: 'calc(--spacing * 3)px', c: '' },
            ]
        },
        borderRadius: {
            type: 'value',
            options: [
                { key: 'small', value: '2px', c: '2px' },
                { key: 'medium', value: '4px', c: '4px' },
                { key: 'large', value: '8px', c: '8px' },
            ]
        },
    });
    const [values, setValues] = useState([
        { key: 'spacing', value: '--spacing-small', c: '' },
        { key: 'borderRadius', value: '--borderRadius-small', c: '' },
        { key: 'bg', value: '--palette-primary-500', c: '' },
        { key: 'text', value: '--palette-primary-100', c: '' },
    ]);


    const replaceValue = (value, key, groupKey) => {
        // Extract the variable name from the value
        const match = value.match(/^--([\w-]+)/);
        if (!match) return;

        const varName = match[1];

        setValues(prev => prev.map(v => {
            // Only update the value if it matches the groupKey
            if (v.key === groupKey && v.value.includes(`--${varName}`)) {
                return { ...v, value: key };
            }
            return v;
        }));
    }
    const getPallets = () => {
        return Object.entries(groups)
            .filter(([_, group]) => group.type === 'palette')
            .map(([groupKey, group]) => ({
                name: groupKey,
                palette: group.options.map((option) => ({
                    name: option.key,
                    value: option.c,
                }))
            }));
    };

    const tabMap = {
        // preview: <Editor modifiedCode={modifiedCode} setModifiedCode={setModifiedCode} code={code} setCode={setCode} template={template} setTemplate={setTemplate} />,
        palette: <ShowPalette pallets={getPallets()} />,
        tokens: <DesignTokens
            factors={factors}
            groups={groups}
            values={values}
            setFactors={setFactors}
            setGroups={setGroups}
            setValues={setValues}
        />,
    }
    const updateFactor = useCallback((index, newValue) => {
        setFactors(prev => prev.map((factor, i) =>
            i === index ? { ...factor, value: newValue } : factor
        ));
    }, []);

    useEffect(() => {
        try {
            const compiled = compileThemeCollections({ factors, groups, values });
            setFactors(previous => JSON.stringify(previous) === JSON.stringify(compiled.factors) ? previous : compiled.factors);
            setGroups(previous => JSON.stringify(previous) === JSON.stringify(compiled.groups) ? previous : compiled.groups);
            setValues(previous => JSON.stringify(previous) === JSON.stringify(compiled.values) ? previous : compiled.values);
            setCompileError('');
        } catch (error) {
            console.error('Theme compilation failed:', error);
            setCompileError(error instanceof Error ? error.message : 'Theme tokens could not be compiled.');
        }
    }, [factors, groups, values]);



    return (
        <div className="space-y-8">
            {compileError && <p className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{compileError}</p>}
            <motion.h4
                className="text-2xl mb-4 md:text-3xl font-extrabold text-start w-full bg-gradient-to-r from-gray-300 via-gray-500 to-gray-700 bg-clip-text text-transparent"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                AI-Powered Theme Generator
            </motion.h4>

            <ThemeConfigurator factors={factors} groups={groups} values={values} updateFactor={updateFactor} replaceValue={replaceValue} />

            <div className="border-b border-[rgba(255,255,255,0.1)]">
                <nav className="-mb-px flex">
                    <Tab isActive={activeTab === 'preview'} onClick={() => setActiveTab('preview')}>
                        Preview
                    </Tab>
                    <Tab isActive={activeTab === 'palette'} onClick={() => setActiveTab('palette')}>
                        Color Palette
                    </Tab>
                    <Tab isActive={activeTab === 'tokens'} onClick={() => setActiveTab('tokens')}>
                        Design Tokens
                    </Tab>
                </nav>
            </div>

            <div className="py-4">
                {tabMap[activeTab]}

            </div>
        </div>
    );
};

export default SimpleAi;