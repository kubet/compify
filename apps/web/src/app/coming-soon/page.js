'use client'
import { motion } from 'framer-motion';
import { GradientSpot } from '@/components/Common';

export default function ComingSoonPage() {
    return (
        <div className="relative flex h-[calc(100vh-72px)] flex-col items-center justify-center px-4 mx-auto w-full max-w-7xl sm:overflow-visible overflow-hidden">
            <GradientSpot color="#0066ff" size={500} position={{ x: '25%', y: '0%' }} opacity={0.15} />

            <motion.div
                className="flex flex-col items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                <div className="relative">
                    <h1
                        className="text-[8rem] xs:text-[10rem] sm:text-[12rem] md:text-[16rem] font-black"
                        style={{
                            color: 'rgba(255,255,255,0.05)',
                            position: 'relative',
                            lineHeight: '1',
                        }}
                    >SOON</h1>
                    <h1
                        className="text-[8rem] xs:text-[10rem] sm:text-[12rem] md:text-[16rem] font-black absolute inset-0"
                        style={{
                            background: 'linear-gradient(180deg, rgba(227,227,227,1) 0%, rgba(227,227,227,0.03) 100%)',
                            backgroundSize: '100% 100%',
                            WebkitBackgroundClip: 'text',
                            color: 'black',
                            WebkitTextStroke: '3px transparent',
                            mixBlendMode: 'difference',
                            opacity: 0.25,
                            lineHeight: '1',
                        }}
                    >SOON</h1>
                </div>

                <div className="absolute z-10 top-[52%] sm:top-[55%] text-center px-4 sm:px-6">
                    <h2 className="text-2xl xs:text-3xl sm:text-4xl md:text-6xl bg-gradient-to-r from-gray-300 via-gray-500 to-gray-700 bg-clip-text text-transparent font-bold mb-4 sm:mb-6 leading-normal sm:leading-[5rem]">
                        Something Epic is Coming
                    </h2>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="max-w-2xl mx-auto text-center"
                    >
                        <p className="text-base xs:text-lg sm:text-xl text-gray-400 mb-6 sm:mb-8 px-2">
                            We&apos;re building the future of component design. A place where creativity meets code, empowering you to create stunning web experiences.
                        </p>
                        <motion.a
                            href="/"
                            className="text-base xs:text-lg text-blue-400 hover:text-blue-300 transition-colors duration-300"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            ← Return to Homepage
                        </motion.a>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
} 