import React, { useState, useRef } from 'react'
import { motion } from 'framer-motion';
import TooltipHelp from './TooltipHelp';

const Info = ({ onClick, tooltipTitle, tooltipDescription }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const buttonRef = useRef(null);

    return (
        <>
            <motion.div
                ref={buttonRef}
                className="relative cursor-pointer w-5 h-5 text-xs inline-flex items-center justify-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={onClick}
                onMouseEnter={() => setShowTooltip(true)}
            >
                <motion.div
                    className="absolute inset-0 rounded-full"
                    animate={{
                        boxShadow: ['0 0 0 0 rgba(156, 163, 175, 0.2)', '0 0 0 8px rgba(156, 163, 175, 0)'],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />

                <motion.div
                    style={{ backgroundColor: 'rgb(156 163 175 / 0.1)' }}
                    className="absolute inset-0 rounded-full border border-gray-400/30 flex items-center justify-center text-gray-400 font-semibold"
                >
                    i
                </motion.div>
            </motion.div>

            <TooltipHelp
                title={tooltipTitle}
                show={showTooltip}
                description={tooltipDescription}
                targetRef={buttonRef}
                closeTooltip={() => setShowTooltip(false)}
            />
        </>
    );
};

export default Info;