'use client'
import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { spotmap } from './spotmap';
import { Button, Switch, Slider } from '../../Elements';
import MiniPricingBox from '../../Elements/MiniPricingBox';
import { useRouter } from 'next/navigation';
import { GradientSpot } from '@/components/Common';
import Image from 'next/image';

const Spot = ({ color, size, initialPosition }) => {

    const controls = useAnimation();
    useEffect(() => {
        controls.start({
            x: [0, Math.random() * 100 - 50, 0],
            y: [0, Math.random() * 100 - 50, 0],
            scale: [1, 1.1, 1],
            transition: {
                duration: 2 + Math.random(),
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut",
                willChange: "transform",
                translateZ: 0
            }
        });
    }, [controls]);

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
                transform: 'translate3d(0, 0, 0) translateZ(0)',
                WebkitTransform: 'translate3d(0, 0, 0) translateZ(0)',
                willChange: 'transform',
                WebkitBackfaceVisibility: 'hidden',
                backfaceVisibility: 'hidden',
                WebkitPerspective: '1000px',
                perspective: '1000px',
                WebkitTransformStyle: 'preserve-3d',
                transformStyle: 'preserve-3d'
            }}
            animate={controls}
        />
    );
};
Spot.displayName = 'Spot';
const AnimatedBackground = React.memo(() => {



    return (
        <div className="absolute inset-0 overflow-hidden h-[900px]">
            <div className="sm:block hidden">
                {spotmap.map((spot, index) => (
                    <Spot key={index} {...spot} />
                ))}
            </div>
            <div className="block sm:hidden">
                <GradientSpot color="hsl(270, 93%, 73%)" size={350} position={{ x: '10%', y: '10%' }} />
                <GradientSpot color="hsl(264, 94%, 54%)" size={350} position={{ x: '10%', y: '50%' }} />
            </div>
        </div>
    );
});
AnimatedBackground.displayName = 'AnimatedBackground';
function Hero() {
    const router = useRouter();
    const [value, setValue] = useState(260);
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.1,
    });

    const fadeIn = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
    };

    const buttonVariants = {
        hover: { scale: 1.05, transition: { duration: 0.2 } },
        tap: { scale: 0.95 },
    };

    const [isImageLoaded, setImageLoaded] = useState(false);

    const handleImageLoad = useCallback(() => {
        setImageLoaded(true);
    }, []);

    const tokens = [{
        name: 'primary-100',
        color: `hsl(${value}, 100%, 90%)`,
    }, {
        name: 'primary-400',
        color: `hsl(${value}, 100%, 70%)`,
    }, {
        name: 'primary-700',
        color: `hsl(${value}, 100%, 40%)`,
    }]

    return (
        <div className="w-full min-h-[calc(100svh-4rem)] py-12 sm:py-16 flex items-center justify-between">
            <AnimatedBackground />

            <motion.div
                ref={ref}
                className="w-full relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-16 px-4 sm:px-6 md:px-8 lg:pr-44 overflow-hidden pb-2"
                initial="hidden"
                animate={inView ? "visible" : "hidden"}
                variants={{
                    visible: { transition: { staggerChildren: 0.2 } },
                }}
            >
                <div className="text-left w-full max-w-[54rem]">
                    <motion.h1
                        className="text-4xl md:text-[3.5rem] leading-[1.15] font-bold mb-8 text-white"
                        variants={fadeIn}
                    >
                        Build components once.
                        <br />
                        Install them anywhere.
                    </motion.h1>
                    <motion.div variants={fadeIn} className="mb-10">
                        <code className="inline-block max-w-full overflow-x-auto rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3.5 font-mono text-sm md:text-base text-gray-300">
                            <span className="select-none text-gray-600">$ </span>
                            npx shadcn@latest add <span className="text-purple-300">@compify/glass-3d-text</span>
                        </code>
                    </motion.div>
                    <motion.div className="space-x-4 flex items-center justify-start" variants={fadeIn}>
                        <Button text="Start building" textSm='Start' variant="full" onClick={() => router.push('/register')} />
                        <Button text="Watch the demo" textSm='Demo' variant="outline" onClick={() => router.push('/#demo')} />
                    </motion.div>
                </div>


                <div
                    className="w-full lg:w-[24rem] h-full min-w-[18rem] min-h-[18rem] max-w-[24rem] max-h-[24rem] lg:max-h-none lg:h-[34rem] relative mt-8 lg:mt-0 overflow-visible"
                >
                    <Image
                        src="/hero.webp"
                        alt="Hero Image"
                        className="opacity-80 object-cover"
                        fill
                        sizes="(max-width: 1024px) 90vw, 33vw"
                        priority
                        loading="eager"
                        quality={75}
                        onLoadingComplete={handleImageLoad}
                    // width={384}
                    // height={384}
                    />

                    <motion.div
                        className="lg:absolute inset-0 flex flex-col items-center justify-center gap-8 overflow-visible"
                        variants={fadeIn}
                        initial="hidden"
                        animate="visible">
                        <div className="flex flex-col gap-5 items-center justify-center relative overflow-visible">
                            <div className="absolute -left-24 top-0" style={{ opacity: 0.4 }}>
                                <motion.div
                                    className="relative z-10 px-3 py-1 rounded-full flex items-center gap-2 text-xs font-medium backdrop-blur-sm border border-white/20 bg-white/10"
                                    variants={fadeIn}
                                    style={{
                                        maskImage: 'linear-gradient(to right, transparent, white 50%)',
                                        WebkitMaskImage: 'linear-gradient(to right, transparent, white 50%)'
                                    }}
                                >
                                    <div className="w-3 h-3 rounded-[0.2rem]" style={{ backgroundColor: tokens[0].color }} />
                                    <p className="text-white">{tokens[0].name}</p>
                                </motion.div>
                            </div>
                            <Switch color={`hsla(${value}, 100%, 50%)`} />

                            <div className="relative">
                                <div className="absolute -right-32 top-2" style={{ opacity: 0.4 }}>
                                    <motion.div
                                        className="px-3 py-1 rounded-full flex items-center gap-2 text-xs font-medium backdrop-blur-sm border border-white/20 bg-white/10"
                                        variants={fadeIn}
                                        style={{
                                            maskImage: 'linear-gradient(to left, transparent, white 100%)',
                                            WebkitMaskImage: 'linear-gradient(to left, transparent, white 100%)'
                                        }}
                                    >
                                        <div className="w-3 h-3 rounded-[0.2rem]" style={{ backgroundColor: tokens[1].color }} />
                                        <p className="text-white">{tokens[1].name}</p>
                                    </motion.div>
                                </div>
                                <div className="absolute -left-[9rem] bottom-3" style={{ opacity: 0.4 }}>
                                    <motion.div
                                        className="px-3 py-1 rounded-full flex items-center gap-2 text-xs font-medium backdrop-blur-sm border border-white/20 bg-white/10"
                                        variants={fadeIn}
                                        style={{
                                            maskImage: 'linear-gradient(to right, transparent, white 50%)',
                                            WebkitMaskImage: 'linear-gradient(to right, transparent, white 50%)'
                                        }}
                                    >
                                        <div className="w-3 h-3 rounded-[0.2rem]" style={{ backgroundColor: tokens[2].color }} />
                                        <p className="text-white">{tokens[2].name}</p>
                                    </motion.div>
                                </div>
                                <MiniPricingBox color={`hsla(${value}, 100%, 50%)`} title="Basic" features={[
                                    "Custom themes",
                                    "High-quality",
                                ]} />
                            </div>
                        </div>

                        <div className="relative w-full flex flex-col items-center justify-center">
                            <Slider defaultValue={value} label="Hue" onValueChange={(value) => setValue(value)} />
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
}

export default Hero;
