import { useState, useRef, useCallback, useEffect } from "react";
import Color from 'color';
import Slider from "./Slider";
import Menu from "./Menu";

function ColorPickerConent({ type, value, onChange }) {
    const initialColor = (() => {
        try {
            return Color(value);
        } catch (e) {
            return Color('#ffffff');
        }
    })();

    const colorValue = type ? Color('#ffffff') : initialColor;
    const [color, setColor] = useState(colorValue);

    const pickerRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);

    const detectFormat = useCallback((colorStr) => {
        if (type) return;
        const trimmed = colorStr?.trim();
        if (!trimmed) return 'hex';

        if (/^(-?\d+(?:\.\d+)?)\s*[,\s]\s*(-?\d+(?:\.\d+)?%?)\s*[,\s]\s*(-?\d+(?:\.\d+)?%?)$/.test(trimmed)) {
            return 'hsl-shell';
        }
        if (/^(\d+),\s*(\d+),\s*(\d+)$/.test(trimmed)) {
            return 'rgb-shell';
        }
        if (trimmed?.startsWith('hsl')) return 'hsl';
        if (trimmed?.startsWith('rgb')) return 'rgb';
        return 'hex';
    }, [type]);

    const [colorFormat, setColorFormat] = useState(detectFormat(value));

    const updateColor = useCallback((newColor, updateType) => {
        if (type && value !== undefined) {
            onChange(newColor);
            return;
        }

        let outputColor;
        switch (updateType) {
            case 'hue':
                outputColor = Color({ h: newColor, s: color.saturationv(), v: color.value() });
                break;
            case 'saturation':
                outputColor = Color({ h: color.hue(), s: newColor, v: color.value() });
                break;
            case 'lightness':
                outputColor = Color({ h: color.hue(), s: color.saturationv(), v: newColor });
                break;
            default:
                outputColor = newColor;
        }

        setColor(outputColor);

        let formattedColor;
        switch (colorFormat) {
            case 'hsl-shell':
                formattedColor = `${Math.round(outputColor.hue())} ${Math.round(outputColor.saturationl())}% ${Math.round(outputColor.lightness())}%`;
                break;
            case 'rgb-shell':
                const rgb = outputColor.rgb().array();
                formattedColor = `${Math.round(rgb[0])}, ${Math.round(rgb[1])}, ${Math.round(rgb[2])}`;
                break;
            case 'hsl':
                formattedColor = outputColor.hsl().string();
                break;
            case 'rgb':
                formattedColor = outputColor.rgb().string();
                break;
            default:
                formattedColor = outputColor.hex();
        }

        onChange(formattedColor);
    }, [type, value, colorFormat, onChange, color]);


    const updateColorFromPosition = useCallback((x, y) => {
        if (!pickerRef.current) return;

        const rect = pickerRef.current.getBoundingClientRect();
        const saturation = Math.max(0, Math.min(100, (x / rect.width) * 100));
        const brightness = Math.max(0, Math.min(100, 100 - (y / rect.height) * 100));

        updateColor(Color({
            h: color.hue(),
            s: saturation,
            v: brightness
        }));
    }, [color, updateColor]);

    const handleMouseDown = (e) => {
        setIsDragging(true);
        updateColorFromPosition(
            e.clientX - pickerRef.current.getBoundingClientRect().left,
            e.clientY - pickerRef.current.getBoundingClientRect().top
        );
    };

    const handleMouseMove = useCallback((e) => {
        if (!isDragging) return;
        updateColorFromPosition(
            e.clientX - pickerRef.current.getBoundingClientRect().left,
            e.clientY - pickerRef.current.getBoundingClientRect().top
        );
    }, [isDragging, updateColorFromPosition]);

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, handleMouseMove]);

    const getSliderValue = (vtype) => {
        if (type && value !== undefined) return value;
        if (vtype === 'hue') return color.hue();
        if (vtype === 'lightness') return color.lightness();
        if (vtype === 'saturation') return color.saturationv();
        return 0;
    }
    const sliderMap = {
        hue: <Slider
            defaultValue={getSliderValue('hue')}
            onValueChange={(value) => updateColor(value, 'hue')}
            min={0}
            max={360}
            step={1}
            backgroundColor="#121212"
            gradientBg={`linear-gradient(to right, 
            hsl(0, 100%, 50%),
            hsl(60, 100%, 50%),
            hsl(120, 100%, 50%),
            hsl(180, 100%, 50%),
            hsl(240, 100%, 50%),
            hsl(300, 100%, 50%),
            hsl(360, 100%, 50%)
        )`}
        />,
        lightness: <Slider
            defaultValue={getSliderValue('lightness')}
            onValueChange={(value) => updateColor(value, 'lightness')}
            min={0}
            max={100}
            step={1}
            backgroundColor="#121212"
            gradientBg="linear-gradient(to right, black, white)"
        />,
        saturation: <Slider
            defaultValue={getSliderValue('saturation')}
            onValueChange={(value) => updateColor(value, 'saturation')}
            min={0}
            max={100}
            step={1}
            backgroundColor="#121212"
            gradientBg="linear-gradient(to right, gray, red)"
        />,
        slider: <Slider
            defaultValue={getSliderValue('slider')}
            onValueChange={(value) => updateColor(value)}
            min={0}
            max={100}
            step={1}
            gradientBg="linear-gradient(to right, white, gray)"
            backgroundColor="#121212"
        />
    }


    if (type) {
        return sliderMap[type]
    }


    return (
        <div className=" p-4 space-y-4">
            {/* Main color picker area */}
            <div
                ref={pickerRef}
                className="relative w-full h-[200px] rounded-xl cursor-crosshair"
                style={{
                    backgroundColor: `hsl(${color.hue()}, 100%, 50%)`,
                    backgroundImage: `
                        linear-gradient(to right, #fff 0%, transparent 100%),
                        linear-gradient(to bottom, transparent 0%, #000 100%)
                    `
                }}
                onMouseDown={handleMouseDown}
            >
                {/* Color picker indicator */}
                <div
                    className="absolute w-4 h-4 -translate-x-2 -translate-y-2 border-2 border-white rounded-full shadow-lg"
                    style={{
                        left: `${color.saturationv()}%`,
                        top: `${100 - color.value()}%`,
                        backgroundColor: color.hex()
                    }}
                />
            </div>
            {color && sliderMap['hue']}
            {/* Color preview and hex value */}
            <div className="flex items-center gap-3">
                <div
                    className="w-10 h-10 rounded-lg shadow-inner"
                    style={{
                        backgroundColor: color.hex(),
                        border: '2px solid rgba(255,255,255,0.1)'
                    }}
                />
                <div className="text-sm font-mono px-2 py-1 rounded-md bg-white/10 border border-white/20 flex items-center justify-center">
                    {(() => {
                        switch (colorFormat) {
                            case 'hsl-shell':
                                return `${Math.round(color.hue())} ${Math.round(color.saturationl())}% ${Math.round(color.lightness())}%`;
                            case 'rgb-shell':
                                const rgb = color.rgb().array();
                                return `${Math.round(rgb[0])}, ${Math.round(rgb[1])}, ${Math.round(rgb[2])}`;
                            case 'hsl':
                            case 'rgb':
                                return color[colorFormat]().string();
                            default:
                                return color.hex();
                        }
                    })()}
                </div>
            </div>
        </div>
    );
}

export default function ColorPicker({ type, value, onChange, isOpen, onClose, menuAnchorRef }) {
    return <Menu
        isOpen={isOpen}
        onClose={onClose}
        anchorEl={menuAnchorRef}
        className={`z-50 ${type ? 'p-4' : 'p-1'} w-fit`}
    >
        <ColorPickerConent type={type} value={value} onChange={onChange} />
    </Menu>
}