import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import MiniButton from './MiniButton';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';


const Dropdown = ({
    options,
    onSelect,
    placeholder = "Select an option",
    Icon = null,
    className,
    value,
    isDefaultOpen = false,
    multiSelect = false,
    MAX_VISIBLE_OPTIONS = 8
}) => {
    const [isOpen, setIsOpen] = useState(isDefaultOpen);
    const [selectedOptions, setSelectedOptions] = useState(() => {
        if (!value) return [];
        return multiSelect
            ? (Array.isArray(value) ? value : [value])
            : [value];
    });
    const [hoveredIndex, setHoveredIndex] = useState(null);
    const [isHovered, setIsHovered] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef(null);
    const inputRef = useRef(null);
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const controls = useAnimation();
    const [isClicking, setIsClicking] = useState(false);
    const [dropdownCoords, setDropdownCoords] = useState({ top: 0, left: 0, width: 0 });
    const dropdownRef = useRef(null);

    const rotateX = useTransform(mouseY, [-10, 10], [5, -5]);
    const rotateY = useTransform(mouseX, [-10, 10], [-5, 5]);

    useEffect(() => {
        const handleMouseMove = (e) => {
            const rect = containerRef.current?.getBoundingClientRect();
            if (rect) {
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                mouseX.set(x - rect.width / 2);
                mouseY.set(y - rect.height / 2);
            }
        };

        const handleClickOutside = (event) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target) &&
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };

        const container = containerRef.current;
        container?.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mousedown', handleClickOutside);

        if (isDefaultOpen && inputRef.current) {
            inputRef.current.focus();
        }

        return () => {
            container?.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [mouseX, mouseY, isDefaultOpen]);

    useEffect(() => {
        if (value === undefined || JSON.stringify(value) === JSON.stringify(selectedOptions)) return;

        const newSelected = multiSelect
            ? (Array.isArray(value) ? value : [value])
            : [value];

        setSelectedOptions(newSelected);
        setSearchTerm('');
    }, [value, multiSelect, selectedOptions]);

    useEffect(() => {
        if (isOpen && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const dropdownHeight = 120; // matches maxHeight of dropdown

            setDropdownCoords({
                top: spaceBelow < dropdownHeight ? rect.top - dropdownHeight - 8 : rect.bottom + 8,
                left: rect.left,
                width: rect.width,
            });
        }
    }, [isOpen]);

    const containerVariants = {
        rest: {
            background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
            boxShadow: '0 4px 24px -1px rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(255,255,255,0.18)',
        },
        hover: {
            background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.07) 100%)',
            boxShadow: '0 8px 32px -1px rgba(0, 0, 0, 0.2), 0 0 0 2px rgba(255,255,255,0.3)',
            border: '1px solid rgba(255,255,255,0.3)',
        },
    };

    const dropdownVariants = useMemo(() => ({
        closed: {
            height: 0,
            opacity: 0,
            transition: {
                height: { duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] },
                opacity: { duration: 0.1 }
            }
        },
        open: {
            height: 'auto',
            opacity: 1,
            transition: {
                height: { duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] },
                opacity: { duration: 0.1 }
            }
        },
    }), []);

    const optionVariants = useMemo(() => ({
        initial: { y: 20, opacity: 0 },
        animate: { y: 0, opacity: 1 },
        exit: { y: -20, opacity: 0 },
        hover: { scale: 1.02 },
    }), []);

    const iconVariants = {
        closed: { rotate: 0 },
        open: { rotate: 180 },
    };

    const handleToggle = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            inputRef.current?.focus();
        }
    };

    const handleSelect = useCallback( (option) => {
        if (multiSelect) {
            const isSelected = selectedOptions.some(item => item.value === option.value);
            let newSelected;
            if (isSelected) {
                newSelected = selectedOptions.filter(item => item.value !== option.value);
            } else {
                newSelected = [...selectedOptions, option];
            }
            setSelectedOptions(newSelected);
            onSelect(newSelected);
            setSearchTerm('');
            inputRef.current?.focus();
        } else {
            setSelectedOptions([option]);
            onSelect(option);
            setIsOpen(false);
        }
    }, [multiSelect, onSelect, selectedOptions]);

    const handleRemoveOption = (optionToRemove, e) => {
        e.stopPropagation();
        const newSelected = selectedOptions.filter(option => option.value !== optionToRemove.value);
        setSelectedOptions(newSelected);
        onSelect(newSelected);
    };

    const handleInputChange = (e) => {
        setSearchTerm(e.target.value);
        if (!isOpen) {
            setIsOpen(true);
        }
    };

    const filteredOptions = useMemo(() => {
        const filtered = searchTerm && isOpen
            ? options.filter(option =>
                option.label.toLowerCase().includes(searchTerm.toLowerCase())
            )
            : options;

        // Only return first 4 matches
        return filtered.slice(0, MAX_VISIBLE_OPTIONS);
    }, [searchTerm, isOpen, options, MAX_VISIBLE_OPTIONS]);

    const getInputHeight = () => {
        if (!multiSelect || selectedOptions.length === 0) return 'h-12';
        const rows = Math.ceil(selectedOptions.length / 3);
        return `min-h-[${Math.max(3, rows) * 1.5}rem]`;
    };

    const containerAnimationProps = useMemo(() => ({
        initial: "rest",
        animate: isHovered || isFocused ? "hover" : "rest",
        whileHover: "hover",
        whileTap: { scale: 0.97 }
    }), [isHovered, isFocused]);

    const renderDropdown = useMemo(() => (
        <motion.div
            ref={dropdownRef}
            className="fixed backdrop-blur-2xl rounded-lg shadow-2xl overflow-hidden z-50"
            variants={dropdownVariants}
            initial="closed"
            animate="open"
            exit="closed"
            style={{
                background: 'linear-gradient(135deg, rgba(20,20,20,1) 0%, rgba(30,30,30,1) 100%)',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255,255,255,0.1) inset',
                width: dropdownCoords.width,
                top: dropdownCoords.top,
                left: dropdownCoords.left,
            }}
        >
            <div className="w-full">
                {filteredOptions.map((option, index) => {
                    const isSelected = selectedOptions.some(item => item.value === option.value);

                    return (
                        <motion.div
                            key={option.value}
                            className={`w-full px-4 py-2 cursor-pointer ${isSelected ? 'bg-blue-500/20' : 'hover:bg-white/5'
                                }`}
                            style={{
                                height: '44px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}
                            onClick={() => handleSelect(option)}
                            onMouseEnter={() => setHoveredIndex(index)}
                            onMouseLeave={() => setHoveredIndex(null)}
                            variants={optionVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            whileHover="hover"
                            transition={{ duration: 0.2 }}
                        >
                            <span className="truncate">{option.label}</span>
                            {(hoveredIndex === index || isSelected) && (
                                <motion.svg
                                    className="w-5 h-5 text-blue-400 flex-shrink-0 ml-2"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                    />
                                </motion.svg>
                            )}
                        </motion.div>
                    );
                })}

                {multiSelect && (
                    <div className="px-4 py-2 text-xs text-gray-500 border-t border-[rgba(255,255,255,0.1)] bg-black/20">
                        {searchTerm
                            ? `${filteredOptions.length} of ${options.length} results`
                            : `${options.length} total options`
                        }
                    </div>
                )}
            </div>
        </motion.div>
    ), [dropdownVariants, dropdownCoords.width, dropdownCoords.top, dropdownCoords.left, filteredOptions, multiSelect, searchTerm, options.length, selectedOptions, optionVariants, hoveredIndex, handleSelect]);

    return (
        <motion.div
            ref={containerRef}
            className={`relative ${getInputHeight()} rounded-xl overflow-visible ${className}`}
            style={{
                backdropFilter: isClicking ? 'none' : 'blur(20px)',
                WebkitBackdropFilter: isClicking ? 'none' : 'blur(20px)',
                zIndex: 10,
            }}
            variants={containerVariants}
            {...containerAnimationProps}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            onMouseDown={() => setIsClicking(true)}
            onMouseUp={() => setIsClicking(false)}
            onMouseLeave={() => setIsClicking(false)}
        >
            <motion.div
                className="absolute inset-0 bg-gradient-to-r from-purple-500/30 to-blue-500/30"
                initial={{ opacity: 0 }}
                animate={{ opacity: isHovered || isFocused ? 0.2 : 0 }}
                transition={{ duration: 0.3 }}
                style={{ rotateX, rotateY }}
                onClick={handleToggle}
            />
            <div className="absolute inset-y-0 left-4 flex items-center">
                {Icon && <Icon className="text-gray-400" size={16} />}
            </div>
            <div className={`w-full h-full px-4 py-2 flex flex-wrap items-center gap-[5px] ${Icon ? 'pl-10' : ''}`}>
                <AnimatePresence>
                    {multiSelect && selectedOptions.map((option) => (
                        <MiniButton
                            key={option.value}
                            text={option.label}
                            Icon={X}
                            onClick={(e) => handleRemoveOption(option, e)}
                        />
                    ))}
                </AnimatePresence>
                <input
                    ref={inputRef}
                    className="flex-1 min-w-[120px] text-left text-white bg-transparent focus:outline-none"
                    value={multiSelect ? searchTerm : (selectedOptions[0]?.label || searchTerm)}
                    onChange={handleInputChange}
                    onFocus={() => {
                        setIsFocused(true);
                        setIsOpen(true);
                    }}
                    onBlur={() => setIsFocused(false)}
                    placeholder={selectedOptions.length === 0 ? placeholder : ''}
                />
            </div>
            <motion.button
                className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 flex items-center justify-center z-20"
                onClick={handleToggle}
                style={{ pointerEvents: 'auto' }}
            >
                <motion.svg
                    className="w-5 h-5 text-white"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    variants={iconVariants}
                    animate={isOpen ? 'open' : 'closed'}
                >
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </motion.svg>
            </motion.button>

            {isOpen && createPortal(renderDropdown, document.body)}
        </motion.div>
    );
};

export default Dropdown;
