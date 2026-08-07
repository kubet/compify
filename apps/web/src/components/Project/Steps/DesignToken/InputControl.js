import { useState, useRef, useCallback } from "react";
import UtilityInput from '@/components/Elements/UtilityInput';
import ColorPicker from '@/components/Elements/ColorPicker';
import { hasKeysToBeReplaced, isValidColor } from "./utils";

export const constructColorValue = (value) => {
    if (typeof value !== 'string' || !value) return null;

    const trimmedValue = value.trim();
    if (!trimmedValue) return null;

    // HSL shell pattern (e.g., "10 20% 30%" or "10, 20%, 30%")
    const hslPattern = /^(-?\d+(?:\.\d+)?)\s*[,\s]\s*(-?\d+(?:\.\d+)?%?)\s*[,\s]\s*(-?\d+(?:\.\d+)?%?)$/;
    if (hslPattern.test(trimmedValue)) {
        const [h, s, l] = trimmedValue.split(/[,\s]+/).map(v => parseFloat(v));
        return `hsl(${h} ${s}% ${l}%)`;
    }

    // RGB shell pattern (e.g., "10, 20, 30")
    const rgbPattern = /^(\d+),\s*(\d+),\s*(\d+)$/;
    if (rgbPattern.test(trimmedValue)) {
        const [r, g, b] = trimmedValue.split(',').map(v => parseInt(v));
        return `rgb(${r}, ${g}, ${b})`;
    }

    return null;
};

function InputControl({ token, onChange, className, itemKey, isNumber = true, tokens = [], min = 0, max = 100, checkTokenNameExists }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuAnchorRef = useRef(null);

    const toggleMenu = useCallback(() => {
        setIsMenuOpen(!isMenuOpen);
    }, [isMenuOpen]);

    const renderStartElement = useCallback((key, compiledValue, value, min, max) => {
        const elementMap = {
            hue: (
                <div className="flex items-center space-x-2">
                    <div
                        className="relative w-6 h-6 rounded-md overflow-hidden cursor-pointer"
                        onClick={toggleMenu}
                        style={{ backgroundColor: `hsl(${value || 0}, 100%, 50%)` }}
                    >
                    </div>
                </div>
            ),
            lightness: (
                <div className="flex items-center space-x-2">
                    <div
                        className="relative w-6 h-6 rounded-md overflow-hidden cursor-pointer"
                        onClick={toggleMenu}
                        style={{ backgroundColor: `hsl(0, 0%, ${value || 0}%)` }}
                    >
                    </div>
                </div>
            ),
            saturation: (
                <div className="flex items-center space-x-2">
                    <div
                        className="relative w-6 h-6 rounded-md overflow-hidden cursor-pointer"
                        onClick={toggleMenu}
                        style={{ backgroundColor: `hsl(0, ${value || 0}%, 50%)` }}
                    >
                    </div>
                </div>
            ),
            slider: (
                <div className="flex items-center space-x-2">
                    <div
                        className="relative w-6 h-6 rounded-md overflow-hidden cursor-pointer"
                        onClick={toggleMenu}
                    >
                        <div
                            className="absolute inset-0 bg-gradient-to-r from-white to-gray-500"
                            style={{
                                clipPath: `inset(0 ${100 - ((compiledValue - min) / (max - min) * 100)}% 0 0)`
                            }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-500">
                            %
                        </div>
                    </div>
                </div>
            ),
            palette: (
                <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-md" style={{ backgroundColor: compiledValue }}></div>
                </div>
            ),
            colorPicker: (
                <div className="flex items-center space-x-2">
                    <div
                        className="relative w-6 h-6 rounded-md overflow-hidden cursor-pointer"
                        onClick={toggleMenu}
                        style={{ backgroundColor: value }}
                    >
                    </div>
                </div>
            ),
            propPalette: (color) => {
                return (
                    <div className="flex items-center space-x-2">
                        <div
                            className="relative w-6 h-6 rounded-md overflow-hidden cursor-pointer"
                            onClick={toggleMenu}
                            style={{ backgroundColor: color }}
                        >
                        </div>
                    </div>
                );
            }
        };

        if (elementMap[key]) {
            return elementMap[key];
        }
        if (isValidColor(compiledValue) && hasKeysToBeReplaced(tokens, value)) {
            return elementMap.palette;
        }
        if (isValidColor(value) && !hasKeysToBeReplaced(tokens, value)) {
            return elementMap.colorPicker;
        }
        if (isValidColor(`${compiledValue}`)) {
            return elementMap.palette;
        }
        const constructedColor = constructColorValue(value);
        if (constructedColor) {
            return elementMap.propPalette(constructedColor);
        }
        const constructedValue = constructColorValue(compiledValue);
        if (constructedValue) {
            return elementMap.propPalette(constructedValue);
        }
        const defaultElement = typeof compiledValue === 'string' && hasKeysToBeReplaced(tokens, value)
            ? <div className="text-gray-500">{compiledValue}</div>
            : null;
        return defaultElement;
    }, [toggleMenu, tokens]);


    const definedItemKey = () => {
        const itemKeyList = ['hue', 'lightness', 'saturation', 'slider'];
        return itemKeyList.includes(itemKey) ? itemKey : null;
    }

    return (
        <div className={`${className} relative`}>
            <UtilityInput
                value={token.value}
                onChange={(e) => {
                    let newValue = e.target.value;
                    if (min !== undefined && max !== undefined && isNumber) {
                        newValue = Math.max(min, Math.min(max, parseInt(newValue) || min));
                    }
                    onChange({ ...token, value: newValue.toString() });
                }}
                StartElement={renderStartElement(definedItemKey(), token.c, token.value, min, max)}
                ref={menuAnchorRef}
                isNumber={isNumber}
                checkTokenNameExists={checkTokenNameExists}
            />
            {isMenuOpen && (
                <div className="absolute left-0 right-0 mt-1">
                    <ColorPicker
                        type={definedItemKey()}
                        value={token.value}
                        onChange={(newValue) => onChange({ ...token, value: newValue })}
                        isOpen={isMenuOpen}
                        onClose={() => setIsMenuOpen(false)}
                        menuAnchorRef={menuAnchorRef}
                    />
                </div>
            )}
        </div>
    )
}

export default InputControl;