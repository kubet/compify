import React from 'react'
import { ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

function CollapsibleSection({
    title,
    children,
    isOpen,
    onToggle,
    className = '',
    Icon = ChevronDown
}) {
    return (
        <div className={`border border-[rgba(255,255,255,0.1)] rounded-xl overflow-hidden ${className}`}>
            <button
                onClick={onToggle}
                className="relative w-full px-4 py-3 flex items-center justify-between  transition-colors"
            >
                <motion.div
                    className="absolute inset-0 bg-[rgba(255,255,255,0.03)]"
                    style={{
                        transformStyle: 'preserve-3d',
                    }}
                />
                <h3 className="text-xl font-semibold text-gray-200">{title}</h3>
                <Icon
                    className={`w-5 h-5 transition-transform ${isOpen ? 'transform rotate-180' : ''
                        }`}
                />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ overflow: "hidden" }}
                    >
                        <div className="p-4 bg-gray-850">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default CollapsibleSection 