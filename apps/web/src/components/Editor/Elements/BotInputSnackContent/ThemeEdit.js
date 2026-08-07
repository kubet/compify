import React from 'react'
import { motion } from 'framer-motion'
import { Settings, X } from 'lucide-react'

function ThemeEdit({ apply, close }) {
    return (
        <>
            <div className="flex flex-col gap-1">
                <span className="">Accept theme changes</span>

            </div>
            <div className="flex items-center justify-between gap-2">
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="text-sm px-3 py-1 rounded-lg hover:text-white bg-red-500/10 hover:bg-red-500/15 transition-colors"
                    onClick={() => close()}
                >
                    <span className="hidden md:block">Cancel</span>
                    <X className="w-5 h-5 md:hidden" />
                </motion.button>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="text-sm px-3 py-1 rounded-lg hover:text-white bg-white/10 hover:bg-white/15 transition-colors"
                    onClick={() => apply()}
                >
                    <span className="hidden md:block">Accept</span>
                    <Settings className="w-5 h-5 md:hidden" />
                </motion.button>
            </div>
        </>
    )
}

export default ThemeEdit