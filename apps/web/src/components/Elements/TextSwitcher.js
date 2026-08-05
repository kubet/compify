import React, { useState } from 'react';
import { motion } from 'framer-motion';

const TextSwitcher = ({
    options,
    value,
    onChange,
    color = 'red'
}) => {
    const [hoveredIndex, setHoveredIndex] = useState(null);

    const colors = {
        blue: 'from-blue-500/30 to-indigo-500/60',
        green: 'from-green-500/30 to-emerald-500/30',
        red: 'from-red-500/30 to-pink-500/30',
        yellow: 'from-yellow-500/30 to-amber-500/30',
        orange: 'from-orange-500/30 to-amber-500/30',
        purple: 'from-purple-500/70 to-blue-500/70',
        pink: 'from-pink-500/70 to-purple-500/70',
    };

    const colorValues = {
        blue: '#3B82F6',
        green: '#22C55E',
        red: '#EF4444',
        yellow: '#EAB308',
        orange: '#F97316',
        purple: '#A855F7',
        pink: '#EC4899',
    };

    const bg = 'bg-gradient-to-r ' + (colors[color] || colors.blue);
    const borderColor = colorValues[color] || colorValues.orange;

    return (
        <div className="relative flex items-center p-1 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 gap-1">
            {options.map((option, index) => (
                <motion.button
                    key={option}
                    className={`relative px-6 py-2 rounded-full font-medium text-white`}
                    initial="rest"
                    whileHover="hover"
                    animate={value === option ? "selected" : "rest"}
                    onClick={() => onChange(option)}
                    onHoverStart={() => setHoveredIndex(index)}
                    onHoverEnd={() => setHoveredIndex(null)}
                >
                    {option === 'annually' && (
                        <span className="absolute -top-2 -right-2 text-xs bg-[#052e14] text-green-400 px-1.5 py-0.5 rounded-full font-medium z-20">
                            38% off
                        </span>
                    )}

                    {value === option && (
                        <motion.div
                            className={`absolute inset-0 rounded-full ${bg}`}
                            layoutId="background"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.4 }}
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                    )}

                    <motion.span
                        className="relative z-10 capitalize flex items-center gap-2"
                        variants={{
                            rest: { y: 0 },
                            hover: { y: -2 },
                            selected: { y: 0 }
                        }}
                    >
                        {option}
                    </motion.span>

                    {hoveredIndex === index && (
                        <motion.div
                            className="absolute inset-0 bg-white/5 rounded-full"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        />
                    )}
                </motion.button>
            ))}
        </div>
    );
};
TextSwitcher.displayName = 'TextSwitcher';
export default TextSwitcher;
