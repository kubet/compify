/* eslint-disable @next/next/no-img-element */
'use client'
import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/Elements';
import { GradientSpot } from '@/components/Common';
import TextSwitcher from '@/components/Elements/TextSwitcher';
import PricingCard from '@/components/Payment/PricingCard';
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
    const [isVisible, setIsVisible] = useState(false);
    const shouldReduceMotion = useReducedMotion();
    const videoRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => setIsVisible(entry.isIntersecting),
            { rootMargin: '100px', threshold: 0 },
        );
        const container = containerRef.current;
        if (container) observer.observe(container);
        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={containerRef}
            className="group relative mx-auto aspect-video w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]"
        >
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center" aria-label="Loading video">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-500 border-t-transparent motion-reduce:animate-none" />
                </div>
            )}
            <p id="editor-recording-description" className="sr-only">
                Silent recording of the optional browser theme editor; it is not the Storybook handoff workflow.
            </p>
            {isVisible && (
                <video
                    ref={videoRef}
                    aria-describedby="editor-recording-description"
                    className="h-full w-full rounded-2xl object-cover"
                    src="/demo-video.mp4"
                    poster="/og-image.png"
                    autoPlay={!shouldReduceMotion}
                    loop={!shouldReduceMotion}
                    muted
                    controls
                    playsInline
                    preload="metadata"
                    onLoadStart={() => setIsLoading(true)}
                    onCanPlay={() => {
                        setIsLoading(false);
                        if (!shouldReduceMotion) videoRef.current?.play().catch(() => {});
                    }}
                >
                    Your browser does not support the video element. The optional legacy editor is documented above.
                </video>
            )}
        </div>
    );
});
VideoPlayer.displayName = 'VideoPlayer';

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
        localStorage.setItem('afterLoginForwardLink', '/profile?plans=true');
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
                                <Button text="Start free" variant="full" href="/register" />
                                <Button text="Browse all components" variant="outline" href="/search" />
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
