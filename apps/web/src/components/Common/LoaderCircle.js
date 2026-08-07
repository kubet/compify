import React from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'

function LoaderCircle({ size = 24, color = 'white' }) {
    return (
        <div className="relative flex items-center justify-center">
            <div className="relative mx-auto">
                <Image
                    src="/the-circle.webp"
                    alt="Loading Circle"
                    className="relative"
                    width={size * 16}
                    height={size * 16}
                    priority
                />
                {/* Container for masked content */}
                <div
                    className="absolute"
                    style={{
                        width: `${size * 11.1}px`,
                        height: `${size * 11.1}px`,
                        position: 'absolute',
                        top: `${(size * 16 - size * 11.1) / 2}px`,
                        left: `${(size * 16 - size * 11.1) / 2}px`,
                        borderRadius: '50%',
                        overflow: 'hidden',
                        // Reversed mask - transparent in center, visible on outside
                        maskImage: 'radial-gradient(circle at center, transparent 0%, transparent 46%, black 70%)',
                        WebkitMaskImage: 'radial-gradient(circle at center, transparent 0%, transparent 46%, black 70%)',
                    }}
                >
                    <motion.div
                        className="absolute"
                        animate={{
                            rotate: 360,
                        }}
                        style={{
                            width: '100%',
                            height: '100%',
                            background: `conic-gradient(
                                from 180deg at 50% 50%,
                                transparent 0deg,
                                transparent 150deg,
                                ${color} 180deg,
                                transparent 240deg,
                                transparent 360deg
                            )`,
                            borderRadius: '50%',
                            filter: `blur(${size / 2}px)`,
                            opacity: 0.9,
                            pointerEvents: 'none',
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "linear",
                        }}
                    />
                </div>
            </div>
        </div>
    )
}
export default LoaderCircle
