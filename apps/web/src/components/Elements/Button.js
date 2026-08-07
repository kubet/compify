'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useAnimation, useMotionValue, useTransform } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const Button = ({ text = "",
    textSm = "",
    onClick,
    variant = 'full',
    size = 'medium',
    showIcon = true,
    fullWidth = false,
    Icon = ArrowRight,
    color = '',
    blurBackground = false,
    disabled = false
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const buttonRef = useRef(null);
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const controls = useAnimation();


    useEffect(() => {
        const button = buttonRef.current;
        const handleMouseMove = (e) => {
            const rect = button.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            mouseX.set(x - rect.width / 2);
            mouseY.set(y - rect.height / 2);
        };

        button.addEventListener('mousemove', handleMouseMove);
        return () => {
            button?.removeEventListener('mousemove', handleMouseMove);
        };
    }, [mouseX, mouseY]);

    const buttonVariants = {
        full: {
            rest: {
                // background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                boxShadow: '0 4px 24px -1px rgba(0, 0, 0, 0.2)',
                border: '1px solid rgba(255,255,255,0.18)',
            },
            hover: {
                // background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.07) 100%)',
                boxShadow: '0 8px 32px -1px rgba(0, 0, 0, 0.2), 0 0 0 2px rgba(255,255,255,0.3)',
                border: '1px solid rgba(255,255,255,0.3)',
            },
        },
        outline: {
            rest: {
                textDecoration: 'underline',
                backgroundColor: 'rgba(255,255,255,0)',
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.1)',
            },
            hover: {
                textDecoration: 'underline',
                backgroundColor: 'rgba(255,255,255,0.05)',
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.4), 0 4px 24px -1px rgba(0, 0, 0, 0.2)',
                border: '1px solid rgba(255,255,255,0.2)',
            },
        },
    };

    const textVariants = {
        rest: { y: 0, x: 0 },
        hover: { y: -2, x: 2, transition: { type: "spring", stiffness: 300, damping: 10 } },
    };

    const iconVariants = {
        rest: { x: 0, opacity: 0.7, rotate: 0 },
        hover: { x: 5, opacity: 1, rotate: 360, transition: { duration: 0.5 } },
    };

    const getWidth = () => {
        return fullWidth ? '100%' : 'fit-content';
    }

    const sizeVariants = {
        small: { width: getWidth(), height: '2.5rem', fontSize: '0.875rem' },
        medium: { width: getWidth(), height: '3rem', fontSize: '1rem' },
        large: { width: getWidth(), height: '4rem', fontSize: '1.125rem' },
    };
    const colors = {
        blue: 'from-blue-500/30 to-indigo-500/30',
        green: 'from-green-500/30 to-emerald-500/30',
        red: 'from-red-500/30 to-pink-500/30',
        yellow: 'from-yellow-500/30 to-amber-500/30',
        purple: 'from-purple-500/30 to-blue-500/30',
    };
    const bg = 'bg-gradient-to-r ' + (colors[color] || colors.blue);
    const generateParticles = () => {
        return Array.from({ length: 15 }).map((_, i) => (
            <motion.div
                key={i}
                className="absolute w-0.5 h-0.5 bg-white rounded-full"
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1.5, 0],
                    x: [0, (Math.random() - 0.5) * 100],
                    y: [0, (Math.random() - 0.5) * 100],
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "loop",
                    ease: "easeInOut",
                    delay: Math.random() * 2,
                }}
            />
        ));
    };

    return (
        <motion.button
            ref={buttonRef}
            className={`relative flex items-center justify-center px-6 py-3 rounded-xl font-medium text-white overflow-hidden ${disabled ? 'opacity-50 cursor-not-allowed' : ''
                }`}
            style={{
                ...sizeVariants[size],
                backdropFilter: blurBackground ? 'blur(20px)' : 'none',
                WebkitBackdropFilter: blurBackground ? 'blur(20px)' : 'none',
            }}
            variants={buttonVariants[variant]}
            initial="rest"
            animate={isHovered && !disabled ? "hover" : "rest"}
            whileHover={disabled ? {} : "hover"}
            whileTap={disabled ? {} : { scale: 0.97, rotateX: 0, rotateY: 0 }}
            onClick={disabled ? undefined : onClick}
            onHoverStart={() => !disabled && setIsHovered(true)}
            onHoverEnd={() => !disabled && setIsHovered(false)}
            disabled={disabled}
        >
            <motion.div
                className={`absolute inset-0 ${bg}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: isHovered ? 0.3 : 0.1 }}
                transition={{ duration: 0.3 }}
            />
            <motion.div
                className="relative flex items-center justify-center w-full h-full"
            >
                <motion.span variants={textVariants} className="text-center">
                    <span className="hidden sm:inline">{text}</span>
                    <span className="sm:hidden">{textSm || text}</span>
                </motion.span>
                {showIcon && (
                    <motion.svg
                        className={`w-5 h-5 flex-shrink-0 ${(textSm || text) ? 'ml-2' : ''}`}
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        variants={iconVariants}
                    >
                        <Icon />
                    </motion.svg>
                )}
            </motion.div>
            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        className="absolute inset-0 flex items-center justify-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {generateParticles()}
                    </motion.div>
                )}
            </AnimatePresence>
            <motion.div
                className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                    opacity: isHovered ? [0, 0.2, 0] : 0,
                    scale: isHovered ? [0.8, 1.05, 0.95] : 0.8,
                }}
                transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.div
                className="absolute inset-0 bg-white/5"
                style={{
                    transformStyle: 'preserve-3d',
                }}
            />
        </motion.button>
    );
};

export default Button;