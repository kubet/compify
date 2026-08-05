import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const GlowingOutline = ({
    children,
    play = true,
    glowColor = "rainbow",
    glowIntensity = 10,
    glowDistance = 3,
    animationDuration = 3,
    animationDelay = 2,
    glowWidth = 10
}) => {
    const containerRef = useRef(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0, borderRadius: '0px' });

    useEffect(() => {
        if (!containerRef.current) return;

        const resizeObserver = new ResizeObserver((entries) => {
            const child = containerRef.current?.children[1];
            if (!child) return;

            const style = window.getComputedStyle(child);
            const rect = child.getBoundingClientRect();
            setDimensions({
                width: rect.width,
                height: rect.height,
                borderRadius: style.borderRadius
            });
        });

        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    const createFlowPath = (width, height, radius) => {
        const w = width + glowDistance * 2;
        const h = height + glowDistance * 2;
        const r = parseInt(radius) + glowDistance;
        return `
      M${r},0 
      H${w - r} 
      C${w},0 ${w},0 ${w},${r} 
      V${h - r} 
      C${w},${h} ${w},${h} ${w - r},${h} 
      H${r} 
      C0,${h} 0,${h} 0,${h - r} 
      V${r} 
      C0,0 0,0 ${r},0
    `;
    };

    const gradientDefs = {
        rainbow: (
            <linearGradient id="glowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                {[
                    ['#ff9ff3', 0], ['#feca57', 20],
                    ['#48dbfb', 40],
                    ['#ff6b6b', 60],
                    ['#5f27cd', 80],
                    ['#ff9ff3', 100]
                ].map(([color, offset]) => (
                    <stop key={offset} offset={`${offset}%`} stopColor={color}>
                        <animate
                            attributeName="offset"
                            values={`${offset / 100};${(offset + 100) / 100};${offset / 100}`}
                            dur="5s"
                            repeatCount="indefinite"
                        />
                    </stop>
                ))}
            </linearGradient>
        ),
        solid: (
            <linearGradient id="glowGradient">
                <stop offset="100%" stopColor={glowColor} />
            </linearGradient>
        )
    };

    return (
        <div ref={containerRef} className="relative inline-block">
            {play && (
                <svg
                    width={dimensions.width + glowDistance * 2}
                    height={dimensions.height + glowDistance * 2}
                    viewBox={`0 0 ${dimensions.width + glowDistance * 2} ${dimensions.height + glowDistance * 2}`}
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ filter: `blur(${glowIntensity}px)`, zIndex: -1 }}
                >
                    <defs>
                        {glowColor === "rainbow" ? gradientDefs.rainbow : gradientDefs.solid}
                    </defs>
                    <motion.path
                        d={createFlowPath(dimensions.width, dimensions.height, dimensions.borderRadius)}
                        stroke="url(#glowGradient)"
                        strokeWidth={glowWidth}
                        fill="none"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{
                            pathLength: play ? [0, 1, 1] : 0,
                            opacity: play ? [0, 1, 0] : 0
                        }}
                        transition={{
                            duration: animationDuration,
                            times: [0, 0.6, 1],
                            repeat: Infinity,
                            repeatDelay: animationDelay
                        }}
                    />
                </svg>
            )}
            <motion.div
                className="relative w-full h-full"
                style={{ borderRadius: dimensions.borderRadius }}
            >
                {children}
            </motion.div>
        </div>
    );
};

export default GlowingOutline;