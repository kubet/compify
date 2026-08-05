'use client'

import React from 'react';
import { motion } from 'framer-motion';
import { PricingCard } from '@/components/PricingCard';


export const PricingSection = () => {
    // Define features for Plus plan
    const plusFeatures = [
        { text: 'Gravity Well Analytics Basic', isSupported: true, highlight: true },
        { text: 'Solar Energy Monitoring', isSupported: true, highlight: true },
        { text: 'Event Horizon Dashboard', isSupported: true },
        { text: 'Singularity Access', isSupported: false },
        { text: 'Temporal Distortion Controls', isSupported: false },
    ];

    // Define features for Pro plan
    const proFeatures = [
        { text: 'Gravity Well Analytics Advanced', isSupported: true, highlight: true },
        { text: 'Solar Energy Monitoring', isSupported: true },
        { text: 'Event Horizon Dashboard', isSupported: true },
        { text: 'Singularity Access', isSupported: true, highlight: true },
        { text: 'Temporal Distortion Controls', isSupported: true, highlight: true },
    ];

    // Define features for Enterprise plan
    const enterpriseFeatures = [
        { text: 'Gravity Well Analytics Unlimited', isSupported: true, highlight: true },
        { text: 'Supermassive Energy Control', isSupported: true, highlight: true },
        { text: 'Quantum Entanglement Interface', isSupported: true, highlight: true },
        { text: 'Multi-Dimensional Access', isSupported: true },
        { text: 'Dedicated Black Hole Support', isSupported: true },
    ];

    return (
        <section className="py-24 bg-black relative overflow-hidden" id="pricing">
            {/* Background elements - Event Horizon styled gradient */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60rem] h-[40rem]">
                <div className="absolute w-full h-full rounded-full bg-black"></div>
                <div className="absolute w-full h-full rounded-full bg-gradient-to-br from-[hsl(13,90%,40%)]/30 via-[hsl(13,90%,20%)]/20 to-transparent blur-[8rem] scale-[0.85] opacity-70"></div>
                <div className="absolute w-full h-full rounded-full bg-gradient-to-br from-[hsl(193,90%,40%)]/20 via-[hsl(193,90%,20%)]/10 to-transparent blur-[10rem] scale-[0.9] opacity-60"></div>
            </div>

            <div className="container mx-auto md:px-6 relative z-10">
                {/* Section header */}
                <div className="text-center mb-16">
                    <motion.h2
                        className="text-4xl md:text-5xl font-bold mb-6 text-white"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        Cross the Event Horizon
                    </motion.h2>
                    <motion.p
                        className="text-lg text-white/70 max-w-3xl mx-auto"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                    >
                        Choose your gravitational pull and harness the infinite energy of the cosmos
                    </motion.p>
                </div>

                {/* Pricing cards grid */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 max-w-7xl mx-auto">
                    {/* Plus Plan */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.6 }}
                    >
                        <PricingCard
                            title="Plus"
                            price={20}
                            features={plusFeatures}
                            ctaText="Enter Orbit"
                            gradientColors="from-[#1a1a1a] to-[#0a0a0a]"
                            icon={
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#333333] to-[#555555] flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                </div>
                            }
                        />
                    </motion.div>

                    {/* Pro Plan */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                        className="xl:-mt-4 xl:mb-4" // Makes this card slightly taller
                    >
                        <PricingCard
                            title="Pro"
                            price={200}
                            features={proFeatures}
                            ctaText="Breach Horizon"
                            isPopular={true}
                            gradientColors="from-[#202020] to-[#101010]"
                            icon={
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[hsl(13,90%,52%)] to-[hsl(23,90%,52%)] flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                            }
                        />
                    </motion.div>

                    {/* Enterprise Plan */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                    >
                        <PricingCard
                            title="Enterprise"
                            price="Contact us"
                            period=""
                            features={enterpriseFeatures}
                            ctaText="Enter Singularity"
                            gradientColors="from-[#2a2a2a] to-[#1a1a1a]"
                            icon={
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#707070] to-[#A0A0A0] flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                    </svg>
                                </div>
                            }
                        />
                    </motion.div>
                </div>

                {/* Optional FAQ or additional info section */}
                <motion.div
                    className="mt-24 text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                >
                    <p className="text-white/60 text-sm max-w-2xl mx-auto">
                        All plans include access to the Dark Solar core gravitational field.
                        Enterprise plans offer unlimited cosmic energy for your organization&apos;s interstellar growth.
                        <br />
                        <span className="underline cursor-pointer hover:text-white/80 transition-colors">
                            Contact our stellar team
                        </span> for custom configurations.
                    </p>
                </motion.div>
            </div>
        </section>
    );
}; 