import React from 'react';

function LabelButton({ onClick, children, variant = 'danger', Icon, isDisabled = false, className }) {
    const colorClasses = {
        danger: 'text-red-500',
        warning: 'text-yellow-500',
        success: 'text-green-500',
        info: 'text-blue-500',
        neutral: 'text-gray-500',
        primary: 'text-purple-500'
    };

    return (
        <button
            onClick={onClick}
            disabled={isDisabled}
            className={`${colorClasses[variant]} w-fit hover:underline flex items-center gap-2 ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
        >
            {Icon && <Icon size={16} />}
            {children}
        </button>
    );
}

export default LabelButton;
