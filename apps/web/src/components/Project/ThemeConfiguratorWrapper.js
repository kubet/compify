import React, { useCallback, useEffect } from 'react';
import ThemeConfigurator from './theme/ThemeConfigurator';
import LabelButton from '../Elements/LabelButton';
import { PlusIcon, SparklesIcon } from 'lucide-react';
import { insertTheme } from '@/lib/api';

function ThemeConfiguratorWrapper({ initialTheme, setTheme, componentId, setDefaultOpenBotInput, onBack }) {
    const factors = Array.isArray(initialTheme?.factors) ? initialTheme.factors : [];
    const groups = initialTheme?.groups || {};
    const values = Array.isArray(initialTheme?.values) ? initialTheme.values : [];

    const updateFactor = useCallback((index, newValue) => {
        setTheme(prev => ({
            ...prev,
            factors: prev.factors.map((factor, i) =>
                i === index ? { ...factor, value: newValue } : factor
            )
        }));
    }, [setTheme]);

    const replaceValue = useCallback((value, key, groupKey) => {
        const match = value.match(/^--([\w-]+)/);
        if (!match) return;

        const varName = match[1];

        setTheme(prev => ({
            ...prev,
            values: prev.values.map(v => {
                if (v.key === groupKey && v.value.includes(`--${varName}`)) {
                    return { ...v, value: key };
                }
                return v;
            })
        }));
    }, [setTheme]);

    const handleCreateBlankTheme = async () => {
        const resp = await insertTheme({
            componentId: componentId,
            factors: [],
            groups: {},
            values: []
        });
        if (resp.status === 201) {
            setTheme({ ...resp.data, etag: resp.etag });
            const searchParams = new URLSearchParams({
                c: componentId,
                t: resp.data.id
            }).toString();
            window.open(`/theme?${searchParams}`, '_blank');
        }
    }

    if (!initialTheme) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center">
                <div className="w-20 h-20 mb-5 rounded-full flex items-center justify-center 
                              transform hover:scale-105 transition-all duration-300">
                    <span className="text-3xl">✨</span>
                </div>
                <h3 className="text-gray-100 text-xl font-medium mb-3">
                    Design Your Theme
                </h3>
                <p className="text-gray-400 text-sm mb-5 max-w-[280px]">
                    Customize colors, spacing, and more to match your brand
                </p>
                <div className="flex flex-col items-center gap-3 w-full max-w-[280px]">
                    <LabelButton
                        onClick={handleCreateBlankTheme}
                        variant="info"
                        className="w-fit hover:scale-102 transform transition-all duration-200"
                    >
                        <PlusIcon className="w-4 h-4 mr-2" />
                        Create blank theme manually
                    </LabelButton>

                    <div className="relative w-full">
                        <div className="absolute inset-0 w-full h-[1px] bg-white/10 top-1/2 transform -translate-y-1/2" />
                        <div className="relative z-10 text-white/15 text-sm px-4 mx-auto w-fit"
                            style={{ backgroundColor: '#0a0a0a' }}>
                            or
                        </div>
                    </div>

                    <LabelButton
                        variant="primary"
                        onClick={() => {
                            setDefaultOpenBotInput(true);
                            onBack();
                        }}
                    >
                        <SparklesIcon className="w-4 h-4 mr-2" />
                        Let AI design your theme
                    </LabelButton>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[430px] sm:pl-6 pl-2">
            <ThemeConfigurator
                factors={factors}
                groups={groups}
                values={values}
                updateFactor={updateFactor}
                replaceValue={replaceValue}
            />
        </div>
    );
}

export default ThemeConfiguratorWrapper;