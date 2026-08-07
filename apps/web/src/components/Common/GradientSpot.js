'use client'
import React from 'react';

export const GradientSpot = React.memo(({ color, size, position }) => (
    <div
        className="absolute rounded-full mix-blend-screen will-change-transform opacity-30"
        style={{
            backgroundColor: color,
            width: size,
            height: size,
            left: position.x,
            top: position.y,
            filter: `blur(${size / 3}px)`,
            pointerEvents: 'none',
            backfaceVisibility: 'hidden',
            transform: 'translate3d(0, 0, 0)', // Force GPU acceleration
            WebkitTransform: 'translate3d(0, 0, 0)', // Safari specific
            perspective: 1000,
            WebkitPerspective: 1000,
            transformStyle: 'preserve-3d',
            WebkitTransformStyle: 'preserve-3d'
        }}
    />
));

GradientSpot.displayName = 'GradientSpot';