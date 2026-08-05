import React from 'react';

const ShimmerText = ({ text = "Shimmering Text" }) => {
    return (
        <div className="relative">
            <span
                className="bg-clip-text text-sm text-transparent bg-[200%_auto] animate-shimmer bg-gradient-to-r from-gray-600 via-gray-400 to-slate-600"
                style={{
                    animation: 'shimmer 2s linear infinite',
                    backgroundSize: '200% auto',
                }}
            >
                {text}
            </span>

            <style jsx>{`
        @keyframes shimmer {
          to {
            background-position: -200% center;
          }
        }
      `}</style>
        </div>
    );
};

export default ShimmerText;