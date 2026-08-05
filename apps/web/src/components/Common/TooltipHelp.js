import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TooltipHelp({
    show = false,
    title,
    description,
    targetRef,
    closeTooltip,
    children
}) {
    const tooltipRef = useRef(null);
    const [tooltipWidth, setTooltipWidth] = useState(0);

    useEffect(() => {
        if (show && tooltipRef.current) {
            setTooltipWidth(tooltipRef.current.offsetWidth);
        }
    }, [show, description]);

    return (
        <>
            {children}

            <AnimatePresence>
                {show && targetRef.current && (
                    <motion.div
                        style={{
                            position: 'fixed',
                            zIndex: 50,
                            top: targetRef.current.getBoundingClientRect().bottom + 12,
                            left: targetRef.current.getBoundingClientRect().left + (targetRef.current.getBoundingClientRect().width / 2) - (tooltipWidth / 2),
                            transform: 'translateX(0)',
                        }}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                        onMouseLeave={closeTooltip}
                    >
                        <div className="relative">
                            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-[#111111] border-t border-l border-[rgba(255,255,255,0.1)] z-10" />



                            <div
                                ref={tooltipRef}
                                className="relative border p-4 border-[rgba(255,255,255,0.1)] bg-[#111111] rounded-xl overflow-hidden"
                            >
                                <h2 className="text-white text-lg font-medium mb-3">{title}</h2>

                                <p
                                    className="text-gray-400 text-sm max-w-[14rem]"
                                    dangerouslySetInnerHTML={{ __html: description }}
                                />

                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}