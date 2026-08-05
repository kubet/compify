'use client'

import React, { forwardRef } from 'react'
import { Field, Label, Description } from '@headlessui/react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

type InputSize = 'default' | 'sm' | 'lg'
type InputVariant = 'default' | 'outline' | 'ghost'

// Create a type that omits the HTML input size and adds our custom size
type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> & {
    variant?: InputVariant
    size?: InputSize
    fullWidth?: boolean
    animate?: boolean
    label?: string
    description?: string
}

const getInputClasses = (
    variant: InputVariant = 'default',
    size: InputSize = 'default',
    fullWidth = false,
    className?: string
) => {
    const baseClasses = 'rounded-full text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20 disabled:opacity-50 disabled:pointer-events-none focus:border-primary'

    const variantClasses = {
        default: 'bg-white/5 text-white border border-white/10 hover:border-white/20',
        outline: 'bg-transparent border border-white/20 text-white hover:border-white/40',
        ghost: 'bg-transparent text-white hover:bg-white/5 border border-transparent',
    }

    const sizeClasses = {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-12 px-6 text-base',
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

export const Input = forwardRef<HTMLInputElement, InputProps>(({
    variant = 'default',
    size = 'default',
    fullWidth = false,
    animate = false,
    className,
    label,
    description,
    ...props
}, ref) => {
    const inputClasses = getInputClasses(variant, size, fullWidth, className)

    const inputComponent = (
        <input
            ref={ref}
            className={inputClasses}
            {...props}
        />
    )

    // If label or description are provided, use Field to group them
    if (label || description) {
        return (
            <Field className={fullWidth ? 'w-full' : ''}>
                {label && <Label className="text-sm font-medium text-white mb-1">{label}</Label>}
                {description && <Description className="text-sm text-white/50 mb-2">{description}</Description>}
                {animate ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {inputComponent}
                    </motion.div>
                ) : (
                    inputComponent
                )}
            </Field>
        )
    }

    // Just return the input if no label/description
    return animate ? (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={fullWidth ? 'w-full' : ''}
        >
            {inputComponent}
        </motion.div>
    ) : (
        inputComponent
    )
})

Input.displayName = 'Input'

export default Input 