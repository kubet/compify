'use client'

import React from 'react'
import { Button as HeadlessButton } from '@headlessui/react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ComponentPropsWithoutRef<typeof HeadlessButton> {
    variant?: 'default' | 'outline' | 'ghost' | 'secondary' | 'link'
    size?: 'default' | 'sm' | 'lg' | 'icon'
    fullWidth?: boolean
    animate?: boolean
    children: React.ReactNode
}

const getButtonClasses = (
    variant: ButtonProps['variant'] = 'default',
    size: ButtonProps['size'] = 'default',
    fullWidth: ButtonProps['fullWidth'] = false,
    className?: string
) => {
    const baseClasses = 'inline-flex cursor-pointer items-center justify-center rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 data-[disabled]:opacity-50 data-[disabled]:pointer-events-none relative overflow-hidden'

    const variantClasses = {
        default: 'bg-primary text-white data-[hover]:bg-primary-hover data-[active]:bg-primary-active after:content-[""] after:absolute after:inset-0 after:rounded-full after:border-t after:border-t-white/20 after:pointer-events-none',
        outline: 'border border-primary text-primary bg-transparent data-[hover]:bg-primary data-[hover]:text-white after:content-[""] after:absolute after:inset-0 after:rounded-full after:border-t after:border-t-white/20 after:pointer-events-none',
        ghost: 'bg-transparent data-[hover]:bg-white/10 text-white',
        secondary: 'bg-white/10 text-white data-[hover]:bg-white/20 after:content-[""] after:absolute after:inset-0 after:rounded-full after:border-t after:border-t-white/20 after:pointer-events-none',
        link: 'text-primary underline-offset-4 data-[hover]:underline',
    }

    const sizeClasses = {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10',
    }

    const widthClass = fullWidth ? 'w-full' : ''

    return cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        widthClass,
        className
    )
}

export function Button({
    variant = 'default',
    size = 'default',
    fullWidth = false,
    animate = false,
    className,
    children,
    ...props
}: ButtonProps) {
    const buttonClasses = getButtonClasses(variant, size, fullWidth, className)

    if (animate) {
        return (
            <motion.div
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.1 }}
                className="inline-block"
                style={{ width: fullWidth ? '100%' : 'auto' }}
            >
                <HeadlessButton
                    className={buttonClasses}
                    {...props}
                >
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center justify-center w-full h-full"
                    >
                        {children}
                    </motion.div>
                </HeadlessButton>
            </motion.div>
        )
    }

    // Default case - no animations
    return (
        <HeadlessButton
            className={buttonClasses}
            {...props}
        >
            {children}
        </HeadlessButton>
    )
}

export default Button 