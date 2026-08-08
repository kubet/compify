import React, { useState, useRef, useEffect, forwardRef } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';

const InputField = forwardRef(({ value,
    onChange,
    placeholder,
    onSubmit,
    showButton,
    buttonAnimation,
    Icon = null,
    RightIcon = null,
    type = "text",
    StartElement = null,
    isNumber = false,
    blurBackground = false,
    disableEnter = false,
    iconClassName = 'text-gray-400',
    autoComplete = "off",
    ariaLabel }, ref) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const containerRef = useRef(null);
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const rotateX = useTransform(mouseY, [-10, 10], [5, -5]);
    const rotateY = useTransform(mouseX, [-10, 10], [-5, 5]);

    useEffect(() => {
        const container = containerRef.current;
        const handleMouseMove = (e) => {
            const rect = container?.getBoundingClientRect();
            if (rect) {
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                mouseX.set(x - rect.width / 2);
                mouseY.set(y - rect.height / 2);
            }
        };

        container?.addEventListener('mousemove', handleMouseMove);
        return () => {
            container?.removeEventListener('mousemove', handleMouseMove);
        };
    }, [mouseX, mouseY]);

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
        },
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !disableEnter && onSubmit) {
            onSubmit();
        }
    };

    const [isDragging, setIsDragging] = useState(false);
    const startY = useRef(0);
    const startValue = useRef(0);

    useEffect(() => {
        if (isNumber) {
            const handleMouseMove = (e) => {
                if (isDragging) {
                    const diff = startY.current - e.clientY;
                    const newValue = Math.round(startValue.current + diff / 2);
                    onChange({ target: { value: newValue.toString() } });
                }
            };

            const handleMouseUp = () => {
                setIsDragging(false);
            };

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);

            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, isNumber, onChange]);

    const handleMouseDown = (e) => {
        if (isNumber) {
            if (e.button === 0 && e.type === 'mousedown') {
                setIsDragging(true);
                startY.current = e.clientY;
                startValue.current = parseInt(value) || 0;
            }
        }
    };

    return (
        <motion.div
            ref={containerRef}
            className="relative w-full h-12 rounded-xl overflow-hidden flex items-center"
            style={{
                backdropFilter: blurBackground ? 'blur(20px)' : 'none',
                WebkitBackdropFilter: blurBackground ? 'blur(20px)' : 'none',
            }}
            variants={containerVariants}
            initial="rest"
            animate={isHovered || isFocused ? "hover" : "rest"}
            whileHover="hover"
            whileTap={{ scale: 0.97, rotateX: 0, rotateY: 0 }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
        >
            <div className="flex items-center h-full pl-2 absolute left-0">
                {StartElement && (
                    <div className="h-full flex items-center mr-2">
                        {StartElement}
                    </div>
                )}
                {Icon && (
                    <div className="h-full flex items-center mr-2">
                        <Icon className={iconClassName} size={16} aria-hidden="true" />
                    </div>
                )}
            </div>
            <input
                ref={ref}
                type={type}
                value={value}
                onChange={onChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onKeyDown={handleKeyDown}
                onMouseDown={handleMouseDown}
                placeholder={placeholder}
                autoComplete={autoComplete}
                name={type}
                aria-label={ariaLabel || placeholder}
                className={`flex-grow h-full bg-transparent text-white font-medium focus:outline-none z-10 px-2 ${isNumber ? 'cursor-ns-resize' : ''}`}
                style={{
                    paddingLeft: StartElement || Icon ? '2.5rem' : '0.75rem',
                    ...isNumber ? { WebkitAppearance: 'none', MozAppearance: 'textfield' } : {}
                }}
            />
            {showButton && (
                <motion.button
                    type="button"
                    onClick={onSubmit}
                    aria-label={ariaLabel ? `${ariaLabel} action` : `${placeholder || "Input"} action`}
                    className="flex items-center justify-center w-8 h-8 bg-[#18181b] rounded-xl z-20 mr-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                >
                    <motion.svg
                        className="w-4 h-4 text-white"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        animate={buttonAnimation}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                        {RightIcon && <RightIcon />}
                    </motion.svg>
                </motion.button>
            )}
            <motion.div
                className="absolute inset-0 bg-gradient-to-r from-purple-500/30 to-blue-500/30 -z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: isHovered || isFocused ? 0.2 : 0 }}
                transition={{ duration: 0.3 }}
            />
        </motion.div>
    );
});

export default InputField;
InputField.displayName = 'InputField';
