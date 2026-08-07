import { GradientSpot } from "@/components/Common";
import React from 'react'

export default function NotFound() {
    return <div className="relative flex h-[calc(100vh-72px)] flex-col items-center justify-center px-4 mx-auto w-full max-w-7xl sm:overflow-visible overflow-hidden">
        <NotFoundContent />
    </div>
}

export function NotFoundContent() {
    return <div className="flex flex-col items-center justify-center">
        <GradientSpot color="#0066ff" size={500} position={{ x: '25%', y: '0%' }} opacity={0.15} />
        <div className="relative">
            <h1
                className="text-[16rem] font-black"
                style={{
                    color: 'rgba(255,255,255,0.05)',
                    position: 'relative',
                }}
            >404</h1>
            <h1
                className="text-[16rem] font-black absolute inset-0"
                style={{
                    background: 'linear-gradient(180deg, rgba(227,227,227,1) 0%, rgba(227,227,227,0.03) 100%)',
                    backgroundSize: '100% 100%',
                    WebkitBackgroundClip: 'text',
                    color: 'black',
                    WebkitTextStroke: '3px transparent',
                    mixBlendMode: 'difference',
                    opacity: 0.25
                }}
            >404</h1>

        </div>
        <h2 className="absolute z-10 top-[55%] text-6xl bg-gradient-to-r leading-[5rem] from-gray-300 via-gray-500 to-gray-700 bg-clip-text text-transparent">Page not found</h2>
    </div>
}