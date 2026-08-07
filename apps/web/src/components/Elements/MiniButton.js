import React from 'react';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';

const MiniButton = ({ onClick,
    Icon = Plus,
    text = "",
    label = "",
    divProps = { initial: { paddingLeft: "8px", paddingRight: "4px" }, whileHover: { paddingLeft: "10px", paddingRight: "8px", transition: { duration: 0.2, ease: "easeOut" } } }
}) => {
    return (
        <div className="relative group z-50">
            <motion.div
                className="relative w-fit cursor-pointer rounded-lg border border-[rgba(255,255,255,0.1)] min-w-fit"
                onClick={onClick}
                {...divProps}
            >
                <div className="absolute inset-0 bg-[rgba(255,255,255,0.03)] rounded-lg" />

                <div className="relative flex items-center justify-center h-6">
                    <Icon size={16} className="text-gray-100" />
                    {text && (
                        <span className="text-gray-100 mx-2">
                            {text}
                        </span>
                    )}
                </div>
            </motion.div>

            {label && (
                <div className="absolute hidden group-hover:block top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 text-sm bg-[#0a0a0a] text-gray-100 rounded-lg whitespace-nowrap border border-[rgba(255,255,255,0.1)] shadow-lg z-50">
                    {label}
                </div>
            )}
        </div>
    );
};

export default MiniButton;