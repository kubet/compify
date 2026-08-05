import React from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'

const EmptyState = ({
    title = 'No data found',
    description = 'There are no items to display at the moment.',
    icon,
    action,
    className = '',
    size = 'default', // 'small' | 'default' | 'large'
    variant = 'default', // 'default' | 'subtle'
}) => {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    }

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] }
        }
    }

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className={`col-span-full flex flex-col items-center justify-center min-h-[400px] relative ${className}`}
        >
            <div className="absolute inset-0 bg-gradient-radial from-gray-900/20 via-gray-900/5 to-transparent opacity-50" />

            <motion.div variants={itemVariants} className="relative">
                {icon && (
                    <div className="mb-6 text-gray-400/30">
                        {typeof icon === 'string' ? (
                            <Image
                                src={icon}
                                alt="Empty state illustration"
                                width={96}
                                height={96}
                                className="object-contain opacity-50"
                            />
                        ) : (
                            <div className="text-[120px]">
                                {icon}
                            </div>
                        )}
                    </div>
                )}

                <motion.div
                    variants={itemVariants}
                    className="flex flex-col items-center gap-3"
                >
                    <h3 className="text-3xl sm:text-4xl font-bold bg-gradient-to-b from-gray-200 via-gray-400 to-gray-600 bg-clip-text text-transparent">
                        {title}
                    </h3>
                    {description && (
                        <p className="text-gray-500 text-center max-w-sm">
                            {description}
                        </p>
                    )}
                    {action && (
                        <motion.div
                            className="mt-6"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {action}
                        </motion.div>
                    )}
                </motion.div>
            </motion.div>
        </motion.div>
    )
}

export default EmptyState