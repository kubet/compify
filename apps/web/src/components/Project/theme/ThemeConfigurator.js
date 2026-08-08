import { Chip, Slider } from '@/components/Elements';
import UtilityInput from '@/components/Elements/UtilityInput'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import { isValidColor, isValidColorValue } from '../Steps/DesignToken/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { constructColorValue } from '../Steps/DesignToken/InputControl';
import Menu from '@/components/Elements/Menu';
import useDebounce from '@/utils/debounce';
const ColorSwatch = ({ color, isSelected, size = '8', onClick }) => {
    const colorValue = constructColorValue(color);
    if (colorValue) {
        color = colorValue;
    }

    return (
        <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={{ opacity: 1 }}
            initial={{ opacity: 0 }}
            className={`
          relative w-${size} h-${size} rounded-md overflow-hidden 
          cursor-pointer shadow-lg backdrop-blur-sm
          ${isSelected ? 'ring-2 ring-white/90 ring-opacity-80' : ''}
        `}
            onClick={onClick}
        >
            <motion.div
                className="absolute inset-0"
                style={{ backgroundColor: color }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
            />
        </motion.div>
    );
};
const ChipGroup = ({ label, value, onChange, findGroupByKey }) => {
    const menuAnchorRef = useRef(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);



    const handleClose = () => {
        setIsMenuOpen(false);
    };

    const handleOptionSelect = (optionLabel) => {
        onChange(optionLabel);
        handleClose();
    };

    const getFilteredOptions = () => {
        const options = findGroupByKey(value.value) || [];
        const colorOptions = [];
        const chipOptions = [];

        options.forEach(option => {
            if (isValidColorValue(option.c)) {
                colorOptions.push(option);
            } else {
                chipOptions.push(option);
            }
        });

        return { colorOptions, chipOptions };
    };

    const { colorOptions, chipOptions } = getFilteredOptions();
    const hasOptions = colorOptions.length > 0 || chipOptions.length > 0;

    const handleClick = (event) => {
        if (!hasOptions) return;
        event.stopPropagation();
        setIsMenuOpen(true);
    };
    return (
        <div className="relative space-y-2 items-start w-fit" ref={menuAnchorRef}>
            <div
                className={`flex items-center gap-2 p-1.5 cursor-pointer hover:bg-white/5 justify-start rounded-md 
                          transition-all duration-200 ease-in-out group w-fit ${hasOptions ? '' : 'pointer-events-none'}`}
                onClick={handleClick}
            >
                <span className="text-sm font-medium text-gray-300 group-hover:text-white">{label}: </span>
                <span className={`text-sm font-medium ${isValidColorValue(value.c) ? 'text-gray-500' : 'text-gray-300'} flex items-center gap-2 group-hover:text-gray-300`}>
                    {isValidColorValue(value.c) && (
                        <ColorSwatch size="6" color={value.c} />
                    )}
                    <span>{value.c}</span>
                </span>
                {hasOptions && (
                    <motion.svg
                        className="w-4 h-4 text-gray-400 group-hover:text-white"
                        animate={{ rotate: isMenuOpen ? 180 : 0 }}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </motion.svg>
                )}
            </div>

            <Menu
                isOpen={isMenuOpen}
                onClose={handleClose}
                anchorEl={menuAnchorRef}
                offset={{ x: 0, y: 8 }}
                className="p-3 z-50"
            >
                <motion.div
                    className="flex flex-col gap-4 w-[max-content]"
                    layout
                >
                    {colorOptions.length > 0 && (
                        <div className="space-y-2">
                            <span className="text-xs font-medium text-gray-400">Colors</span>
                            <div className="grid grid-cols-6 gap-2">
                                {isMenuOpen && colorOptions.map((option, i) => (
                                    <motion.div
                                        key={option.label}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: i * 0.01 }}
                                        className="relative group"
                                    >
                                        <div className="relative cursor-pointer">
                                            <ColorSwatch
                                                color={option.c}
                                                isSelected={value.value === option.label}
                                                onClick={() => handleOptionSelect(option.label)}
                                            />
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}

                    {chipOptions.length > 0 && (
                        <div className="space-y-2">
                            <span className="text-xs font-medium text-gray-400">Options</span>
                            <div className="flex flex-col gap-2">
                                {isMenuOpen && chipOptions.map((option, i) => (
                                    <motion.div
                                        key={option.label}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: i * 0.03 }}
                                    >
                                        <Chip
                                            label={option?.label?.split('--')[1]}
                                            isSelected={value.value === option.label}
                                            onSelect={() => handleOptionSelect(option.label)}
                                            color="blue"
                                            size="small"
                                            showX={false}
                                            className="hover:scale-105 transition-transform duration-200"
                                        />
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}
                </motion.div>
            </Menu>
        </div>
    );
};
const ThemeConfigurator = ({ factors, values, updateFactor, replaceValue, groups }) => {
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

    const debouncedUpdateFactor = useDebounce(updateFactor, 16);

    const getAllTokens = useMemo(() => {
        const factorTokens = factors.map(factor => ({ key: factor.key, value: factor.value, c: factor.c }));
        const groupTokens = Object.entries(groups).flatMap(([groupKey, group]) =>
            group.options.map(item => ({ key: `${groupKey}-${item.key}`, value: item.value, c: item.c }))
        );
        return [...factorTokens, ...groupTokens, ...values];
    }, [factors, groups, values]);

    const resolveMetaToken = useCallback((key, depth = 0, tokens) => {
        if (!key?.includes('${')) {
            return null;
        }

        if (depth > 10) {
            console.warn('Maximum meta-token resolution depth reached');
            return key;
        }

        return key.replace(/\${([^}]+)}(-\d+)?/g, (match, metaKey, suffix = '') => {
            const cleanMetaKey = metaKey.startsWith('--') ? metaKey.slice(2) : metaKey;
            const metaToken = tokens.find(t => t.key === cleanMetaKey);
            if (!metaToken) return match;

            let value = metaToken.value;
            if (typeof value === 'string' && value.includes('${')) {
                // First resolve nested meta tokens
                value = resolveMetaToken(value, depth + 1, tokens);
            }

            // Then resolve any token references
            if (typeof value === 'string' && value.includes('--')) {
                value = value.replace(/--(\w+(?:-\w+)*)(-\d+)?/g, (match, tokenKey, tokenSuffix = '') => {
                    const token = tokens.find(t => t.key === tokenKey);
                    if (!token && tokenSuffix) {
                        // Try without suffix
                        const baseToken = tokens.find(t => t.key === tokenKey);
                        if (baseToken) return baseToken.value;
                    }
                    return token ? token.value : match;
                });
            }

            return `${value}${suffix}`;
        });
    }, []);

    const handleSliderChange = useCallback((index, value) => {
        debouncedUpdateFactor(index, value);
    }, [debouncedUpdateFactor]);

    const findGroupByKey = useMemo(() => (key) => {
        const resolvedKey = resolveMetaToken(key, 0, getAllTokens) || key;
        const keyStr = String(resolvedKey || '');

        if (!keyStr.startsWith('--')) return null;

        const tokenPath = keyStr.slice(2);

        const parts = tokenPath.split('-');
        let groupKey = null;

        for (let i = 1; i <= parts.length; i++) {
            const possibleGroup = parts.slice(0, i).join('-');
            if (groups[possibleGroup]) {
                groupKey = possibleGroup;
                break;
            }
        }

        return groupKey ? groups[groupKey]?.options.map(item => ({
            label: `--${groupKey}-${item.key}`,
            value: item.value,
            c: item.c
        })) : null;
    }, [resolveMetaToken, getAllTokens, groups]);

    return (
        <motion.div
            className="space-y-4 rounded-lg backdrop-blur-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            {factors.map((factor, index) => (
                <motion.div
                    className="space-y-4 w-[20rem]"
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                >
                    <motion.h5
                        className="text-sm font-semibold capitalize text-gray-300"
                        layout
                    >
                        {factor.key}
                    </motion.h5>

                    {sliderConfigs[factor.key] ? (
                        <motion.div
                            className="relative"
                        // whileHover={{ scale: 1.02 }}
                        >
                            <Slider
                                max={factor?.max ?? 100}
                                min={factor?.min ?? 0}
                                defaultValue={factor.value}
                                onValueChange={(value) => handleSliderChange(index, value)}
                                gradientBg={sliderConfigs[factor.key].background}
                                backgroundColor="#0a0a0a"
                            />
                            <motion.div
                                className="absolute inset-0 pointer-events-none"
                                animate={sliderConfigs[factor.key].animate}
                                transition={sliderConfigs[factor.key].transition}
                            />
                        </motion.div>
                    ) : (
                        <motion.div whileHover={{ scale: 1.02 }}>
                            <UtilityInput
                                value={factor.value}
                                onChange={(e) => handleSliderChange(index, e.target.value)}
                                isNumber={true}
                            />
                        </motion.div>
                    )}
                </motion.div>
            ))}

            {values.map((value, index) => (
                <ChipGroup
                    key={index}
                    label={value.key}
                    value={value}
                    onChange={(v) => replaceValue(value.value, v, value.key)}
                    findGroupByKey={findGroupByKey}
                />
            ))}
        </motion.div>
    );
};

export default ThemeConfigurator;