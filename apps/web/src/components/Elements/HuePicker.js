import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Slider from './Slider';
const HuePicker = () => {
    const [hue, setHue] = useState(0);

    const handleHueChange = (value) => {
        setHue(value[0]);
    };

    return (
        <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Hue Picker</h2>
            <motion.div
                className="w-full h-4 rounded-full mb-6"
                style={{ backgroundColor: `hsl(${hue}, 100%, 50%)` }}
                animate={{ backgroundColor: `hsl(${hue}, 100%, 50%)` }}
                transition={{ duration: 0.3 }}
            />
            <Slider
                defaultValue={[hue]}
                max={360}
                step={1}
                onValueChange={handleHueChange}
                className="w-full"
            />
            <motion.p
                className="mt-4 text-sm font-medium text-gray-700"
                animate={{ color: `hsl(${hue}, 100%, 30%)` }}
                transition={{ duration: 0.3 }}
            >
                Hue: {hue}°
            </motion.p>
        </div>
    );
};

export default HuePicker;
