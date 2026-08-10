'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/Elements';
import { GradientSpot } from '@/components/Common';
import CouponCard from '@/components/LandingSections/Sections/CouponCard';

const AnimatedPrice = React.memo(({ value }) => {
    const roundedValue = Math.round(value);
    const [displayValue, setDisplayValue] = useState(roundedValue);
    const displayValueRef = useRef(roundedValue);
    const shouldReduceMotion = useReducedMotion();

    useEffect(() => {
        const endValue = Math.round(value);
        if (shouldReduceMotion) {
            displayValueRef.current = endValue;
            setDisplayValue(endValue);
            return undefined;
        }
        const startValue = displayValueRef.current;
        const duration = 500;
        const startTime = Date.now();
        let frameId;

        const animate = () => {
            const progress = Math.min((Date.now() - startTime) / duration, 1);
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const nextValue = Math.round(startValue + (endValue - startValue) * easeOutQuart);
            displayValueRef.current = nextValue;
            setDisplayValue(nextValue);
            if (progress < 1) frameId = requestAnimationFrame(animate);
        };

        frameId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frameId);
    }, [value, shouldReduceMotion]);

    return <span className="text-4xl font-bold text-white">${displayValue}</span>;
});
AnimatedPrice.displayName = 'AnimatedPrice';

const PricingCard = React.memo(({
    name,
    price,
    features,
    bestFor,
    colors,
    period = 'month',
    promoData,
    current,
    buttonText = 'Choose Plan',
    onClick,
}) => {
    const bestForColor = {
        'MOST POPULAR': 'bg-orange-500',
        'BEST VALUE': 'bg-purple-500',
    };
    const breathingAnimation = {
        initial: { x: 'calc(100% - 145px)' },
        animate: {
            x: ['calc(100% - 145px)', 'calc(100% - 160px)', 'calc(100% - 145px)'],
            transition: { duration: 3, repeat: Infinity, ease: 'easeInOut', times: [0, 0.5, 1] },
        },
        expanded: {
            left: '50%',
            x: '-50%',
            transition: { type: 'spring', stiffness: 150, damping: 30, mass: 1.2 },
        },
    };
    const [isExpanded, setIsExpanded] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const shouldReduceMotion = useReducedMotion();
    const couponRef = useRef(null);

    useEffect(() => {
        if (!isExpanded) return;
        const handleClickOutside = (event) => {
            if (couponRef.current && !couponRef.current.contains(event.target)) setIsExpanded(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchend', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchend', handleClickOutside);
        };
    }, [isExpanded]);

    return (
        <motion.div
            layout
            layoutId={`pricing-card-${name}`}
            className="group relative w-full min-w-[320px] overflow-hidden rounded-3xl border border-white/5 bg-black p-8 shadow-2xl after:pointer-events-none after:absolute after:left-[-100px] after:top-[-100px] after:h-[200px] after:w-[200px] after:rounded-full after:bg-purple-500/20 after:blur-[100px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileHover={{ opacity: 0.95, boxShadow: '0px 10px 20px rgba(0, 0, 0, 0.4)', transition: { duration: 0.3 } }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
            {promoData && (
                <motion.div
                    ref={couponRef}
                    className="absolute top-20 z-20"
                    variants={breathingAnimation}
                    initial="initial"
                    animate={isExpanded || isHovered ? 'expanded' : shouldReduceMotion ? 'initial' : 'animate'}
                    onHoverStart={() => setIsHovered(true)}
                    onHoverEnd={() => setIsHovered(false)}
                >
                    <motion.button
                        type="button"
                        whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                        onClick={() => setIsExpanded((value) => !value)}
                        aria-expanded={isExpanded}
                        aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${name} plan coupon`}
                        className="cursor-pointer select-none p-2 text-left will-change-transform"
                    >
                        <CouponCard text={promoData.text} value={promoData.value} bottomText={promoData.bottomText} />
                    </motion.button>
                </motion.div>
            )}

            <div className="absolute left-0 top-0 h-[50%] w-[50%] overflow-hidden rounded-tl-3xl">
                <div className="absolute left-0 top-0 h-[2px] w-full" style={{ background: `linear-gradient(90deg, ${colors[0]} 0%, transparent 100%)` }} />
                <div className="absolute left-0 top-0 h-full w-[2px]" style={{ background: `linear-gradient(180deg, ${colors[0]} 0%, transparent 100%)` }} />
                <div className="absolute left-0 top-0 h-6 w-6 rounded-tl-[1.55rem]" style={{ borderLeft: `2px solid ${colors[0]}`, borderTop: `2px solid ${colors[0]}` }} />
            </div>

            <GradientSpot color={colors[0]} size={200} position={{ x: '-20%', y: '-20%' }} />
            <GradientSpot color={colors[1]} size={150} position={{ x: '10%', y: '70%' }} opacity={0.5} />

            <motion.div className="relative z-10">
                {bestFor && (
                    <span className={`${bestForColor[bestFor]} absolute right-0 top-0 translate-x-2 -translate-y-2 rounded-full px-3 py-1 text-xs font-bold text-white`}>
                        {bestFor}
                    </span>
                )}
                <h3 className="mb-4 text-2xl font-bold text-white">{name}</h3>
                <div className="relative mb-6">
                    {price > 0 ? (
                        <div><AnimatedPrice value={parseFloat(price)} /><span className="text-gray-400">/{period}</span></div>
                    ) : (
                        <span className="text-4xl font-bold text-white" />
                    )}
                </div>
                <ul className="mb-8 space-y-2">
                    {(features || []).map((feature) => (
                        <li key={feature} className="flex items-center text-gray-300">
                            <svg className="mr-2 h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            {feature}
                        </li>
                    ))}
                </ul>
                <Button text={current ? 'Current Plan' : buttonText} variant="full" onClick={onClick} disabled={current} showIcon={!current} />
            </motion.div>
        </motion.div>
    );
});
PricingCard.displayName = 'PricingCard';

export default PricingCard;
