import React, { useState } from 'react';
import { motion } from 'framer-motion';

const Switch = ({ color = "hsla(20, 100%, 50%, 1)" }) => {
    const [isOn, setIsOn] = useState(false);

    const toggleSwitch = () => setIsOn(!isOn);

    const colorHSL = color.match(/\d+/g).map(Number);
    const onColor = `hsl(${colorHSL[0]}, ${colorHSL[1] * 1.4}%, ${colorHSL[2] * 1.1}%)`;
    const offColor = `hsl(${colorHSL[0]}, ${colorHSL[1] * 1.4}%, ${colorHSL[2] * 1.3}%)`;
    const circleColor = `hsl(${colorHSL[0]}, ${colorHSL[1] * 0.7}%, ${colorHSL[2] * 1.3}%)`;
    return (
        <div className="flex items-center justify-center">
            <motion.div
                className="w-14 h-8 flex items-center rounded-full p-1 cursor-pointer"
                style={{ backgroundColor: isOn ? onColor : offColor }}
                onClick={toggleSwitch}
            >
                <motion.div
                    className="w-6 h-6 rounded-full shadow-md"
                    style={{ backgroundColor: isOn ? circleColor : 'white' }}
                    layout
                    animate={{
                        x: isOn ? 24 : 0
                    }}
                    transition={{
                        type: "easeInOut",
                        duration: 0.12
                    }}
                />
            </motion.div>
        </div>
    );
};

export default Switch;
