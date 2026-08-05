'use client'
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/Elements';
import { GradientSpot } from '@/components/Common';
import { getAllPlans } from '@/lib/api';
import TextSwitcher from '@/components/Elements/TextSwitcher';
import { Volume2, VolumeX } from 'lucide-react';
import { baseUrl } from '@/constains';
import CouponCard from './CouponCard';
import ProductCard from '@/components/Product/Card';
import PublicCard from '@/components/Product/PublicCard';

const FeatureCard = React.memo(({ title, description, icon, colors }) => {
    return (
        <motion.div
            className="relative 
            bg-black 
            p-6 
            rounded-3xl 
            shadow-lg 
            overflow-hidden 
            border border-gray-800 
            cursor-pointer
            
            "
            style={{ border: '1px solid rgba(255,255,255,0.1)' }}
            whileHover={{ opacity: 0.95 }}
            transition={{ type: 'spring', stiffness: 300 }}
        >
            <div className="absolute top-0 left-0 w-[50%] h-[50%] rounded-tl-3xl overflow-hidden opacity-10">
                <div
                    className="absolute top-0 left-0 w-full h-[2px]"
                    style={{
                        background: `linear-gradient(90deg, ${colors[0]} 0%, transparent 100%)`,
                    }}
                />
                <div
                    className="absolute top-0 left-0 w-[2px] h-full"
                    style={{
                        background: `linear-gradient(180deg, ${colors[0]} 0%, transparent 100%)`,
                    }}
                />
                <div
                    className="absolute top-0 left-0 w-6 h-6 rounded-tl-3xl"
                    style={{
                        borderLeft: `2px solid ${colors[0]}`,
                        borderTop: `2px solid ${colors[0]}`,
                    }}
                />
            </div>
            <GradientSpot color={colors[0]} size={100} position={{ x: '0%', y: '-10%' }} />
            <GradientSpot color={colors[1]} size={180} position={{ x: '0%', y: '10%' }} />
            <div className="relative z-10">
                <div className="text-3xl mb-4">{icon}</div>
                <h3 className="text-xl font-semibold text-gray-200 mb-2">{title}</h3>
                <p className="text-gray-400">{description}</p>
            </div>
        </motion.div>
    );
});
FeatureCard.displayName = 'FeatureCard';

const VideoPlayer = React.memo(() => {
    const [isLoading, setIsLoading] = useState(true);
    const [isMuted, setIsMuted] = useState(true);
    const [isVisible, setIsVisible] = useState(false);
    const videoRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsVisible(entry.isIntersecting);
            },
            {
                root: null,
                rootMargin: '100px', // Start loading 100px before it comes into view
                threshold: 0
            }
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, []);

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !videoRef.current.muted;
            setIsMuted(!isMuted);
        }
    };

    const handleLoadStart = () => {
        setIsLoading(true);
    };

    const handleCanPlay = () => {
        setIsLoading(false);
        if (videoRef.current) {
            videoRef.current.play().catch(() => {
                // Autoplay failed, which is fine
            });
        }
    };

    return (
        <div
            ref={containerRef}
            className="relative w-full max-w-4xl mx-auto aspect-video rounded-3xl overflow-hidden bg-black/50 backdrop-blur-sm group"
        >
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                </div>
            )}
            {isVisible && (
                <video
                    ref={videoRef}
                    className="w-full h-full object-cover rounded-2xl"
                    src="https://cdn.compify.app/demo-thing.mp4"
                    autoPlay
                    loop
                    muted={isMuted}
                    playsInline
                    onLoadStart={handleLoadStart}
                    onCanPlay={handleCanPlay}
                />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />

            <button
                onClick={toggleMute}
                name="mute"
                aria-label="Mute Video"
                title="Mute Video"
                type="button"
                className="absolute bottom-4 right-4 p-2 rounded-full bg-black/40 backdrop-blur-sm 
                         text-white hover:bg-black/60 transition-all duration-200 
                         opacity-0 group-hover:opacity-100 hover:scale-110"
            >
                {isMuted ? (
                    <VolumeX className="w-5 h-5" />
                ) : (
                    <Volume2 className="w-5 h-5" />
                )}
            </button>
        </div>
    );
});
VideoPlayer.displayName = 'VideoPlayer';

const AnimatedPrice = React.memo(({ value }) => {
    const [displayValue, setDisplayValue] = useState(Math.round(value));

    useEffect(() => {
        const startValue = displayValue;
        const endValue = Math.round(value);
        const duration = 500; // animation duration in ms
        const startTime = Date.now();

        const animate = () => {
            const now = Date.now();
            const progress = Math.min((now - startTime) / duration, 1);

            // Easing function for smooth animation
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);

            const currentValue = Math.round(startValue + (endValue - startValue) * easeOutQuart);
            setDisplayValue(currentValue);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }, [value, displayValue]);

    return (
        <span className="text-4xl font-bold text-white">
            ${displayValue}
        </span>
    );
});
AnimatedPrice.displayName = 'AnimatedPrice';

export const PricingCard = React.memo(({ name, price, features, bestFor, colors, period = 'month', promoData, current, buttonText = 'Choose Plan', onClick }) => {
    const router = useRouter();
    const borderMap = {
        'MOST POPULAR': 'rgb(255, 165, 0)',
        'BEST VALUE': 'rgb(168, 85, 247)',
    }
    const bestForColor = {
        'MOST POPULAR': 'bg-orange-500',
        'BEST VALUE': 'bg-purple-500',
    }

    // Breathing animation variants
    const breathingAnimation = {
        initial: { x: 'calc(100% - 145px)' },
        animate: {
            x: ['calc(100% - 145px)', 'calc(100% - 160px)', 'calc(100% - 145px)'],
            transition: {
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
                times: [0, 0.5, 1]
            }
        },
        expanded: {
            left: '50%',
            x: '-50%',
            transition: {
                type: 'spring',
                stiffness: 150,
                damping: 30,
                mass: 1.2
            }
        }
    };

    const [isExpanded, setIsExpanded] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const couponRef = useRef(null);

    const handleCouponInteraction = () => {
        setIsExpanded(prev => !prev);
    };

    // Close when clicking outside
    useEffect(() => {
        if (!isExpanded) return;

        const handleClickOutside = (e) => {
            if (couponRef.current && !couponRef.current.contains(e.target)) {
                setIsExpanded(false);
            }
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
            className={`
                relative bg-black p-8 rounded-3xl shadow-2xl overflow-hidden w-full min-w-[320px]
                border border-white/5
                after:absolute after:content-[''] 
                after:w-[200px] after:h-[200px]
                after:top-[-100px] after:left-[-100px]
                after:bg-purple-500/20
                after:blur-[100px]
                after:rounded-full
                after:pointer-events-none
                group
            `}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileHover={{
                opacity: 0.95,
                boxShadow: "0px 10px 20px rgba(0, 0, 0, 0.4)",
                transition: { duration: 0.3 }
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
            {promoData && (
                <motion.div
                    ref={couponRef}
                    className="absolute top-20 z-20"
                    variants={breathingAnimation}
                    initial="initial"
                    animate={isExpanded || isHovered ? "expanded" : "animate"}
                    onHoverStart={() => setIsHovered(true)}
                    onHoverEnd={() => setIsHovered(false)}
                >
                    <motion.div
                        whileTap={{ scale: 0.98 }}
                        onClick={handleCouponInteraction}
                        className="transform-gpu will-change-transform cursor-pointer touch-manipulation select-none p-2"
                    >
                        <CouponCard
                            text={promoData.text}
                            value={promoData.value}
                            bottomText={promoData.bottomText}
                        />
                    </motion.div>
                </motion.div>
            )}

            <div className="absolute top-0 left-0 w-[50%] h-[50%] rounded-tl-3xl overflow-hidden">
                <div
                    className="absolute top-0 left-0 w-full h-[2px]"
                    style={{
                        background: `linear-gradient(90deg, ${colors[0]} 0%, transparent 100%)`,
                    }}
                />
                <div
                    className="absolute top-0 left-0 w-[2px] h-full"
                    style={{
                        background: `linear-gradient(180deg, ${colors[0]} 0%, transparent 100%)`,
                    }}
                />
                <div
                    className="absolute top-0 left-0 w-6 h-6 rounded-tl-[1.55rem]"
                    style={{
                        borderLeft: `2px solid ${colors[0]}`,
                        borderTop: `2px solid ${colors[0]}`,
                    }}
                />
            </div>

            <GradientSpot color={colors[0]} size={200} position={{ x: '-20%', y: '-20%' }} />
            <GradientSpot color={colors[1]} size={150} position={{ x: '10%', y: '70%' }} opacity={0.5} />

            <motion.div className="relative z-10">
                {bestFor && (
                    <span className={`${bestForColor[bestFor]} text-white text-xs font-bold py-1 px-3 rounded-full absolute top-0 right-0 transform translate-x-2 -translate-y-2`}>
                        {bestFor}
                    </span>
                )}
                <h3 className="text-2xl font-bold text-white mb-4">{name}</h3>
                <div className="relative mb-6">
                    {price > 0 ? (
                        <div>
                            <AnimatedPrice value={parseFloat(price)} />
                            <span className="text-gray-400">/{period}</span>
                        </div>
                    ) : (
                        <span className="text-white text-4xl font-bold"></span>
                    )}
                </div>

                <ul className="mb-8 space-y-2">
                    {features.map((feature, index) => (
                        <li key={index} className="flex items-center text-gray-300">
                            <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                            {feature}
                        </li>
                    ))}
                </ul>
                <Button
                    text={current ? "Current Plan" : buttonText}
                    variant="full"
                    onClick={onClick}
                    disabled={current}
                    showIcon={!current}
                />
            </motion.div>
        </motion.div>
    );
});
PricingCard.displayName = 'PricingCard';

const FeaturedSection = React.memo(() => (
    <motion.section
        className="py-32 relative"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
    >
        <div className="max-w-7xl mx-auto px-6">
            <motion.div
                className="text-center mb-16"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
            >
                <div className="flex items-center justify-center gap-3">
                    <div className="h-px w-12 bg-gradient-to-r from-transparent via-purple-500 to-transparent" />
                    <span className="text-gray-400 text-sm tracking-wider">FEATURED ON</span>
                    <div className="h-px w-12 bg-gradient-to-r from-transparent via-purple-500 to-transparent" />
                </div>
            </motion.div>

            <motion.div
                className="grid grid-cols-5 gap-8"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
            >
                {[
                    { name: 'Product Hunt', logo: '', href: 'https://www.producthunt.com' },
                    { name: 'Hacker News', logo: '', href: 'https://news.ycombinator.com' },
                    { name: 'Reddit', logo: '', href: 'https://www.reddit.com' },
                    {
                        name: 'SaaSHub',
                        logo: 'https://cdn-b.saashub.com/img/badges/approved-dark.png?v=1',
                        href: 'https://www.saashub.com/compify-app?utm_source=badge&utm_campaign=badge&utm_content=compify-app&badge_variant=dark&badge_kind=approved',
                        maxWidth: 150
                    },
                    { name: '𝕏', logo: '', href: 'https://x.com' }
                ].map((platform, index) => (
                    <motion.a
                        key={platform.name}
                        href={platform.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center group"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                    >
                        {platform.logo ? <img
                            src={platform.logo}
                            alt={`${platform.name} badge`}
                            className="opacity-60 group-hover:opacity-100 transition-all duration-300"
                            style={{ maxWidth: platform.maxWidth || 32 }}
                        /> : <div className="w-12 h-12 rounded-full flex items-center justify-center">
                            <span className="text-gray-400 text-2xl font-bold">{platform.name}</span>
                        </div>}
                    </motion.a>
                ))}
            </motion.div>
        </div>
    </motion.section>
));
FeaturedSection.displayName = 'FeaturedSection';

const Sections = ({ featureColors = [
    ['#FF6B6B', '#4ECDC4'],
    ['#6A0572', '#AB83A1'],
    ['#40E0D0', '#FF8C00']
], pricingPlans, topComponents = [] }) => {
    const router = useRouter();
    const [period, setPeriod] = useState('monthly');
    const currentPlans = pricingPlans?.[period] || [];
    const [isActive, setIsActive] = useState(false);

    const decodeEmail = () => {
        const encoded = '115,117,112,112,111,114,116,64,99,111,109,112,105,102,121,46,97,112,112';
        return encoded.split(',').map(char => String.fromCharCode(parseInt(char))).join('');
    };

    const handleContactClick = (e) => {
        e.preventDefault();
        window.location.href = `mailto:${decodeEmail()}`;
    };

    const handlePlanClick = (plan) => {
        localStorage.setItem('afterLoginForwardLink', `${window.location.origin}/profile?plans=true`);
        router.push('/register');
    }
    return (
        <div className="bg-black min-h-screen text-white w-full">
            <section className="py-20 relative" id="features">

                <h2 className="text-3xl font-bold text-center mb-12">Build, publish, install</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 w-full">
                    <FeatureCard
                        icon="🚀"
                        title="Live editor"
                        description="Write React with Tailwind, framer-motion or Three.js and see it render as you type."
                        colors={featureColors[0] || []}
                    />
                    <FeatureCard
                        icon="🧠"
                        title="Your own registry"
                        description="Every publish gets a permanent @you/name address you can install from any project."
                        colors={featureColors[1] || []}
                    />
                    <FeatureCard
                        icon="🧩"
                        title="Installs everywhere"
                        description="shadcn CLI, compify CLI, or your coding agent over MCP — same component, any workflow."
                        colors={featureColors[2] || []}
                    />


                </div>
                {/* <GradientSpot color="#4A00E0" size={400} position={{ x: '10%', y: '0%' }} /> */}
            </section>

            {/* <FeaturedSection /> */}

            <section className="py-20 relative overflow-hidden" id="demo">

                <div className="relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-white mb-4">
                            Perfect Components in Minutes
                        </h2>
                        <p className="text-lg text-gray-400">
                            Watch how our playground eliminates 40% of development time wasted

                        </p>
                    </div>
                    <VideoPlayer />
                </div>
            </section>

            <section className="py-20 relative" id="pricing">
                <GradientSpot color="#00B4DB80" size={300} position={{ x: '10%', y: '0%' }} />

                <div className="relative z-10">
                    <div className="text-center mb-10">
                        <h2 className="text-5xl font-bold text-white mb-4">
                            Priced For Growth
                        </h2>
                        <p className="text-lg text-gray-400 mb-4">
                            Free to create. Power to scale. Built for you.
                        </p>
                    </div>
                    {/* <div className="flex justify-center mb-8">
                        <TextSwitcher options={['monthly', 'annually']} value={period} onChange={setPeriod} />
                    </div> */}
                    <div className="mx-auto flex flex-col md:flex-row justify-center mb-8 w-full max-w-[900px] gap-6">
                        <AnimatePresence>
                            {currentPlans.map((plan, index) => (
                                <PricingCard
                                    key={plan.name}
                                    name={plan.name}
                                    price={plan.price}
                                    features={plan.features}
                                    bestFor={plan.bestFor}
                                    colors={plan.colors || []}
                                    buttonText={plan.bestFor ? "Get Started" : "Choose Plan"}
                                    onClick={handlePlanClick}
                                    promoData={plan?.promoData}
                                />
                            ))}
                        </AnimatePresence>

                    </div>
                    <p className="text-gray-400 w-full mt-8 text-right ">
                        Need more? <a href="#" onClick={handleContactClick} className="text-purple-500">Contact us</a>
                    </p>
                </div>
            </section>
            <section className="py-20 relative" id="components">


                <div className="relative z-10">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold text-white mb-4">
                            Components Gallery
                        </h2>
                        <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                            Explore a selection of our top-rated, ready-to-use components
                        </p>
                    </div>

                    <div className="relative">
                        {/* Components Grid */}
                        {/* Mobile view - limited to 2 components */}
                        <div className="md:hidden columns-1 gap-6 mb-8">
                            {(topComponents || []).slice(0, 2).map((component) => (
                                <div key={component.id} className="break-inside-avoid-column mb-6 h-fit">
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: Math.random() * 0.3 }}
                                        viewport={{ once: true }}
                                    >
                                        <PublicCard
                                            id={component.id}
                                            name={component.name}
                                            imageUploaded={component.imageUploaded}
                                            language={component.language}
                                            upvotes={component.upvotes}
                                            upvoteDefaultStatus={false}
                                            onCopy={() => { }}
                                            viewOnly={true}
                                            publicImage={true}
                                        />
                                    </motion.div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop view - all components */}
                        <div className="hidden md:block columns-2 lg:columns-3 gap-6 mb-8">
                            {(topComponents || []).map((component) => (
                                <div key={component.id} className="break-inside-avoid-column mb-6 h-fit">
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: Math.random() * 0.3 }}
                                        viewport={{ once: true }}
                                    >
                                        <PublicCard
                                            id={component.id}
                                            name={component.name}
                                            imageUploaded={component.imageUploaded}
                                            language={component.language}
                                            upvotes={component.upvotes}
                                            upvoteDefaultStatus={false}
                                            onCopy={() => { }}
                                            viewOnly={true}
                                        />
                                    </motion.div>
                                </div>
                            ))}
                        </div>

                        {/* Black Gradient Overlay - NO BLUR */}
                        <div
                            className="absolute inset-0 pointer-events-none z-10"
                            style={{
                                background: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.9) 70%, rgba(0,0,0,1) 100%)',
                                backdropFilter: 'none',
                                WebkitBackdropFilter: 'none'
                            }}
                        ></div>

                        {/* CTA Button */}
                        {/* <GradientSpot color="#8E2DE2" size={250} position={{ x: '50%', y: '50%' }} /> */}
                        <div className="relative z-20 text-center flex flex-col items-center justify-center mt-[-220px]">
                            <h2 className="text-3xl font-bold mb-6">Start your own library</h2>
                            <p className="text-xl mb-8 max-w-2xl mx-auto text-gray-400">
                                Browse the catalog, publish your first component, and install it
                                anywhere — free.
                            </p>
                            <div className="flex items-center gap-4">
                                <Button text="Start free" variant="full" onClick={() => router.push('/register')} />
                                <Button text="Browse all components" variant="outline" onClick={() => router.push('/search')} />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-20 relative" id="get-started">

            </section>
        </div >
    );
};

export default React.memo(Sections);