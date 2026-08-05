import React from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react';
function EnhancePrompt({ enhancePrompt, setPrompt, setSnackType, setSnackHeight }) {
    const calculateTextHeight = (text) => {
        const lines = text.split('\n').length;
        const charsPerLine = 50;
        const wrappedLines = Math.ceil(text.length / charsPerLine);
        const totalLines = Math.min(Math.max(lines + wrappedLines - 1, 1), 6);
        return totalLines * 30; // 24px per line
    };

    React.useEffect(() => {
        setSnackHeight(calculateTextHeight(enhancePrompt));
    }, [enhancePrompt, setSnackHeight]);

    return (
        <>
            <div className="flex flex-col gap-1 pb-1 pr-2">
                <span className="text-xs">Enhanced Prompt</span>

                <div className="overflow-y-auto">
                    <span
                        className="bg-clip-text text-sm text-transparent bg-[200%_auto] animate-shimmer bg-gradient-to-r from-gray-600 via-gray-400 to-slate-600"
                        style={{
                            animation: 'shimmer 2s linear 1',
                            backgroundSize: '200% auto',
                        }}
                    >
                        {enhancePrompt}
                    </span>
                </div>
            </div>
            <div className="flex items-center justify-between gap-2">
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="text-sm px-1.5 py-1 rounded-lg hover:text-white bg-red-500/10 hover:bg-red-500/15 transition-colors"
                    onClick={() => {
                        setSnackType('');
                    }}
                >
                    <X className="w-5 h-5" />
                </motion.button>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="text-sm px-3 py-1 rounded-lg hover:text-white bg-white/10 hover:bg-white/15 transition-colors"
                    onClick={() => {
                        setPrompt(enhancePrompt);
                        setSnackType('');
                    }}
                >
                    Apply
                </motion.button>
            </div>
            <style jsx>{`
        @keyframes shimmer {
          to {
            background-position: -200% center;
          }
        }
      `}</style>
        </>
    )
}

export default EnhancePrompt