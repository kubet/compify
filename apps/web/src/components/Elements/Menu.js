import React, { useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion';
import { GradientSpot } from '../Common';

function Menu({ children, isOpen, onClose, colors, anchorEl, className = 'z-50 p-3', showBorder = false, offset = { x: 0, y: 0 } }) {
    const menuRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                onClose();
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [onClose]);

    const topPosition = anchorEl ? anchorEl.offsetTop + anchorEl.offsetHeight + offset.y : 0;
    const rightPosition = anchorEl ? window.innerWidth - (anchorEl.offsetLeft + anchorEl.offsetWidth) + offset.x : 0;

    return (
        <AnimatePresence>
            {isOpen && anchorEl && (
                <motion.div
                    ref={menuRef}
                    className={`absolute rounded-3xl bg-[#0a0a0a] overflow-hidden border border-[rgba(255,255,255,0.05)] ${className}`}
                    style={{
                        top: isNaN(topPosition) ? 0 : topPosition,
                        right: isNaN(rightPosition) ? 0 : rightPosition,
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                    }}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {showBorder && <div className="absolute top-0 left-0 w-[70%] h-[70%] rounded-tl-3xl overflow-hidden opacity-30">
                        <div
                            className="absolute top-0 left-0 w-full h-[2px]"
                            style={{
                                background: `linear-gradient(90deg, ${colors[0]} 0%, transparent 100%)`,
                            }}
                        />
                        <div
                            className="absolute top-0 left-0 w-[2px] h-full"
                            style={{
                                background: `linear-gradient(180deg, ${colors[0]} 0%, transparent 100%)`,
                            }}
                        />
                        <div
                            className="absolute top-0 left-0 w-6 h-6 rounded-tl-3xl"
                            style={{
                                borderLeft: `2px solid ${colors[0]}`,
                                borderTop: `2px solid ${colors[0]}`,
                            }}
                        />
                    </div>}
                    <motion.div
                        className="absolute inset-0 bg-[rgba(255,255,255,0.03)]"
                        style={{
                            transformStyle: 'preserve-3d',
                        }}
                    />
                    <div className="relative">

                        <GradientSpot color={colors?.[0] || '#000'} size={100} position={{ x: '-20%', y: '-20%' }} />
                        {children}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

export default Menu
