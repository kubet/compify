'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useAnimation, useReducedMotion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { GradientSpot } from '@/components/Common';
import { spotmap } from './spotmap';

const Spot = ({ color, size, initialPosition }) => {
    const controls = useAnimation();
    const shouldReduceMotion = useReducedMotion();

    useEffect(() => {
        if (shouldReduceMotion) {
            controls.set({ x: 0, y: 0, scale: 1 });
            return undefined;
        }
        controls.start({
            x: [0, Math.random() * 100 - 50, 0],
            y: [0, Math.random() * 100 - 50, 0],
            scale: [1, 1.1, 1],
            transition: {
                duration: 2 + Math.random(),
                repeat: Infinity,
                repeatType: 'reverse',
                ease: 'easeInOut',
            },
        });
        return () => controls.stop();
    }, [controls, shouldReduceMotion]);

    return (
        <motion.div
            className="absolute rounded-full opacity-50 mix-blend-screen"
            style={{
                backgroundColor: color,
                width: size,
                height: size,
                left: initialPosition.x,
                top: initialPosition.y,
                filter: `blur(${size / 3}px)`,
                pointerEvents: 'none',
                willChange: 'transform',
            }}
            animate={controls}
        />
    );
};
Spot.displayName = 'Spot';

const AnimatedBackground = React.memo(() => (
    <div className="absolute inset-0 h-[900px] overflow-hidden" aria-hidden="true">
        <div className="hidden sm:block">
            {spotmap.map((spot, index) => (
                <Spot key={index} {...spot} />
            ))}
        </div>
        <div className="block sm:hidden">
            <GradientSpot color="hsl(270, 93%, 73%)" size={350} position={{ x: '10%', y: '10%' }} />
            <GradientSpot color="hsl(264, 94%, 54%)" size={350} position={{ x: '10%', y: '50%' }} />
        </div>
    </div>
));
AnimatedBackground.displayName = 'AnimatedBackground';

const ctaClass = 'inline-flex min-h-12 items-center justify-center rounded-xl border px-5 py-3 font-medium transition-colors';

function Hero() {
    const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });
    const shouldReduceMotion = useReducedMotion();
    const fadeIn = {
        hidden: shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
    };

    return (
        <section className="relative flex min-h-[calc(100svh-4rem)] w-full items-center py-12 sm:py-16">
            <AnimatedBackground />
            <motion.div
                ref={ref}
                className="relative z-10 grid w-full items-center gap-12 px-2 sm:px-4 lg:grid-cols-[1.15fr_0.85fr]"
                initial="hidden"
                animate={inView ? 'visible' : 'hidden'}
                variants={{ visible: { transition: { staggerChildren: shouldReduceMotion ? 0 : 0.14 } } }}
            >
                <div className="max-w-3xl text-left">
                    <motion.p className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-purple-300" variants={fadeIn}>
                        Storybook stays upstream
                    </motion.p>
                    <motion.h1
                        className="mb-7 text-balance text-4xl font-bold leading-[1.12] text-white md:text-[3.5rem]"
                        variants={fadeIn}
                    >
                        Package selected React CSF into a reviewable shadcn artifact.
                    </motion.h1>
                    <motion.p className="mb-5 max-w-2xl text-lg leading-8 text-gray-300" variants={fadeIn}>
                        Compify statically reads a supported Storybook boundary, explains the included source graph,
                        and exports deterministic registry JSON for a maintainer to review before installation.
                    </motion.p>
                    <motion.p className="mb-9 max-w-2xl rounded-xl border border-amber-300/20 bg-amber-300/[0.06] px-4 py-3 text-sm leading-6 text-amber-100" variants={fadeIn}>
                        Experimental source candidate: these Storybook commands are not in the published npm 0.1.0 package yet.
                    </motion.p>
                    <motion.div className="flex flex-col gap-3 sm:flex-row" variants={fadeIn}>
                        <Link
                            href="/docs/storybook"
                            className={`${ctaClass} border-white/20 bg-gradient-to-r from-purple-500/40 to-blue-500/40 text-white hover:border-white/40`}
                        >
                            See the Storybook workflow
                        </Link>
                        <Link
                            href="/docs/compatibility"
                            className={`${ctaClass} border-white/15 bg-white/[0.03] text-gray-200 hover:bg-white/[0.08]`}
                        >
                            Read compatibility limits
                        </Link>
                    </motion.div>
                </div>

                <motion.div
                    className="relative mx-auto w-full max-w-xl overflow-hidden rounded-3xl border border-white/10 bg-black/70 p-5 shadow-2xl backdrop-blur-xl sm:p-7"
                    variants={fadeIn}
                >
                    <Image
                        src="/hero.webp"
                        alt=""
                        fill
                        sizes="(max-width: 1024px) 90vw, 36vw"
                        className="pointer-events-none object-cover opacity-15"
                        priority
                    />
                    <div className="relative space-y-4">
                        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-purple-300">Selection boundary</p>
                            <p className="font-mono text-sm text-gray-200">src/components/Button.stories.tsx</p>
                            <p className="mt-2 text-sm text-gray-400">React CSF · optional exact story export</p>
                        </div>
                        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                            <div className="rounded-xl border border-white/10 bg-black/50 p-3 text-center">
                                <p className="text-sm font-semibold text-white">Static inspect</p>
                                <p className="mt-1 text-xs text-gray-400">Graph + diagnostics</p>
                            </div>
                            <span className="text-purple-300" aria-hidden="true">→</span>
                            <div className="rounded-xl border border-purple-400/20 bg-purple-500/10 p-3 text-center">
                                <p className="text-sm font-semibold text-white">Review artifact</p>
                                <p className="mt-1 text-xs text-gray-400">shadcn registry JSON</p>
                            </div>
                        </div>
                        <div>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-200">Unreleased source command</p>
                            <code className="block overflow-x-auto rounded-xl border border-white/10 bg-black/70 p-4 text-sm leading-6 text-gray-300">
                                <span className="select-none text-gray-600">$ </span>
                                compify storybook export Button.stories.tsx
                            </code>
                        </div>
                        <p className="text-xs leading-5 text-gray-500">
                            Static acceptance is not runtime, visual, behavioral, or accessibility verification.
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </section>
    );
}

export default Hero;
