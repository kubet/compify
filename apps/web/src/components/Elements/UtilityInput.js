import React, { useState, useRef, useEffect, forwardRef } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';

const UtilityInput = forwardRef(({ value,
    onChange,
    placeholder,
    onSubmit,
    showButton,
    buttonAnimation,
    Icon = null,
    RightIcon = null,
    type = "text",
    StartElement = null,
    isNumber = false,
    blurBackground = false,
    disableEnter = false,
    errorMessage = null,
    errorColor = '#ff0000',
    checkTokenNameExists = () => true,
    autoComplete = "off" }, ref) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const containerRef = useRef(null);
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const rotateX = useTransform(mouseY, [-10, 10], [5, -5]);
    const rotateY = useTransform(mouseX, [-10, 10], [-5, 5]);

    useEffect(() => {
        const container = containerRef.current;
        const handleMouseMove = (e) => {
            const rect = container?.getBoundingClientRect();
            if (rect) {
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                mouseX.set(x - rect.width / 2);
                mouseY.set(y - rect.height / 2);
            }
        };

        container?.addEventListener('mousemove', handleMouseMove);
        return () => {
            container?.removeEventListener('mousemove', handleMouseMove);
        };
    }, [mouseX, mouseY]);

    const containerVariants = {
        rest: {
            background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
            boxShadow: '0 4px 24px -1px rgba(0, 0, 0, 0.2)',
            border: `1px solid ${errorMessage ? errorColor : 'rgba(255,255,255,0.18)'}`,
        },
        hover: {
            background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.07) 100%)',
            boxShadow: '0 8px 32px -1px rgba(0, 0, 0, 0.2), 0 0 0 2px rgba(255,255,255,0.3)',
            border: `2px solid ${errorMessage ? errorColor : 'rgba(255,255,255,0.3)'}`,
        },
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !disableEnter) {
            onSubmit();
        }
    };

    const [isDragging, setIsDragging] = useState(false);
    const startY = useRef(0);
    const startValue = useRef(0);

    useEffect(() => {
        if (isNumber) {
            const handleMouseMove = (e) => {
                if (isDragging) {
                    const diff = startY.current - e.clientY;
                    const newValue = Math.round(startValue.current + diff / 2);
                    onChange({ target: { value: newValue.toString() } });
                }
            };

            const handleMouseUp = () => {
                setIsDragging(false);
            };

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);

            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, isNumber, onChange]);

    const handleMouseDown = (e) => {
        if (isNumber) {
            if (e.button === 0) {
                setIsDragging(true);
                startY.current = e.clientY;
                startValue.current = parseInt(value) || 0;
            }
        }
    };

    const startElementRef = useRef(null);
    const [startElementWidth, setStartElementWidth] = useState(0);

    useEffect(() => {
        if (startElementRef.current) {
            setStartElementWidth(startElementRef.current.offsetWidth);
        }
    }, [StartElement]);

    const [highlightedContent, setHighlightedContent] = useState('');
    const overlayRef = useRef(null);

    const escapeHtml = (text) => String(text)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('\"', '&quot;')
        .replaceAll("'", '&#39;');

    const highlightText = (text) => {
        if (!text) return '';
        const textString = String(text);

        const tokenRegex = /(?<![-a-zA-Z0-9])(--[a-zA-Z0-9-_]+)(?![-])/g;
        let lastIndex = 0;
        let result = '';

        const matches = Array.from(textString.matchAll(tokenRegex));

        for (const match of matches) {
            const [fullMatch, token] = match;
            if (checkTokenNameExists(token)) {
                result += escapeHtml(textString.slice(lastIndex, match.index));
                result += `<span style="color: #ea7508">${escapeHtml(token)}</span>`;
                lastIndex = match.index + fullMatch.length;
            }
        }

        result += escapeHtml(textString.slice(lastIndex));
        return result;
    };

    // Add this state to track scroll position
    const [scrollLeft, setScrollLeft] = useState(0);

    // Add this handler to the input element
    const handleScroll = (e) => {
        setScrollLeft(e.target.scrollLeft);
    };

    return (
        <div className="relative w-full">
            {errorMessage && (
                <div
                    className="absolute -top-2 left-3 px-2 text-sm z-30 flex items-center"
                    style={{ color: errorColor }}
                >
                    <span className="relative px-1">
                        {/* Top border cover */}
                        <span
                            className="absolute top-1/2 left-0 right-0"
                            style={{
                                height: '6px',
                                transform: 'translateY(-80%)',
                                zIndex: -1,
                                background: 'linear-gradient(to bottom, rgba(0,0,0,1) 50%, #18181b 50%)'
                            }}
                        />
                        <span className="relative z-10">
                            {errorMessage}
                        </span>
                    </span>
                </div>
            )}
            <motion.div
                ref={containerRef}
                className="relative w-full h-12 rounded-xl overflow-hidden flex items-center"
                style={{
                    backdropFilter: blurBackground ? 'blur(20px)' : 'none',
                    WebkitBackdropFilter: blurBackground ? 'blur(20px)' : 'none',
                    cursor: isNumber ? 'ns-resize' : 'default'
                }}
                variants={containerVariants}
                initial="rest"
                animate={isHovered || isFocused ? "hover" : "rest"}
                whileHover="hover"
                whileTap={{ scale: 0.97, rotateX: 0, rotateY: 0 }}
                onHoverStart={() => setIsHovered(true)}
                onHoverEnd={() => setIsHovered(false)}
                onMouseDown={handleMouseDown}
            >
                <div ref={startElementRef} className="flex items-center h-full pl-2 absolute left-0 z-30">
                    {StartElement && (
                        <div className="h-full flex items-center mr-2 relative">
                            {StartElement}
                        </div>
                    )}
                    {Icon && (
                        <div className="h-full flex items-center mr-2">
                            <Icon className="text-gray-400" size={16} />
                        </div>
                    )}
                </div>
                <div className="relative flex-grow h-full">
                    {/* Hidden actual input */}
                    <input
                        ref={ref}
                        type={type}
                        value={value}
                        onChange={(e) => {
                            onChange(e);
                            setHighlightedContent(highlightText(e.target.value));
                        }}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        autoComplete={autoComplete}
                        name={type}
                        className="absolute inset-0 w-full h-full bg-transparent focus:outline-none z-20 font-mono pointer-events-auto"
                        style={{
                            paddingLeft: StartElement || Icon ? `${startElementWidth}px` : '0.75rem',
                            paddingRight: showButton ? '2.5rem' : '0.75rem',
                            fontSize: '1rem',
                            fontFamily: 'inherit',
                            letterSpacing: 'inherit',
                            caretColor: 'white',
                            color: 'transparent',
                            height: '100%',
                            transform: 'translateZ(0)',
                            whiteSpace: 'pre',
                            overflowX: 'auto',
                        }}
                        onScroll={handleScroll}
                    />

                    <div
                        ref={overlayRef}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            paddingLeft: StartElement || Icon ? `${startElementWidth}px` : '0.75rem',
                            paddingRight: showButton ? '2.5rem' : '0.75rem',
                            fontSize: '1rem',
                            fontFamily: 'inherit',
                            letterSpacing: 'inherit',
                            whiteSpace: 'pre',
                            pointerEvents: 'none',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            width: 'fit-content',
                            minWidth: '100%',
                            transform: `translateX(-${scrollLeft}px)`,
                        }}
                    >
                        <div
                            style={{
                                display: 'inline-block',
                                whiteSpace: 'pre'
                            }}
                            dangerouslySetInnerHTML={{
                                __html: value !== undefined && (value !== '' || value === 0)
                                    ? highlightText(String(value))
                                    : `<span style="opacity: 0.5">${escapeHtml(placeholder || '')}</span>`
                            }}
                        />
                    </div>
                </div>
                {showButton && (
                    <motion.button
                        onClick={onSubmit}
                        className="flex items-center justify-center w-8 h-8 bg-[#18181b] rounded-xl z-20 mr-2"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.2 }}
                    >
                        <motion.svg
                            className="w-4 h-4 text-white"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            animate={buttonAnimation}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                        >
                            {RightIcon && <RightIcon />}
                        </motion.svg>
                    </motion.button>
                )}
                <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-purple-500/30 to-blue-500/30 -z-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isHovered || isFocused ? 0.2 : 0 }}
                    transition={{ duration: 0.3 }}
                    style={{ rotateX, rotateY }}
                />
            </motion.div>
        </div>
    );
});

export default UtilityInput;
UtilityInput.displayName = 'UtilityInput';
