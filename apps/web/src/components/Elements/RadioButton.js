import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';

const RadioButton = forwardRef(({
    id,
    name,
    value,
    checked,
    onChange,
    label,
    disabled = false,
    className = '',
    toggleable = false,
}, ref) => {
    const containerVariants = {
        rest: {
            background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
            boxShadow: '0 4px 24px -1px rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(255,255,255,0.18)',
        },
        hover: {
            background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.07) 100%)',
            boxShadow: '0 8px 32px -1px rgba(0, 0, 0, 0.2), 0 0 0 2px rgba(255,255,255,0.3)',
            border: '1px solid rgba(255,255,255,0.3)',
        }
    };

    const handleChange = (e) => {
        if (toggleable) {
            onChange(e);
        } else {
            onChange({ ...e, target: { ...e.target, checked: true } });
        }
    };

    return (
        <label
            className={`inline-flex items-center cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
        >
            <div className="relative flex items-center justify-center">
                <motion.input
                    ref={ref}
                    type={toggleable ? "checkbox" : "radio"}
                    id={id}
                    name={name}
                    value={value}
                    checked={checked}
                    onChange={handleChange}
                    disabled={disabled}
                    className={`
                        appearance-none cursor-pointer
                        w-5 h-5
                        rounded-lg
                        transition-all duration-0 ease-in-out
                        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-opacity-50
                    `}
                    variants={containerVariants}
                    initial="rest"
                    whileHover={!disabled && "hover"}
                />
                <motion.div
                    className={`
                        absolute pointer-events-none
                        rounded-[4px]
                        ${checked ? 'w-[10px] h-[10px]' : 'w-0 h-0'}
                        transition-all duration-200 ease-in-out
                    `}
                    style={{
                        backgroundColor: checked ? '#8b5cf6' : 'transparent',
                        boxShadow: checked ? '0 0 10px #8b5cf6, 0 0 20px #8b5cf6' : 'none',
                        opacity: checked ? 1 : 0,
                    }}
                    animate={{
                        scale: checked ? [1, 1.1, 1] : 1,
                    }}
                    transition={{
                        duration: 0.3,
                        ease: "easeInOut",
                    }}
                />
            </div>
            {label && (
                <span className={`ml-2 text-gray-300`}>
                    {label}
                </span>
            )}
        </label>
    );
});

RadioButton.displayName = 'RadioButton';

export default RadioButton;
