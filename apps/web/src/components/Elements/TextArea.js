import React, { useState, useRef, useEffect, forwardRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';

const TextArea = forwardRef(({ value,
    onChange,
    placeholder,
    showButton,
    buttonAnimation,
    Icon = null,
    RightIcon = null,
    type = "text",
    StartElement = null,
    rows = 1,
    bottomElement = null,
    onSubmit = null,
    autoComplete = "off",
    enableAnimation = true,
    blurBackground = false,
    onPaste = null }, ref) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const containerRef = useRef(null);
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

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
    return (
        <motion.div
            ref={containerRef}
            className={`relative w-full rounded-xl ${blurBackground ? 'overflow-visible' : 'overflow-hidden'} flex flex-col`}
            style={{
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                minHeight: '3rem',
            }}
            variants={containerVariants}
            initial="rest"
            animate={isHovered || isFocused ? "hover" : "rest"}
            whileHover="hover"
            whileTap={enableAnimation ? { scale: 0.97, rotateX: 0, rotateY: 0 } : {}}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
        >
            <div className="flex items-center w-full">
                <div className="flex items-center h-full pl-2">
                    {StartElement && (
                        <div className="h-full flex items-center ">
                            {StartElement}
                        </div>
                    )}
                    {Icon && (
                        <div className="h-full flex items-center">
                            <Icon className="text-gray-400" size={16} />
                        </div>
                    )}
                </div>
                <textarea
                    ref={ref}
                    value={value}
                    onChange={onChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    onPaste={onPaste}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    rows={rows}
                    className="flex-grow w-full bg-transparent text-white font-medium focus:outline-none z-10 px-2 pt-3 resize-none text-sm"
                    style={{
                        minHeight: '3rem',
                        lineHeight: '1.5',
                        maxHeight: rows >= 6 ? '144px' : 'none',
                        overflowY: rows >= 6 ? 'auto' : 'hidden'
                    }}
                />
                {showButton && (
                    <motion.button
                        onClick={onSubmit}
                        className="flex items-center justify-center min-w-8 min-h-8 w-8 h-8 bg-[#18181b] rounded-xl z-20 mr-2"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.2 }}
                    >
                        {RightIcon && <RightIcon size={14} />}
                    </motion.button>
                )}
            </div>

            {bottomElement && (
                <div className="w-full">
                    {bottomElement}
                </div>
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

export default TextArea;
TextArea.displayName = 'TextArea';
