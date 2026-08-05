import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const Slider = ({
    max = 360,
    step = 1,
    defaultValue = 0,
    backgroundColor = 'black',
    onValueChange,
    label,
    gradientBg = 'linear-gradient(to right, red, yellow, lime, cyan, blue, magenta, red)'
}) => {
    const [value, setValue] = useState(defaultValue);
    const [isDragging, setIsDragging] = useState(false);
    const [sliderWidth, setSliderWidth] = useState('20rem');

    const handleChange = (e) => {
        const newValue = parseInt(e.target.value, 10);
        if (value !== newValue) {
            setValue(newValue);
            onValueChange?.(newValue);
        }
    };

    // Add mouse event handlers
    const handleMouseDown = () => setIsDragging(true);
    const handleMouseUp = () => setIsDragging(false);

    // Calculate the position of the thumb
    const thumbPosition = (value / max) * 100;

    // Add useEffect to handle window resize
    useEffect(() => {
        const updateWidth = () => {
            // For mobile devices (less than 768px)
            if (window.innerWidth < 768) {
                setSliderWidth('14rem'); // or calculate dynamically: `${window.innerWidth * 0.8}px`
            } else {
                setSliderWidth('20rem');
            }
        };

        // Initial call
        updateWidth();

        // Add event listener
        window.addEventListener('resize', updateWidth);
        return () => window.removeEventListener('resize', updateWidth);
    }, []);

    return (
        <div className="relative h-4" style={{ width: sliderWidth }}>
            {label && <label htmlFor="slider" className="text-white/30 text-xs absolute -top-5 left-0">{label}</label>}
            <motion.div
                className="absolute w-full top-1/2 left-0 right-0 rounded-full transform -translate-y-1/2"
                animate={{
                    height: isDragging ? '16px' : '4px'
                }}
                transition={{ duration: 0.2 }}
                style={{
                    backgroundImage: gradientBg,
                }}
            />
            <input
                type="range"
                max={max}
                name="slider"
                id="slider"
                step={step}
                value={value}
                onChange={handleChange}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className="absolute w-full inset-0 h-full opacity-0 cursor-pointer"
            />
            <motion.div
                className="absolute top-1/2 w-4 h-4 bg-white rounded-full shadow-md pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
                animate={{
                    boxShadow: `0 0 0 8px ${backgroundColor}`,
                }}
                style={{
                    left: `${thumbPosition}%`,
                }}
            />
        </div>
    );
};

export default Slider;