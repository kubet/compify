'use client'

import { GradientSpot } from "@/components/Common";

const EarningsCard = ({ earnings, percentChange, rank, projects, projectsThisMonth }) => {
    const spots = [
        { color: '#4A00E0', size: 150, position: { x: '10%', y: '20%' } },
        { color: '#8E2DE2', size: 100, position: { x: '80%', y: '50%' } },
        { color: '#00B4DB', size: 120, position: { x: '30%', y: '70%' } },
    ];

    return (
        <div className="relative bg-black p-6 rounded-2xl shadow-lg max-w-sm overflow-hidden border border-gray-800" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
            {spots.map((spot, index) => (
                <GradientSpot key={index} {...spot} />
            ))}
            <div className="relative z-10">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-200">Earnings</h2>
                    <button className="text-gray-400 hover:text-gray-200">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                    </button>
                </div>
                <div className="mb-6">
                    <h3 className="text-4xl font-bold text-white mb-2">${earnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                    <p className={`text-sm ${percentChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {percentChange >= 0 ? '+' : ''}{percentChange}% since last month
                    </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-800 bg-opacity-50 p-3 rounded-xl">
                        <p className="text-2xl font-semibold text-white">{rank}</p>
                        <p className="text-xs text-gray-400">Rank</p>
                        <p className="text-xs text-gray-500">In top {Math.round(rank / 100 * 16)}%</p>
                    </div>
                    <div className="bg-gray-800 bg-opacity-50 p-3 rounded-xl">
                        <p className="text-2xl font-semibold text-white">{projects}</p>
                        <p className="text-xs text-gray-400">Projects</p>
                        <p className="text-xs text-gray-500">{projectsThisMonth} this month</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EarningsCard;