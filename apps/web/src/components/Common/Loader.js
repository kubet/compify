import React from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'

function LoaderCube({ size = 24, color = 'white' }) {
    return (
        <div className="relative flex items-center justify-center">
            <motion.div
                className={`absolute rounded-full blur-lg`}
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.7, 0.3],
                }}
                style={{ width: `${size / 3}rem`, height: `${size / 3}rem`, backgroundColor: color }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />
            <Image
                src="/the-cube.webp"
                alt="Loading Cube"
                className="relative"
                width={size * 16}
                height={size * 16}
                priority
            />
        </div>
    )
}

export default LoaderCube
