import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import Shimmer from '@/components/Common/Shimmer';

const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.6,
            staggerChildren: 0.1
        }
    }
};

const childVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
};

const ExamplesCard = ({
    title = "Component Examples",
    description = "Ready-to-use interactive components",
    count = "25+ examples",
    onClick = () => { }
}) => {
    return (
        <motion.div
            className="relative cursor-pointer overflow-hidden rounded-xl bg-black border border-[rgba(255,255,255,0.13)]"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            whileHover={{
                scale: 1.02,
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}
            onClick={onClick}
            whileTap={{ scale: 0.98 }}
        >
            {/* Subtle gradient backdrop */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-950/20 via-white/5 to-fuchsia-950/20" />

            {/* Shimmer effect */}
            <Shimmer />

            <div className="relative px-6 pt-6">
                {/* Header Section */}
                <motion.div
                    className="flex items-start gap-4 pb-4"
                    variants={childVariants}
                >
                    <div className="flex-1">
                        <motion.h3
                            className="text-xl font-bold text-white"
                            variants={childVariants}
                        >
                            {title}
                        </motion.h3>
                        <motion.p
                            className="text-zinc-400 mt-1"
                            variants={childVariants}
                        >
                            {description}
                        </motion.p>
                    </div>
                </motion.div>

                {/* Footer Section */}
                <motion.div
                    className="flex items-center justify-between h-16 border-t border-zinc-800/50"
                    variants={childVariants}
                >
                    <span className="text-zinc-500 text-sm flex items-center gap-2">
                        <motion.div
                            animate={{
                                opacity: [1, 0.5, 1],
                                scale: [1, 1.05, 1]
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            className="w-2 h-2 rounded-full bg-violet-400"
                        />
                        {count}
                    </span>
                    <motion.button
                        className="flex items-center gap-2 text-zinc-400 group px-4 py-2 rounded-lg transition-all duration-300"
                        whileHover={{
                            x: 5,
                            // backgroundColor: 'rgba(124, 58, 237, 0.1)',
                        }}
                        onClick={onClick}
                    >
                        <span className="group-hover:text-violet-400 transition-colors">View examples</span>
                        <ChevronRight className="w-4 h-4 group-hover:transform group-hover:translate-x-1 transition-transform group-hover:text-violet-400" />
                    </motion.button>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default ExamplesCard;