import { ChevronDown } from "lucide-react";

const Select = ({ value, onChange, options }) => (
    <div className="relative inline-block w-48">
        <select
            value={value}
            onChange={onChange}
            className="appearance-none w-full bg-gray-800 border border-gray-700 text-white py-2 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-gray-700 focus:border-gray-500"
        >
            {options.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white">
            <ChevronDown size={18} />
        </div>
    </div>
);

export default Select;