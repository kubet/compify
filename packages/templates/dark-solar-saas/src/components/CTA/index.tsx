"use client"
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/Button';
import Image from 'next/image';

export interface CTASectionProps {
    title?: string;
    description?: string;
    primaryButtonText?: string;
    secondaryButtonText?: string;
    onPrimaryClick?: () => void;
    onSecondaryClick?: () => void;
    className?: string;
}

export const CTASection = ({
    title = "Ready to transform your energy future?",
    description = "Join forward-thinking businesses saving up to 60% on energy costs while reducing environmental impact.",
    primaryButtonText = "Get Started",
    secondaryButtonText = "Book a Demo",
    onPrimaryClick,
    onSecondaryClick,
}: CTASectionProps) => {
    return (
        <motion.section
            className="py-32 bg-black relative overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            id="learn-more"
        >
            {/* Static Shadow Effect (was Black Hole Event Horizon) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60rem] h-[40rem]">
                <div className="absolute w-full h-full rounded-full bg-black"></div>
                <div
                    className="absolute w-full h-full rounded-full bg-gradient-to-br from-[hsl(13,90%,40%)]/30 via-[hsl(13,90%,20%)]/20 to-transparent blur-[8rem] scale-[0.85] opacity-70"
                ></div>
                <div
                    className="absolute w-full h-full rounded-full bg-gradient-to-br from-[hsl(193,90%,40%)]/20 via-[hsl(193,90%,20%)]/10 to-transparent blur-[10rem] scale-[0.9] opacity-60"
                ></div>
            </div>

            <div className="container md:mx-auto  md:px-6 relative z-10">
                <div className="max-w-4xl mx-auto">
                    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/50 backdrop-blur-xl">
                        <div className="flex flex-col md:flex-row">
                            {/* Content Side */}
                            <div className="md:w-3/5 p-10 md:p-14">
                                <motion.h2
                                    className="text-3xl md:text-4xl font-medium mb-6 text-[hsl(13,90%,99%)]"
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3, duration: 0.6 }}
                                >
                                    {title}
                                </motion.h2>

                                <motion.p
                                    className="text-lg text-white/60 mb-8"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.4, duration: 0.6 }}
                                >
                                    {description}
                                </motion.p>

                                <motion.div
                                    className="space-y-4"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5, duration: 0.6 }}
                                >
                                    <Button
                                        size="lg"
                                        className="w-full bg-primary hover:bg-primary/80 text-white"
                                        onClick={onPrimaryClick}
                                    >
                                        {primaryButtonText}
                                    </Button>
                                    <Button
                                        size="lg"
                                        variant="secondary"
                                        className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white border-0"
                                        onClick={onSecondaryClick}
                                    >
                                        {secondaryButtonText}
                                    </Button>
                                </motion.div>

                                <motion.p
                                    className="text-xs text-primary/60 mt-6"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.6, duration: 0.6 }}
                                >
                                    No credit card required. Free consultation.
                                </motion.p>
                            </div>

                            {/* Visual Side */}
                            <div className="hidden md:block md:w-2/5 relative overflow-hidden">
                                {/* Replace gradient with image */}
                                <Image
                                    src="/cta-image.png"
                                    alt="Solar panel installation"
                                    className="absolute inset-0 h-full w-full object-cover"
                                    width={1000}
                                    height={1000}
                                />

                                {/* Optional dark overlay to maintain readability of text */}
                                <div className="absolute inset-0 bg-black/40"></div>


                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.section>
    );
}; 