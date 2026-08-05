'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/Button'
import Image from 'next/image'


// Define FeatureItem type for proper TypeScript typing
type FeaturedItem = {
    name: string;
    subtitle: string;
    quote: string;
    icon: React.ReactNode;
    className: string;
    cardClassName: string;
    iconContainerClassName: string;
    showQuoteMark?: boolean;
    featuredLabel?: string;
};

export function Hero() {
    // Featured items data for rendering
    const featuredItemsRow1: FeaturedItem[] = [
        {
            name: "Readit",
            subtitle: "r/SpaceTech Community",
            quote: "Event Horizon's approach to cloud infrastructure is <span style=\"color: var(--color-primary);\">revolutionary</span> for tech-first companies.",
            icon: <span className="text-[#fa5a3b] text-base font-semibold">r/</span>,
            className: "group w-full lg:w-[280px] order-2 lg:order-1 lg:translate-y-6",
            cardClassName: "relative p-6 lg:p-7 rounded-2xl bg-black/30 backdrop-filter backdrop-blur-md border border-white/[0.08] h-full transition-all duration-300 hover:border-white/20 hover:bg-black/40 group-hover:translate-y-[-4px]",
            iconContainerClassName: "w-10 h-10 rounded-full bg-gradient-to-br from-[#fa5a3b]/20 to-[#fa5a3b]/10",
            showQuoteMark: true
        },
        {
            name: "CodeVault",
            subtitle: "CodeVault Universe",
            quote: "We've seen our clients achieve <span style=\"color: var(--color-primary);\">78% faster CI/CD pipelines</span> with Dark Solar's event horizon architecture.",
            icon: <span className="text-white text-sm font-medium">C</span>,
            className: "group w-full lg:w-[340px] z-10 order-1 lg:order-2",
            cardClassName: "relative p-7 lg:p-8 rounded-2xl bg-black/40 backdrop-filter backdrop-blur-md border border-white/[0.12] h-full transition-all duration-300 hover:border-white/20 hover:bg-black/50 group-hover:translate-y-[-4px]",
            iconContainerClassName: "w-12 h-12 rounded-full bg-gradient-to-br from-[#8c65c7]/20 to-[#8c65c7]/10",
            showQuoteMark: true,
            featuredLabel: "Featured Review"
        },
        {
            name: "Product",
            subtitle: "#1 Product of the Day",
            quote: "Teams report <span style=\"color: var(--color-primary);\">55% better product velocity</span> after implementing Dark Solar's framework.",
            icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-[#ff7263]">
                <path d="M13 12h5.5a1 1 0 0 0 0-2H13V4.5a1 1 0 0 0-2 0V10H5.5a1 1 0 0 0 0 2H11v5.5a1 1 0 0 0 2 0V12z" />
            </svg>,
            className: "group w-full lg:w-[280px] order-3 lg:translate-y-6",
            cardClassName: "relative p-6 lg:p-7 rounded-2xl bg-black/30 backdrop-filter backdrop-blur-md border border-white/[0.08] h-full transition-all duration-300 hover:border-white/20 hover:bg-black/40 group-hover:translate-y-[-4px]",
            iconContainerClassName: "w-10 h-10 rounded-full bg-gradient-to-br from-[#ff7263]/20 to-[#ff7263]/10",
            showQuoteMark: true
        }
    ];

    const featuredItemsRow2: FeaturedItem[] = [
        {
            name: "TekBuzz",
            subtitle: "Featured Article",
            quote: "\"Investors commit <span style=\"color: var(--color-primary);\">$40M</span> for event horizon technology.\"",
            icon: <span className="text-white text-sm font-medium">TB</span>,
            className: "group w-full lg:w-[250px] lg:translate-y-0",
            cardClassName: "relative p-6 lg:p-7 rounded-2xl bg-black/25 backdrop-filter backdrop-blur-md border border-white/[0.08] h-full transition-all duration-300 hover:border-white/20 hover:bg-black/40 group-hover:translate-y-[-4px]",
            iconContainerClassName: "w-9 h-9 rounded-full bg-gradient-to-br from-white/20 to-white/5",
            showQuoteMark: false
        },
        {
            name: "ByteWatch",
            subtitle: "Trending on BW",
            quote: "\"Cloud singularity for enterprise data processing shows <span style=\"color: var(--color-primary);\">remarkable</span> performance gains.\"",
            icon: <span className="text-[#ff7700] text-sm font-medium">B</span>,
            className: "group w-full lg:w-[300px] lg:translate-y-[-25px]",
            cardClassName: "relative p-6 lg:p-7 rounded-2xl bg-gradient-to-b from-black/30 to-black/20 backdrop-filter backdrop-blur-md border border-white/[0.08] h-full transition-all duration-300 hover:border-white/20 hover:bg-black/40 group-hover:translate-y-[-4px]",
            iconContainerClassName: "w-9 h-9 rounded-full bg-gradient-to-br from-[#ff7700]/20 to-[#ff7700]/5",
            showQuoteMark: false
        },
        {
            name: "Financer",
            subtitle: "Tech Review",
            quote: "\"The gravitational pull of Dark Solar's infrastructure cannot be <span style=\"color: var(--color-primary);\">ignored</span>.\"",
            icon: <span className="text-white text-sm font-medium">F</span>,
            className: "group w-full lg:w-[250px] lg:translate-y-0",
            cardClassName: "relative p-6 lg:p-7 rounded-2xl bg-black/25 backdrop-filter backdrop-blur-md border border-white/[0.08] h-full transition-all duration-300 hover:border-white/20 hover:bg-black/40 group-hover:translate-y-[-4px]",
            iconContainerClassName: "w-9 h-9 rounded-full bg-gradient-to-br from-white/20 to-white/5",
            showQuoteMark: false
        }
    ];

    return (
        <>
            {/* Full-width gradient background as a separate element outside the container constraints */}
            <div className="absolute left-0 right-0 h-screen w-full overflow-hidden pointer-events-none z-0">
                {/* Base layer - dark background */}
                <div className="absolute inset-0 bg-background" />

                {/* Main horizon effect - moved higher and with edge fade to black */}
                <div
                    className="absolute inset-x-0 bottom-[25vh] h-[35vh]"
                    style={{
                        background: `
              linear-gradient(
                to top,
                #000000 0%, 
                var(--color-primary) 35%,
                var(--color-primary-hover) 50%,        
                rgba(255, 255, 255, 0.95) 90%,
                rgba(255, 255, 255, 0) 100%
              ),
              linear-gradient(
                to right,
                #000000 0%,
                transparent 20%,
                transparent 80%,
                #000000 100%
              )
            `,
                        opacity: 0.75,
                        mixBlendMode: 'normal',
                    }}
                />
                <div
                    className="absolute w-[40%] h-[25vh]"
                    style={{
                        background: 'radial-gradient(ellipse at center, black 0%, rgba(0, 0, 0, 0.9) 20%, color-mix(in srgb, black 85%, var(--color-primary)) 40%, color-mix(in srgb, transparent 80%, var(--color-primary) 20%) 70%, transparent 90%)',
                        bottom: '40vh',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        filter: 'blur(15px)',
                        mixBlendMode: 'multiply',
                        opacity: 0.9,
                        zIndex: 1
                    }}
                />
                {/* Strong central white glow - moved higher */}
                <div
                    className="absolute w-[60%] h-[30vh]"
                    style={{
                        background: 'radial-gradient(ellipse at center, white 0%, rgba(255, 255, 255, 0.8) 30%, transparent 60%, rgba(0, 0, 0, 0.5) 90%)',
                        bottom: '28vh',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        filter: 'blur(30px)',
                        mixBlendMode: 'screen',
                    }}
                />

                {/* Edge vignette - significantly stronger black at the edges */}
                <div
                    className="absolute inset-0"
                    style={{
                        background: `
              radial-gradient(
                ellipse at center, 
                transparent 20%, 
                rgba(0, 0, 0, 0.4) 60%, 
                rgba(0, 0, 0, 0.9) 90%
              ),
              linear-gradient(
                90deg, 
                rgba(0, 0, 0, 1) 0%, 
                rgba(0, 0, 0, 0.7) 10%, 
                transparent 25%, 
                transparent 75%, 
                rgba(0, 0, 0, 0.7) 90%, 
                rgba(0, 0, 0, 1) 100%
              )
            `,
                        pointerEvents: 'none',
                        mixBlendMode: 'multiply',
                        opacity: 0.9,
                    }}
                />

                {/* Additional corner darkening for stronger vignette effect */}
                <div
                    className="absolute inset-0"
                    style={{
                        background: `
              radial-gradient(
                circle at 0% 0%, 
                rgba(0, 0, 0, 0.9) 0%, 
                rgba(0, 0, 0, 0.7) 10%, 
                transparent 30%
              ),
              radial-gradient(
                circle at 100% 0%, 
                rgba(0, 0, 0, 0.9) 0%, 
                rgba(0, 0, 0, 0.7) 10%, 
                transparent 30%
              ),
              radial-gradient(
                circle at 0% 100%, 
                rgba(0, 0, 0, 0.9) 0%, 
                rgba(0, 0, 0, 0.7) 10%, 
                transparent 30%
              ),
              radial-gradient(
                circle at 100% 100%, 
                rgba(0, 0, 0, 0.9) 0%, 
                rgba(0, 0, 0, 0.7) 10%, 
                transparent 30%
              )
            `,
                        mixBlendMode: 'multiply',
                    }}
                />

                {/* Color overlay for top half */}
                <div
                    className="absolute inset-x-0 top-0 h-[65vh]"
                    style={{
                        background: 'linear-gradient(to bottom, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0.9) 70%, transparent 100%)',
                    }}
                />
            </div>

            {/* Main content section */}
            <section className="relative min-h-[90vh] flex flex-col items-center justify-center z-10">
                <div className="mt-40 container px-4 md:px-6 flex flex-col items-center text-center">
                    {/* Social proof section */}
                    <motion.div
                        className="mb-8 flex flex-col items-center"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="flex -space-x-2 mb-2">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <Image
                                    key={i}
                                    src={`/avatars/${i}.png`}
                                    alt={`Avatar ${i}`}
                                    className="w-8 h-8 rounded-full border-2 border-background bg-white/10"
                                    width={1000}
                                    height={1000}
                                />
                            ))}
                        </div>


                        <p className="text-sm text-white/70">500+ explorers have crossed the horizon</p>
                    </motion.div>

                    {/* Main headline */}
                    <motion.h1
                        className="text-5xl md:text-7xl font-bold tracking-tight max-w-4xl mb-4 md:mb-6"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                    >
                        Cross the <span className="text-primary">Event Horizon</span> of <span className="italic font-normal text-white/90">Innovation</span>
                    </motion.h1>

                    {/* Supporting text */}
                    <motion.p
                        className="text-lg md:text-xl text-white/70 max-w-2xl mb-10"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                    >
                        Once you cross our event horizon, there&apos;s no turning back. Your business will be transformed by
                        the gravitational pull of our solutions.
                    </motion.p>

                    {/* CTA buttons */}
                    <motion.div
                        className="flex flex-col sm:flex-row gap-4 mb-16"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6, duration: 0.8 }}
                    >
                        <Button size="lg" animate>
                            Enter the Singularity
                        </Button>
                        <Button size="lg" variant="ghost" animate>
                            Explore Our Orbit
                        </Button>
                    </motion.div>
                </div>
                <div className='mt-24 relative w-full max-w-7xl mx-auto'>

                    {/* Premium Featured Section with sophisticated layout */}
                    <section className="mt-28 mb-20 relative w-full overflow-hidden" id="featured">
                        {/* Background elements with primary gradient spot */}
                        <div className="absolute -z-10 inset-0 bg-gradient-to-b from-black/0 via-black/5 to-black/0 pointer-events-none" />
                        <div className="absolute -z-20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[radial-gradient(ellipse_at_center,rgba(58,34,76,0.07)_0%,rgba(0,0,0,0)_70%)] pointer-events-none blur-xl" />

                        {/* Primary color gradient spot */}
                        <div className="absolute -z-10 top-[15%] right-[10%] w-[35rem] h-[30rem] rounded-full bg-[radial-gradient(circle_at_center,var(--color-primary)/5_0%,transparent_70%)] blur-[6rem] opacity-30 animate-pulse-slow pointer-events-none" />
                        <div className="absolute -z-10 bottom-[15%] left-[10%] w-[25rem] h-[25rem] rounded-full bg-[radial-gradient(circle_at_center,var(--color-primary)/4_0%,transparent_70%)] blur-[6rem] opacity-20 animate-pulse-slow pointer-events-none" />

                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            {/* Section header with refined sophistication */}
                            <div className="relative text-center mb-16">
                                <motion.p
                                    className="text-sm uppercase tracking-widest text-white/40 mb-3"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.8 }}
                                >
                                    Trust & Recognition
                                </motion.p>
                                <motion.h2
                                    className="text-3xl md:text-4xl font-medium text-white tracking-tight max-w-md mx-auto"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: 0.2 }}
                                >
                                    Featured by industry leaders
                                </motion.h2>

                                {/* Subtle visual divider */}
                                <motion.div
                                    className="w-16 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent mx-auto mt-8"
                                    initial={{ width: 0 }}
                                    animate={{ width: 64 }}
                                    transition={{ duration: 0.8, delay: 0.4 }}
                                />
                            </div>

                            {/* Asymmetrical, staggered layout for featured items */}
                            <div className="relative">
                                {/* Row 1 - Premium layout with staggered positioning */}
                                <div className="flex flex-col lg:flex-row items-center lg:items-end justify-center gap-5 lg:gap-8 mb-8">
                                    {/* Featured items row 1 (mapped from featuredItems data) */}
                                    {featuredItemsRow1.map((item, index) => (
                                        <motion.div
                                            key={`featured-row1-${index}`}
                                            className={item.className}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.7, delay: 0.1 + (index * 0.15) }}
                                        >
                                            <div className={item.cardClassName}>
                                                <div className="flex items-center gap-3 mb-5">
                                                    <div className={`${item.iconContainerClassName} flex items-center justify-center`}>
                                                        {item.icon}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-white font-medium text-lg">{item.name}</h3>
                                                        <p className="text-white/50 text-xs">{item.subtitle}</p>
                                                    </div>
                                                </div>
                                                <blockquote className="relative">
                                                    {item.showQuoteMark && (
                                                        <div className="absolute -left-1 -top-1 text-white/10 text-4xl">&quot;</div>
                                                    )}
                                                    <p className={`${item.showQuoteMark ? "pl-5" : ""} text-white/80 text-sm leading-relaxed`}
                                                        dangerouslySetInnerHTML={{ __html: item.quote }} />

                                                    {item.featuredLabel && (
                                                        <div className="mt-5 flex items-center gap-2">
                                                            <div className="w-5 h-[1px] bg-white/20"></div>
                                                            <span className="text-white/40 text-xs uppercase tracking-wider">{item.featuredLabel}</span>
                                                        </div>
                                                    )}
                                                </blockquote>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Row 2 - Alternating design with strategic positioning */}
                                <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-5 lg:gap-8">
                                    {/* Featured items row 2 (mapped from featuredItems data) */}
                                    {featuredItemsRow2.map((item, index) => (
                                        <motion.div
                                            key={`featured-row2-${index}`}
                                            className={item.className}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.7, delay: 0.3 + (index * 0.15) }}
                                        >
                                            <div className={item.cardClassName}>
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className={`${item.iconContainerClassName} flex items-center justify-center`}>
                                                        {item.icon}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-white font-medium">{item.name}</h3>
                                                        <p className="text-white/50 text-xs">{item.subtitle}</p>
                                                    </div>
                                                </div>
                                                <blockquote className="relative">
                                                    <p className="text-white/80 text-sm leading-relaxed"
                                                        dangerouslySetInnerHTML={{ __html: item.quote }} />
                                                </blockquote>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                        </div>
                    </section>
                </div>
            </section>
        </>
    )
}

export default Hero