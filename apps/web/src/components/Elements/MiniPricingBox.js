import React from 'react'
import { motion } from 'framer-motion'

function MiniPricingBox({ color, title, price, features }) {
    const hslColor = color.match(/\d+/g).map(Number);
    const accentColor = `hsla(${hslColor[0]}, ${hslColor[1]}%, ${hslColor[2]}%, 0.7)`;
    const glowColor = `hsla(${hslColor[0]}, ${hslColor[1]}%, ${Math.min(hslColor[2] + 20, 100)}%, 0.6)`;

    return (
        <div
            className="w-48 h-64 rounded-lg overflow-hidden shadow-lg relative transform hover:scale-[1.03] transition-transform duration-300"
            style={{ boxShadow: `0 0 15px ${glowColor}` }}
        >
            {/* Gradient background - using CSS gradients for better performance */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black"></div>

            {/* Content */}
            <div className="relative p-4 flex flex-col h-full z-10">
                <h3 className="text-lg font-bold mb-2 text-white">{title}</h3>
                <p className="text-2xl font-extrabold mb-3 text-white">
                    ${price}<span className="text-xs font-normal text-gray-400">/mo</span>
                </p>
                <ul className="mb-4 flex-grow text-sm">
                    {features.slice(0, 2).map((feature, index) => (
                        <li key={index} className="flex items-center mb-1 text-gray-300">
                            <svg
                                className="w-4 h-4 mr-2"
                                viewBox="0 0 20 20"
                                style={{ fill: accentColor }}
                            >
                                <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
                            </svg>
                            {feature}
                        </li>
                    ))}
                </ul>
                <button
                    className="w-full py-1.5 rounded-full text-white text-sm font-semibold transform hover:scale-105 active:scale-95 transition-transform duration-150"
                    style={{ backgroundColor: accentColor }}
                >
                    Choose
                </button>
            </div>
        </div>
    )
}

export default MiniPricingBox