const Tab = ({ children, isActive, onClick }) => (
    <button
        className={`
            px-4 py-2 
            font-semibold 
            relative 
            transition-colors duration-200
            ${isActive ? "text-blue-600" : "text-gray-500 hover:text-blue-600"}
        `}
        onClick={onClick}
    >
        {children}
        <div
            className={`
                absolute 
                bottom-0 
                left-0 
                w-full 
                h-0.5 
                transform 
                transition-all 
                duration-200 
                ease-out
                ${isActive ? "bg-blue-600 scale-x-100" : "bg-transparent scale-x-0"}
            `}
        />
    </button>
);

export default Tab;
