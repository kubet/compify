'use client'

import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/Button';
import { cn } from '@/lib/utils';

// Define the types for feature items in the card
interface PricingFeature {
    text: string;
    isSupported: boolean;
    highlight?: boolean;
    icon?: ReactNode;
}

// Define the types for the pricing card props
export interface PricingCardProps {
    title: string;
    description?: string;
    price?: string | number;
    period?: string;
    features: PricingFeature[];
    ctaText: string;
    onCtaClick?: () => void;
    icon?: ReactNode;
    isPopular?: boolean;
    freeSeats?: number | string;
    storageAmount?: string;
    gradientColors?: string;
    headerTag?: string;
    className?: string;
}

export const PricingCard = ({
    title,
    description,
    price,
    period = '/month',
    features,
    ctaText,
    onCtaClick,
    icon,
    isPopular = false,
    freeSeats,
    storageAmount,
    gradientColors = "from-[#0f1b3a] to-[#0a0f1f]",
    headerTag,
    className,
}: PricingCardProps) => {
    // Format price for display if it's a number
    const formattedPrice = typeof price === 'number' ? `$${price.toLocaleString()}` : price;

    return (
        <motion.div
            className={cn(
                "relative flex flex-col rounded-3xl bg-gradient-to-br border border-white/5 backdrop-blur-sm overflow-hidden h-full",
                gradientColors,
                className
            )}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            {/* Popular tag */}
            {isPopular && (
                <div className="absolute top-5 right-5 z-20">
                    <div className="bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-white">
                        Most popular
                    </div>
                </div>
            )}

            {/* Header tag (if provided) */}
            {headerTag && (
                <div className="absolute top-5 left-5 z-20">
                    <div className="bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-white">
                        {headerTag}
                    </div>
                </div>
            )}

            {/* Card content */}
            <div className="p-8 flex flex-col h-full">
                {/* Icon and title section */}
                <div className="mb-6 flex items-center">
                    {icon && (
                        <div className="w-12 h-12 rounded-full flex items-center justify-center mr-4">
                            {icon}
                        </div>
                    )}
                    <div>
                        <h3 className="text-2xl font-bold text-white">{title}</h3>
                        <p className="text-white/70 mt-1">{description}</p>
                    </div>
                </div>

                {/* Price section */}
                <div className="mb-8">
                    {formattedPrice && (
                        <div className="flex items-baseline">
                            <span className="text-4xl font-bold text-white">{formattedPrice}</span>
                            {period && <span className="text-white/70 ml-2">{period}</span>}
                        </div>
                    )}
                </div>

                {/* Resource indicators (seats/storage) */}
                {(freeSeats || storageAmount) && (
                    <div className="mb-8 space-y-3">
                        {freeSeats && (
                            <div className="flex items-center text-white">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-white/50" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                </svg>
                                <span>{freeSeats} free seats available</span>
                            </div>
                        )}
                        {storageAmount && (
                            <div className="flex items-center text-white">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-white/50" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3 1h10v8H5V6z" clipRule="evenodd" />
                                </svg>
                                <span>{storageAmount} of cloud storage</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Feature list */}
                <div className="space-y-4 mb-8 flex-grow">
                    {features.map((feature, index) => (
                        <div key={index} className="flex items-center">
                            <div className="mr-3 text-white">
                                {feature.isSupported ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white/30" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </div>
                            <span className={cn(
                                "text-sm",
                                feature.isSupported
                                    ? (feature.highlight ? "text-white font-medium" : "text-white/80")
                                    : "text-white/50 line-through"
                            )}>
                                {feature.text}
                            </span>
                        </div>
                    ))}
                </div>

                {/* CTA button */}
                <div className="mt-auto">
                    <Button
                        variant={isPopular ? "default" : "secondary"}
                        size="lg"
                        fullWidth
                        onClick={onCtaClick}
                        animate
                    >
                        {ctaText}
                    </Button>
                </div>
            </div>
        </motion.div>
    );
}; 