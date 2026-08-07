import React from 'react'
import { motion } from 'framer-motion'
import { GradientSpot } from '../Common'
import { CheckIcon } from 'lucide-react'

function CardWrapper({
    children,
    color,
    onClick,
    className = "p-6",
    hoverEffect = true,
    isChecked
}) {
    return (
        <motion.div
            className={`relative cursor-pointer rounded-3xl shadow-md overflow-hidden 
                ${isChecked ? 'border-[rgba(255,255,255,0.3)]' : 'border-[rgba(255,255,255,0.1)]'} 
                border w-full h-full flex flex-col ${className}`}
            style={{
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                boxShadow: isChecked
                    ? "0 8px 32px -1px rgba(0, 0, 0, 0.2), 0 0 0 2px rgba(255,255,255,0.3)"
                    : undefined
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileHover={hoverEffect ? {
                y: -10,
                boxShadow: "0 8px 32px -1px rgba(0, 0, 0, 0.2), 0 0 0 2px rgba(255,255,255,0.3)",
                border: '1px solid rgba(255,255,255,0.3)',
                transition: { duration: 0.3 }
            } : {}}
            onClick={onClick}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
            <motion.div
                className="absolute inset-0 bg-[rgba(255,255,255,0.03)]"
                style={{ transformStyle: 'preserve-3d' }}
            />
            {color && <GradientSpot color={color} size={200} position={{ x: '-20%', y: '-20%' }} />}
            {isChecked !== undefined && (
                <div
                    className={`absolute top-2 right-2 text-gray-400 hover:scale-110 transition-all duration-300 
                        rounded-full bg-opacity-10 h-6 w-6 flex items-center justify-center 
                        border border-[rgba(255,255,255,0.1)] ${isChecked ? 'bg-white' : ''}`}
                >
                    {isChecked && <CheckIcon size={15} />}
                </div>
            )}
            {children}
        </motion.div>
    )
}

export default CardWrapper