import React, { ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

type CardProps = HTMLMotionProps<"div"> & {
    title?: string;
    description?: string;
    icon?: ReactNode;
    gradient?: string;
    className?: string;
    contentClassName?: string;
    children?: ReactNode;
    fullWidth?: boolean;
    hasGradientSpot?: boolean;
    footer?: ReactNode;
};

export const Card = ({
    title,
    description,
    icon,
    gradient = "from-[hsl(13,90%,52%)]/10 to-[hsl(193,90%,52%)]/5",
    className,
    contentClassName,
    children,
    fullWidth = false,
    hasGradientSpot = true,
    footer,
    initial = { opacity: 0, y: 20 },
    animate = { opacity: 1, y: 0 },
    transition = { duration: 0.5 },
    ...props
}: CardProps) => {
    return (
        <motion.div
            className={[
                "relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0f1b3a] to-[#0a0f1f] border border-white/5 backdrop-blur-sm p-8",
                fullWidth ? "col-span-full" : "",
                className
            ].filter(Boolean).join(" ")}
            initial={initial}
            animate={animate}
            transition={transition}
            {...props}
        >
            {/* Gradient spot in corner */}
            {hasGradientSpot && (
                <div className={`absolute -top-28 -right-28 w-56 h-56 rounded-full bg-gradient-to-br ${gradient} blur-3xl`}></div>
            )}

            {/* Dark gradient overlay for better text readability */}
            <div className="absolute top-1/2 left-0 w-full h-1/2 bg-gradient-to-t from-black/30 to-transparent"></div>

            <div className={["relative h-full flex flex-col z-10", contentClassName].filter(Boolean).join(" ")}>
                {icon && (
                    <div className="w-10 h-10 rounded-full bg-[#1a2747] flex items-center justify-center mb-6">
                        {icon}
                    </div>
                )}

                {title && (
                    <h2 className="text-2xl md:text-3xl font-medium mb-4 text-white">{title}</h2>
                )}

                {description && (
                    <p className="text-[hsl(13,90%,80%)]">{description}</p>
                )}

                {children}

                {footer && (
                    <div className="mt-auto pt-4">
                        {footer}
                    </div>
                )}
            </div>
        </motion.div>
    );
}; 