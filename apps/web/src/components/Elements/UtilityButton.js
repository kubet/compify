import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ParticleEmitter = ({ x, y, onComplete }) => {
    const particleCount = 4 + Math.floor(Math.random() * 4);
    const particles = Array.from({ length: particleCount });
    const radius = 30;

    return particles.map((_, i) => {
        const angle = (Math.random() * Math.PI * 2);
        const particleRadius = radius * (0.6 + Math.random() * 0.4);
        const opacity = 0.3 + Math.random() * 0.3;
        const particleColor = `rgba(138, 138, 138, ${opacity})`;

        return (
            <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full"
                style={{
                    backgroundColor: particleColor,
                    boxShadow: `0 0 3px ${particleColor}`
                }}
                initial={{ x, y, scale: 1, opacity: 1 }}
                animate={{
                    x: x + Math.cos(angle) * particleRadius,
                    y: y + Math.sin(angle) * particleRadius,
                    scale: 0,
                    opacity: 0,
                }}
                transition={{
                    duration: 0.8 + Math.random() * 0.5,
                    ease: [0.2, 0.8, 0.2, 1],
                    opacity: { duration: 0.7 },
                    onComplete: i === 0 ? onComplete : undefined
                }}
            />
        );
    });
};

const UtilityButton = ({ text, shorcut, onClick }) => {
    const [isVisible, setIsVisible] = useState(true);
    const [particles, setParticles] = useState([]);
    const buttonRef = useRef(null);

    const handleClick = (e) => {
        if (onClick) onClick();

        const button = buttonRef.current;
        const rect = button.getBoundingClientRect();
        setIsVisible(false);

        const emitterCount = 8;
        const emitterPositions = [];

        for (let i = 0; i < emitterCount; i++) {
            emitterPositions.push({
                x: rect.left + Math.random() * rect.width,
                y: rect.top + Math.random() * rect.height,
            });
        }

        setParticles(emitterPositions);
    };

    const handleAnimationComplete = () => {
        setTimeout(() => {
            setIsVisible(true);
            setParticles([]);
        }, 1200);
    };

    const letterVariants = {
        hidden: { opacity: 0, y: 10, rotateX: 90 },
        visible: i => ({
            opacity: 1,
            y: 0,
            rotateX: 0,
            transition: {
                delay: i * 0.05,
                duration: 0.4,
                type: "spring",
                stiffness: 300,
                damping: 20
            }
        }),
        exit: i => ({
            opacity: 0,
            y: -10,
            rotateX: -90,
            transition: {
                delay: i * 0.01,
                duration: 0.1,
                ease: "backIn"
            }
        })
    };

    return (
        <div className="absolute inline-block right-10" style={{ isolation: 'isolate' }}>
            <AnimatePresence>
                {isVisible && (
                    <motion.button
                        ref={buttonRef}
                        className="bg-white/10 hover:bg-white/15 rounded-xl px-[8px] h-[30px] leading-1 text-white/40 justify-center items-center flex focus:outline-none backdrop-blur-sm z-10 mr-1 gap-1.5 relative overflow-hidden"
                        onClick={handleClick}
                        title={text}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        whileHover={{
                            scale: 1.05,
                            transition: { type: "spring", stiffness: 400, damping: 20 }
                        }}
                        whileTap={{
                            scale: 0.95,
                            transition: { type: "spring", stiffness: 400, damping: 20 }
                        }}
                    >
                        <motion.div className="flex items-center ">
                            {Array.from(text).map((letter, i) => (
                                <motion.span
                                    key={i}
                                    variants={letterVariants}
                                    custom={i}
                                    className="inline-block text-[#8a8a8a]"
                                >
                                    {letter}
                                </motion.span>
                            ))}
                        </motion.div>

                        {shorcut && (
                            <motion.span
                                className="text-[10px] opacity-50 border border-white/20 rounded-md w-5 h-5 flex items-center gap-0.5"
                                variants={{
                                    hidden: { opacity: 0, x: 10 },
                                    visible: {
                                        opacity: 0.5,
                                        x: 0,
                                        transition: { delay: 0.3, duration: 0.2 }
                                    },
                                    exit: {
                                        opacity: 0,
                                        x: 10,
                                        transition: { duration: 0.01 }
                                    }
                                }}
                            >
                                <span className='w-full text-center'>{shorcut}</span>
                            </motion.span>
                        )}
                    </motion.button>
                )}
            </AnimatePresence>

            <div className="fixed pointer-events-none" style={{
                top: 0,
                left: 0,
                width: 0,
                height: 0,
                overflow: 'visible',
                zIndex: 99
            }}>
                <AnimatePresence>
                    {particles.map((pos, i) => (
                        <ParticleEmitter
                            key={i}
                            x={pos.x}
                            y={pos.y}
                            onComplete={i === 0 ? handleAnimationComplete : undefined}
                        />
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default UtilityButton;