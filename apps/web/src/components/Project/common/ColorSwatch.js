const ColorSwatch = ({ color, name, textColor }) => (
    <div className="flex flex-col items-center group">
        <div
            className="w-16 h-16 cursor-pointer rounded-lg shadow-md transition-all duration-300 ease-in-out transform hover:scale-110 hover:shadow-lg"
            style={{ backgroundColor: color }}
        >
            <div className="w-full h-full flex items-center justify-center bg-black bg-opacity-0 transition-all duration-300 rounded-lg">
                <span className="text-transparent font-semibold transition-all duration-300" style={{ color: textColor }}>
                    {name}
                </span>
            </div>
        </div>
        <span className="text-sm mt-2 font-medium text-gray-500">{name}</span>
    </div>
);

export default ColorSwatch;
