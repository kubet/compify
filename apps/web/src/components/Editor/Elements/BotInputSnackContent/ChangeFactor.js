import { Slider } from '@/components/Elements'
import React, { useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import useDebounce from '@/utils/debounce';
import { Settings } from 'lucide-react'

function ChangeFactor({ factor, theme, setTheme, openMenu }) {
    const sliderConfigs = useMemo(() => ({
        hue: {
            background: 'linear-gradient(to right, red, yellow, lime, cyan, blue, magenta, red)',
            animate: { rotate: [0, 360] },
            transition: { duration: 20, repeat: Infinity, ease: "linear" }
        },
        lightness: {
            background: "linear-gradient(to right, black, white)",
            animate: { x: [0, 10, 0] },
            transition: { duration: 2, repeat: Infinity }
        },
        saturation: {
            background: "linear-gradient(to right, gray, red)",
            animate: { scale: [1, 1.02, 1] },
            transition: { duration: 2, repeat: Infinity }
        },
        slider: {
            background: "linear-gradient(to right, white, gray)"
        }
    }), []);



    const foundFactor = useMemo(() => {
        return theme.factors.find(f => f.key === factor);
    }, [theme, factor]);

    const config = sliderConfigs[foundFactor?.type] || {
        background: "linear-gradient(to right, white, gray)"
    };

    const handleUpdateFactor = (value) => {
        debouncedUpdateFactor(foundFactor, value);
    };

    const updateFactor = useCallback((fa, newValue) => {
        setTheme(prev => ({
            ...prev,
            factors: prev.factors.map((factor, i) =>
                factor?.key === fa?.key ? { ...factor, value: newValue } : factor
            )
        }));
    }, [setTheme]);
    const debouncedUpdateFactor = useDebounce(updateFactor, 16);

    if (!foundFactor) return null;

    return (
        <>
            <div className="flex flex-col gap-1.5 pb-1.5">
                <span className="text-sm capitalize">{factor}</span>
                <motion.div className="relative">
                    <Slider
                        max={foundFactor?.max || 100}
                        min={foundFactor?.min || 0}
                        defaultValue={foundFactor?.value}
                        onValueChange={(value) => handleUpdateFactor(value)}
                        gradientBg={config.background}
                        backgroundColor="#0a0a0a40"
                    />
                    {config.animate && (
                        <motion.div
                            className="absolute inset-0 pointer-events-none"
                            animate={config.animate}
                            transition={config.transition}
                        />
                    )}
                </motion.div>
            </div>
            <div className="flex items-center justify-between">
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="text-sm px-3 py-1 rounded-lg hover:text-white bg-white/10 hover:bg-white/15 transition-colors"
                    onClick={() => openMenu()}
                >
                    <span className="hidden md:block">Open Theme Settings</span>
                    <Settings className="w-5 h-5 md:hidden" />
                </motion.button>
            </div>
        </>
    )
}

export default ChangeFactor