import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

const Chip = ({
    label,
    onRemove,
    icon: Icon,
    isSelected,
    onSelect,
    color = 'blue',
    size = 'medium',
    showX = true,
    tooltip,
}) => {
    const chipRef = useRef(null);
    const [isHovered, setIsHovered] = useState(false);
    const [isPressed, setIsPressed] = useState(false);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
    const [isMounted, setIsMounted] = useState(false);

    const scale = useMotionValue(1);
    const squeeze = useTransform(scale, [0.9, 1, 1.1], [1.2, 1, 0.8]);

    const containerVariants = {
        rest: { scale: 1 },
        hover: { scale: 1.05 },
        pressed: { scale: 0.95 },
    };

    const getBackgroundColor = () => {
        const colors = {
            blue: 'from-blue-500/30 to-indigo-500/30',
            green: 'from-green-500/30 to-emerald-500/30',
            red: 'from-red-500/30 to-pink-500/30',
            yellow: 'from-yellow-500/30 to-amber-500/30',
            purple: 'from-purple-500/30 to-violet-500/30',
        };
        return colors[color] || colors.blue;
    };

    const getSizeClasses = () => {
        const sizes = {
            small: 'h-6 text-xs',
            medium: 'h-8 text-sm',
            large: 'h-10 text-base',
        };
        return sizes[size] || sizes.medium;
    };

    const getBackdropFilterStyle = () => ({
        backdropFilter: isHovered ? 'none' : 'blur(20px)',
        WebkitBackdropFilter: isHovered ? 'none' : 'blur(20px)',
    });

    useEffect(() => {
        setIsMounted(true);
        return () => setIsMounted(false);
    }, []);

    return (
        <motion.div
            ref={chipRef}
            className={`group relative inline-flex items-center px-3 rounded-full cursor-pointer ${getSizeClasses()}`}
            style={{
                ...getBackdropFilterStyle(),
                background: isSelected ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                boxShadow: isSelected ? '0 0 0 2px rgba(255, 255, 255, 0.5)' : 'none',
            }}
            variants={containerVariants}
            initial="rest"
            animate={isPressed ? "pressed" : isHovered ? "hover" : "rest"}
            whileHover="hover"
            whileTap="pressed"
            onHoverStart={(e) => {
                e.stopPropagation();
                if (chipRef.current) {
                    const rect = chipRef.current.getBoundingClientRect();
                    setTooltipPosition({
                        x: rect.left + rect.width / 2,
                        y: rect.bottom + window.scrollY
                    });
                }
                setIsHovered(true);
            }}
            onHoverEnd={(e) => {
                e.stopPropagation();
                setIsHovered(false);
            }}
            onPointerDown={() => setIsPressed(true)}
            onPointerUp={() => setIsPressed(false)}
            onClick={onSelect}
        >
            <motion.div
                className={`absolute inset-0 bg-gradient-to-r ${getBackgroundColor()} rounded-full`}
                initial={{ opacity: 0 }}
                animate={{ opacity: isHovered || isSelected ? 0.3 : 0 }}
                transition={{ duration: 0.3 }}
            />

            <motion.div
                className="flex items-center"
                style={{ scale, scaleX: squeeze }}
            >
                {Icon && <Icon className={`text-white ${label ? 'mr-2' : ''}`} size={size === 'large' ? 18 : size === 'small' ? 12 : 14} />}
                <span className="text-white font-medium">{label}</span>
            </motion.div>

            <AnimatePresence>
                {isSelected && showX && (
                    <motion.button
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemove();
                        }}
                        className="ml-2 text-white opacity-60 hover:opacity-100 transition-opacity"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.2 }}
                    >
                        <X size={size === 'large' ? 18 : size === 'small' ? 12 : 14} />
                    </motion.button>
                )}
            </AnimatePresence>

            {tooltip && isHovered && isMounted && typeof window !== 'undefined' && createPortal(
                <div
                    className="fixed px-2 py-1 text-sm bg-black text-gray-100 rounded-lg whitespace-nowrap border border-[rgba(255,255,255,0.1)] shadow-lg pointer-events-none"
                    style={{
                        left: tooltipPosition.x,
                        top: tooltipPosition.y,
                        transform: 'translate(-50%, 8px)',
                        zIndex: 99999
                    }}
                >
                    {tooltip}
                </div>,
                document.body
            )}
        </motion.div>
    );
};

export default Chip;