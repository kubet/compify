"use client"
import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Mic, Camera, Sliders, ShapesIcon, X, Check } from 'lucide-react';
import { GradientSpot } from '@/components/Common';
import { Button, Dropdown, InputField, Toast } from '@/components/Elements';
import ProductCard from '@/components/Product/Card';
import { Chip } from '@/components/Elements';
import { searchComponents } from '@/lib/api';

import { useInView } from 'react-intersection-observer';
import { searchUiLibraries, uiLibraries } from '@/components/Editor/Templates/common';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import EmptyState from '@/components/Common/EmptyState';

const filterMap = [
    {
        value: 'react-ecosystem',
        label: 'React Ecosystem',
        type: 'group',
        children: [
            { value: 'react', label: 'React JS', includes: ['react'] },
            { value: 'react-ts', label: 'React TS', includes: ['react-ts'] },
            { value: 'nextjs', label: 'Next JS', includes: ['nextjs'] },
            { value: 'nextjs-ts', label: 'Next TS', includes: ['nextjs-ts'] },
        ]
    },
    // {
    //     value: 'vue-ecosystem',
    //     label: 'Vue Ecosystem',
    //     type: 'group',
    //     children: [
    //         { value: 'vue', label: 'Vue JS', includes: ['vue'] },
    //         { value: 'vue-ts', label: 'Vue TS', includes: ['vue-ts'] }
    //     ]
    // },
    {
        value: 'native-ecosystem',
        label: 'Native Ecosystem',
        type: 'group',
        children: [
            { value: 'react-native', label: 'React Native', includes: ['react-native'] },
            { value: 'react-native-ts', label: 'React Native TS', includes: ['react-native-ts'] }
        ]
    }
];

const uiLibraryGroups = [
    {
        value: 'tailwind-css',
        label: 'Tailwind CSS',
        type: 'group',
        children: [
            {
                id: 'tailwind',
                name: 'Tailwind CSS',
                includes: ['tailwind', 'tailwind-ts']
            },
            {
                id: 'tailwind-v4',
                name: 'Tailwind CSS (v4)',
                includes: ['tailwind-v4', 'tailwind-ts-v4']
            }
        ]
    },
    {
        value: 'daisyui',
        label: 'DaisyUI',
        id: 'daisyui',
        name: 'DaisyUI',
        includes: ['daisyui', 'daisyui-ts']
    },
    {
        value: 'shadcn',
        label: 'ShadcnUI',
        id: 'shadcn',
        name: 'Shadcn/ui',
        includes: ['shadcn']
    },
    {
        value: 'mui',
        label: 'Material UI',
        id: 'mui',
        name: 'Material UI',
        includes: ['mui']
    },
    {
        value: 'bootstrap',
        label: 'Bootstrap',
        id: 'bootstrap',
        name: 'Bootstrap',
        includes: ['bootstrap']
    },
    {
        value: 'styled-components',
        label: 'Styled Components',
        id: 'styled-components',
        name: 'Styled Components',
        includes: ['styled-components']
    }
];

const FilterDropdown = ({ onSelectRuntime, onSelectLibrary, runtimeOptions }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedRuntimes, setSelectedRuntimes] = useState([]);
    const [selectedLibraries, setSelectedLibraries] = useState([]);
    const containerRef = useRef(null);
    const [dropdownCoords, setDropdownCoords] = useState({ top: 0, left: 0, width: 0 });
    const dropdownRef = useRef(null);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
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

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const dropdownHeight = 320;

            setDropdownCoords({
                top: spaceBelow < dropdownHeight ? rect.top - dropdownHeight - 8 : rect.bottom + 8,
                left: rect.left - 270,
                width: rect.width + 270,
            });
        }
    }, [isOpen]);

    const handleRuntimeSelect = (runtime) => {
        const isSelected = selectedRuntimes.some(r => r.value === runtime.value);
        let newSelected;

        if (runtime.type === 'group') {
            // If it's a group, handle all children
            const childValues = runtime.children.map(child => child.value);
            const allChildrenSelected = runtime.children.every(child =>
                selectedRuntimes.some(r => r.value === child.value)
            );

            if (allChildrenSelected) {
                // Remove all children if all were selected
                newSelected = selectedRuntimes.filter(r => !childValues.includes(r.value));
            } else {
                // Add all missing children
                const existingValues = new Set(selectedRuntimes.map(r => r.value));
                const toAdd = runtime.children.filter(child => !existingValues.has(child.value));
                newSelected = [...selectedRuntimes, ...toAdd];
            }
        } else {
            // Handle individual runtime selection
            if (isSelected) {
                newSelected = selectedRuntimes.filter(r => r.value !== runtime.value);
            } else {
                newSelected = [...selectedRuntimes, runtime];
            }
        }

        setSelectedRuntimes(newSelected);
        onSelectRuntime(newSelected);
    };

    const handleLibrarySelect = (library) => {
        let newSelected;

        if (library.type === 'group') {
            // If it's a group, handle all children
            const childIds = library.children.map(child => child.id);
            const allChildrenSelected = library.children.every(child =>
                selectedLibraries.some(l => l.id === child.id)
            );

            if (allChildrenSelected) {
                // Remove all children if all were selected
                newSelected = selectedLibraries.filter(l => !childIds.includes(l.id));
            } else {
                // Add all missing children
                const existingIds = new Set(selectedLibraries.map(l => l.id));
                const toAdd = library.children.filter(child => !existingIds.has(child.id));
                newSelected = [...selectedLibraries, ...toAdd];
            }
        } else {
            // Handle individual library selection
            const isSelected = selectedLibraries.some(l => l.id === library.id);
            if (isSelected) {
                newSelected = selectedLibraries.filter(l => l.id !== library.id);
            } else {
                newSelected = [...selectedLibraries, library];
            }
        }

        setSelectedLibraries(newSelected);
        onSelectLibrary(newSelected);
    };

    const isGroupSelected = (group) => {
        return group.children.every(child =>
            selectedRuntimes.some(r => r.value === child.value)
        );
    };

    const isGroupPartiallySelected = (group) => {
        return group.children.some(child =>
            selectedRuntimes.some(r => r.value === child.value)
        ) && !isGroupSelected(group);
    };

    const isLibraryGroupSelected = (group) => {
        return group.children.every(child =>
            selectedLibraries.some(l => l.id === child.id)
        );
    };

    const isLibraryGroupPartiallySelected = (group) => {
        return group.children.some(child =>
            selectedLibraries.some(l => l.id === child.id)
        ) && !isLibraryGroupSelected(group);
    };

    const renderLibraryOption = (library, indent = false) => (
        <motion.div
            key={library.id || library.value}
            className={`relative flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer ${indent ? 'ml-7' : ''}`}
            variants={itemVariants}
            initial="rest"
            animate={
                library.type === 'group'
                    ? isLibraryGroupSelected(library)
                        ? "selected"
                        : isLibraryGroupPartiallySelected(library)
                            ? "partiallySelected"
                            : "rest"
                    : selectedLibraries.some(l => l.id === library.id)
                        ? "selected"
                        : "rest"
            }
            whileHover="hover"
            onClick={() => handleLibrarySelect(library)}
            style={{ transition: 'background 0.2s ease' }}
        >
            {indent && (
                <div className="absolute left-[0.875rem] top-1/2 w-1.5 h-1.5 rounded-full bg-white/20 -translate-y-1/2" />
            )}
            <div className="flex items-center gap-2.5">
                {library.type === 'group' ? (
                    <motion.svg
                        className="w-3.5 h-3.5 ml-[0.125rem]"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        animate={{
                            rotate: isLibraryGroupPartiallySelected(library) || isLibraryGroupSelected(library) ? 90 : 0,
                            color: isLibraryGroupSelected(library)
                                ? 'rgb(96 165 250)'
                                : isLibraryGroupPartiallySelected(library)
                                    ? 'rgb(156 195 250)'
                                    : 'rgb(209 213 219)'
                        }}
                        transition={{ duration: 0.2 }}
                    >
                        <path d="M6.293 7.293a1 1 0 011.414 0L10 9.586l2.293-2.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" />
                    </motion.svg>
                ) : null}
                <span className="text-sm font-medium">{library.label || library.name}</span>
            </div>
            <AnimatePresence>
                {(library.type === 'group' ? isLibraryGroupSelected(library) : selectedLibraries.some(l => l.id === library.id)) && (
                    <motion.div
                        variants={checkmarkVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                    >
                        <Check className="w-3.5 h-3.5" />
                    </motion.div>
                )}
                {library.type === 'group' && isLibraryGroupPartiallySelected(library) && (
                    <motion.div
                        variants={checkmarkVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                    >
                        <div className="w-2.5 h-0.5 bg-current rounded-full" />
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );

    const renderRuntimeOption = (runtime, indent = false) => (
        <motion.div
            key={runtime.value}
            className={`relative flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer ${indent ? 'ml-7' : ''}`}
            variants={itemVariants}
            initial="rest"
            animate={
                runtime.type === 'group'
                    ? isGroupSelected(runtime)
                        ? "selected"
                        : isGroupPartiallySelected(runtime)
                            ? "partiallySelected"
                            : "rest"
                    : selectedRuntimes.some(r => r.value === runtime.value)
                        ? "selected"
                        : "rest"
            }
            whileHover="hover"
            onClick={() => handleRuntimeSelect(runtime)}
            style={{ transition: 'background 0.2s ease' }}
        >
            {indent && (
                <div className="absolute left-[0.875rem] top-1/2 w-1.5 h-1.5 rounded-full bg-white/20 -translate-y-1/2" />
            )}
            <div className="flex items-center gap-2.5">
                {runtime.type === 'group' ? (
                    <motion.svg
                        className="w-3.5 h-3.5 ml-[0.125rem]"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        animate={{
                            rotate: isGroupPartiallySelected(runtime) || isGroupSelected(runtime) ? 90 : 0,
                            color: isGroupSelected(runtime)
                                ? 'rgb(96 165 250)'
                                : isGroupPartiallySelected(runtime)
                                    ? 'rgb(156 195 250)'
                                    : 'rgb(209 213 219)'
                        }}
                        transition={{ duration: 0.2 }}
                    >
                        <path d="M6.293 7.293a1 1 0 011.414 0L10 9.586l2.293-2.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" />
                    </motion.svg>
                ) : null}
                <span className="text-sm font-medium">{runtime.label}</span>
            </div>
            <AnimatePresence>
                {(runtime.type === 'group' ? isGroupSelected(runtime) : selectedRuntimes.some(r => r.value === runtime.value)) && (
                    <motion.div
                        variants={checkmarkVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                    >
                        <Check className="w-3.5 h-3.5" />
                    </motion.div>
                )}
                {runtime.type === 'group' && isGroupPartiallySelected(runtime) && (
                    <motion.div
                        variants={checkmarkVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                    >
                        <div className="w-2.5 h-0.5 bg-current rounded-full" />
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );

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

    const dropdownVariants = {
        closed: {
            opacity: 0,
            scale: 0.95,
            y: -4,
            transition: {
                duration: 0.15,
                ease: [0.32, 0.72, 0, 1]
            }
        },
        open: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: {
                duration: 0.2,
                ease: [0.32, 0.72, 0, 1]
            }
        },
    };

    const itemVariants = {
        rest: {
            background: 'transparent',
            color: 'rgb(209 213 219)',
        },
        hover: {
            background: 'rgba(255, 255, 255, 0.06)',
            color: 'rgb(229 231 235)',
        },
        selected: {
            background: 'rgba(59, 130, 246, 0.15)',
            color: 'rgb(96 165 250)',
        },
        partiallySelected: {
            background: 'rgba(59, 130, 246, 0.08)',
            color: 'rgb(156 195 250)',
        }
    };

    const checkmarkVariants = {
        initial: { scale: 0, opacity: 0 },
        animate: {
            scale: 1,
            opacity: 1,
            transition: {
                type: "spring",
                stiffness: 400,
                damping: 25
            }
        },
        exit: {
            scale: 0,
            opacity: 0,
            transition: { duration: 0.15 }
        }
    };

    const renderDropdown = () => (
        <motion.div
            ref={dropdownRef}
            className="fixed backdrop-blur-2xl rounded-2xl overflow-hidden z-50"
            variants={dropdownVariants}
            initial="closed"
            animate="open"
            exit="closed"
            style={{
                background: 'rgba(17, 17, 17, 0.95)',
                backdropFilter: 'blur(24px)',
                boxShadow: '0 20px 48px -12px rgba(0, 0, 0, 0.45), 0 0 1px 0 rgba(255,255,255,0.15)',
                width: dropdownCoords.width,
                top: dropdownCoords.top,
                left: dropdownCoords.left,
                minWidth: '400px',
            }}
        >
            <div className="flex divide-x divide-white/[0.08]">
                {/* UI Libraries Section */}
                <div className="w-1/2 p-4">
                    <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider px-2 mb-3">UI Libraries</h3>
                    <div className="space-y-1">
                        {uiLibraryGroups.map((group) => (
                            <React.Fragment key={group.value}>
                                {renderLibraryOption(group)}
                                {group.type === 'group' && (
                                    <motion.div
                                        className="relative space-y-1 overflow-hidden"
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{
                                            height: 'auto',
                                            opacity: 1,
                                            transition: { duration: 0.2, ease: [0.32, 0.72, 0, 1] }
                                        }}
                                    >
                                        {group.children.map(child => renderLibraryOption(child, true))}
                                    </motion.div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* Runtimes Section */}
                <div className="w-1/2 p-4">
                    <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider px-2 mb-3">Runtimes</h3>
                    <div className="space-y-1">
                        {runtimeOptions.map((runtime) => (
                            <React.Fragment key={runtime.value}>
                                {renderRuntimeOption(runtime)}
                                {runtime.type === 'group' && (
                                    <motion.div
                                        className="relative space-y-1 overflow-hidden"
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{
                                            height: 'auto',
                                            opacity: 1,
                                            transition: { duration: 0.2, ease: [0.32, 0.72, 0, 1] }
                                        }}
                                    >
                                        {runtime.children.map(child => renderRuntimeOption(child, true))}
                                    </motion.div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );

    const renderMobileModal = () => (
        <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            transition={{ duration: 0.2 }}
        >
            <motion.div
                className="h-full w-full flex flex-col"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
                        <h2 className="text-lg font-semibold text-white">Filters</h2>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-2 hover:bg-white/10 rounded-full"
                        >
                            <X className="w-5 h-5 text-white" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto px-4 py-6">
                        {/* UI Libraries Section */}
                        <div className="mb-8">
                            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">
                                UI Libraries
                            </h3>
                            <div className="space-y-2">
                                {uiLibraryGroups.map((group) => (
                                    <div key={group.value} className="space-y-2">
                                        {/* Parent Group */}
                                        <motion.button
                                            className={`w-full flex items-center justify-between p-3 rounded-lg ${group.type === 'group'
                                                    ? isLibraryGroupSelected(group)
                                                        ? 'bg-blue-500/20 text-blue-400'
                                                        : isLibraryGroupPartiallySelected(group)
                                                            ? 'bg-blue-500/10 text-blue-300'
                                                            : 'bg-white/5 text-gray-300'
                                                    : selectedLibraries.some(l => l.id === group.id)
                                                        ? 'bg-blue-500/20 text-blue-400'
                                                        : 'bg-white/5 text-gray-300'
                                                }`}
                                            onClick={() => handleLibrarySelect(group)}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <div className="flex items-center gap-2">
                                                {group.type === 'group' && (
                                                    <motion.svg
                                                        className="w-4 h-4"
                                                        viewBox="0 0 20 20"
                                                        fill="currentColor"
                                                        animate={{
                                                            rotate: isLibraryGroupPartiallySelected(group) || isLibraryGroupSelected(group) ? 90 : 0
                                                        }}
                                                    >
                                                        <path d="M6.293 7.293a1 1 0 011.414 0L10 9.586l2.293-2.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" />
                                                    </motion.svg>
                                                )}
                                                <span>{group.label || group.name}</span>
                                            </div>
                                            {(group.type === 'group' ? isLibraryGroupSelected(group) : selectedLibraries.some(l => l.id === group.id)) && (
                                                <Check className="w-4 h-4" />
                                            )}
                                            {group.type === 'group' && isLibraryGroupPartiallySelected(group) && (
                                                <div className="w-4 h-0.5 bg-current rounded-full" />
                                            )}
                                        </motion.button>

                                        {/* Children */}
                                        {group.type === 'group' && (
                                            <motion.div
                                                className="pl-4 space-y-2"
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{
                                                    height: 'auto',
                                                    opacity: 1,
                                                    transition: { duration: 0.2 }
                                                }}
                                            >
                                                {group.children.map(child => (
                                                    <motion.button
                                                        key={child.id}
                                                        className={`w-full flex items-center justify-between p-3 rounded-lg ${selectedLibraries.some(l => l.id === child.id)
                                                                ? 'bg-blue-500/20 text-blue-400'
                                                                : 'bg-white/5 text-gray-300'
                                                            }`}
                                                        onClick={() => handleLibrarySelect(child)}
                                                        whileTap={{ scale: 0.98 }}
                                                    >
                                                        <span>{child.name}</span>
                                                        {selectedLibraries.some(l => l.id === child.id) && (
                                                            <Check className="w-4 h-4" />
                                                        )}
                                                    </motion.button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Runtimes Section - Similar structure */}
                        <div>
                            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">
                                Runtimes
                            </h3>
                            <div className="space-y-2">
                                {runtimeOptions.map((runtime) => (
                                    <div key={runtime.value} className="space-y-2">
                                        <motion.button
                                            className={`w-full flex items-center justify-between p-3 rounded-lg ${runtime.type === 'group'
                                                    ? isGroupSelected(runtime)
                                                        ? 'bg-blue-500/20 text-blue-400'
                                                        : isGroupPartiallySelected(runtime)
                                                            ? 'bg-blue-500/10 text-blue-300'
                                                            : 'bg-white/5 text-gray-300'
                                                    : selectedRuntimes.some(r => r.value === runtime.value)
                                                        ? 'bg-blue-500/20 text-blue-400'
                                                        : 'bg-white/5 text-gray-300'
                                                }`}
                                            onClick={() => handleRuntimeSelect(runtime)}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <div className="flex items-center gap-2">
                                                {runtime.type === 'group' && (
                                                    <motion.svg
                                                        className="w-4 h-4"
                                                        viewBox="0 0 20 20"
                                                        fill="currentColor"
                                                        animate={{
                                                            rotate: isGroupPartiallySelected(runtime) || isGroupSelected(runtime) ? 90 : 0
                                                        }}
                                                    >
                                                        <path d="M6.293 7.293a1 1 0 011.414 0L10 9.586l2.293-2.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" />
                                                    </motion.svg>
                                                )}
                                                <span>{runtime.label}</span>
                                            </div>
                                            {(runtime.type === 'group' ? isGroupSelected(runtime) : selectedRuntimes.some(r => r.value === runtime.value)) && (
                                                <Check className="w-4 h-4" />
                                            )}
                                            {runtime.type === 'group' && isGroupPartiallySelected(runtime) && (
                                                <div className="w-4 h-0.5 bg-current rounded-full" />
                                            )}
                                        </motion.button>

                                        {runtime.type === 'group' && (
                                            <motion.div
                                                className="pl-4 space-y-2"
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{
                                                    height: 'auto',
                                                    opacity: 1,
                                                    transition: { duration: 0.2 }
                                                }}
                                            >
                                                {runtime.children.map(child => (
                                                    <motion.button
                                                        key={child.value}
                                                        className={`w-full flex items-center justify-between p-3 rounded-lg ${selectedRuntimes.some(r => r.value === child.value)
                                                                ? 'bg-blue-500/20 text-blue-400'
                                                                : 'bg-white/5 text-gray-300'
                                                            }`}
                                                        onClick={() => handleRuntimeSelect(child)}
                                                        whileTap={{ scale: 0.98 }}
                                                    >
                                                        <span>{child.label}</span>
                                                        {selectedRuntimes.some(r => r.value === child.value) && (
                                                            <Check className="w-4 h-4" />
                                                        )}
                                                    </motion.button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-white/10 p-4">
                        <Button
                            text={`Apply Filters (${selectedRuntimes.length + selectedLibraries.length})`}
                            variant="full"
                            onClick={() => setIsOpen(false)}
                            fullWidth
                        />
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );

    return (
        <>
            <motion.div
                ref={containerRef}
                className="relative h-12 rounded-xl overflow-visible sm:w-[200px] w-12 select-none cursor-pointer"
                variants={containerVariants}
                initial="rest"
                animate={isHovered ? "hover" : "rest"}
                whileHover="hover"
                whileTap={{ scale: 0.97 }}
                onHoverStart={() => setIsHovered(true)}
                onHoverEnd={() => setIsHovered(false)}
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
                style={{ transition: 'all 0.3s cubic-bezier(0.32, 0.72, 0, 1)' }}
            >
                <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-purple-500/30 to-blue-500/30 -z-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isHovered ? 0.2 : 0 }}
                    transition={{ duration: 0.3 }}
                />
                <div className="w-full h-full px-3.5 flex items-center justify-center sm:justify-between">
                    <div className="flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-gray-300" />
                        <span className="text-sm text-gray-300 hidden sm:inline font-medium">
                            {selectedRuntimes.length > 0 || selectedLibraries.length > 0
                                ? `${selectedRuntimes.length + selectedLibraries.length} selected`
                                : 'Filters'}
                        </span>
                    </div>
                    <motion.svg
                        className="w-4 h-4 text-gray-300 hidden sm:block"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        animate={{
                            rotate: isOpen ? 180 : 0,
                            translateY: isOpen ? 1 : 0
                        }}
                        transition={{
                            duration: 0.2,
                            ease: [0.32, 0.72, 0, 1]
                        }}
                    >
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </motion.svg>
                </div>
            </motion.div>

            <AnimatePresence mode="wait">
                {isOpen && (
                    <>
                        {/* Mobile Modal */}
                        {typeof window !== 'undefined' && createPortal(
                            <div
                                className="md:hidden"
                                onClick={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                                onMouseUp={(e) => e.stopPropagation()}
                                onTouchStart={(e) => e.stopPropagation()}
                                onTouchEnd={(e) => e.stopPropagation()}
                            >
                                {renderMobileModal()}
                            </div>,
                            document.body
                        )}

                        {/* Desktop Dropdown */}
                        {typeof window !== 'undefined' && createPortal(
                            <div
                                className="hidden md:block"
                                onClick={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                                onMouseUp={(e) => e.stopPropagation()}
                            >
                                {renderDropdown()}
                            </div>,
                            document.body
                        )}
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

const SearchPage = () => {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState(null);
    const [selectedOption, setSelectedOption] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isToastVisible, setIsToastVisible] = useState(false);
    const [total, setTotal] = useState(0);
    const [selectedTags, setSelectedTags] = useState([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const { ref, inView } = useInView({
        threshold: 0,
        delay: 100,
    });

    // Track if this is the initial mount
    const isInitialMount = useRef(true);

    const handleSearch = async (pageNum = 0, query = searchQuery) => {
        if (isLoading && pageNum > 0) return;

        try {
            setIsLoading(true);
            const response = await searchComponents(pageNum, query, selectedOption?.map(option => option?.value) || [], selectedTags.map(tag => tag?.includes).flat());
            if (response.status === 201) {
                if (pageNum === 0) {
                    setSearchResults(response.data.items);
                } else {
                    setSearchResults(prev => [...prev, ...response.data.items]);
                }
                setTotal(response.data.total);
                setHasMore(response.data.items.length === 12);
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        handleSearch(0);
    }, []);

    // Search handling with debounce
    useEffect(() => {
        // Skip if this is the initial mount
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        setIsLoading(true);
        const timer = setTimeout(() => {
            setPage(0);
            setHasMore(true);
            handleSearch(0);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, selectedOption, selectedTags]);

    useEffect(() => {
        if (inView && hasMore && !isLoading) {
            const nextPage = page + 1;
            handleSearch(nextPage);
            setPage(nextPage);
        }
    }, [inView, hasMore, isLoading, page]);

    const handleTagClick = (tag) => {
        if (selectedTags.some(t => t.id === tag.id)) {
            setSelectedTags(selectedTags.filter(t => t.id !== tag.id));
        } else {
            setSelectedTags([...selectedTags, tag]);
        }
    };

    const handleScroll = (e) => {
        setIsScrolled(e.target.scrollTop > 0);
    };

    return (
        <div className="flex flex-col bg-black w-full h-[calc(100vh-64px)] overflow-hidden">
            {/* Header Section */}
            <div className="w-full border-b border-white/10 backdrop-blur-xl bg-black/30 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex flex-col pt-3">
                        {/* Main Search Row */}
                        <div className="flex items-center gap-2">
                            <InputField
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search components (e.g., button, input, modal)"
                                RightIcon={searchQuery ? X : Search}
                                onSubmit={() => setSearchQuery('')}
                                showButton={true}
                                buttonAnimation={true}
                                className="flex-1"
                            />
                            <FilterDropdown
                                onSelectRuntime={(runtimes) => setSelectedOption(runtimes)}
                                onSelectLibrary={(libraries) => setSelectedTags(libraries)}
                                runtimeOptions={filterMap}
                            />
                        </div>

                        {/* Stats and Filters Row */}
                        <div className="flex items-center justify-between my-3 text-sm h-6">
                            <motion.p
                                className="text-white/50"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.2 }}
                            >
                                {searchQuery
                                    ? `Found ${searchResults?.length || 0} results ${total > (searchResults?.length || 0) ? `of ${total} total` : ''}`
                                    : `${total.toLocaleString()} components available`
                                }
                            </motion.p>

                            {/* Active Filters */}
                            <motion.div
                                className="flex flex-wrap items-center gap-2 justify-end"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                <span className="text-white/50 block sm:hidden">
                                    Filters {(selectedOption.length > 0 || selectedTags.length > 0) ? selectedTags.length + selectedOption.length : " (none)"}
                                </span>
                                <div className="hidden sm:flex items-center gap-2">
                                    <span className="text-white/50">
                                        Filters{(selectedOption.length > 0 || selectedTags.length > 0) ? ":" : " (none)"}
                                    </span>
                                    {selectedOption.map((option) => (
                                        <Chip
                                            key={option.value}
                                            label={option.label}
                                            onRemove={() => setSelectedOption(selectedOption.filter(o => o.value !== option.value))}
                                            variant="secondary"
                                            size="xs"
                                            onClick={() => setSelectedOption(selectedOption.filter(o => o.value !== option.value))}
                                            className="cursor-pointer hover:bg-white/10"
                                        />
                                    ))}
                                    {selectedTags.map((tag) => (
                                        <Chip
                                            key={tag.id}
                                            label={tag.name}
                                            onRemove={() => setSelectedTags(selectedTags.filter(t => t.id !== tag.id))}
                                            variant="secondary"
                                            size="xs"
                                            onClick={() => setSelectedTags(selectedTags.filter(t => t.id !== tag.id))}
                                            className="cursor-pointer hover:bg-white/10"
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Results Section */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    {isLoading && searchResults === null ? null : (
                        searchResults?.length === 0 ? (
                            <div className="col-span-full flex items-center justify-center">
                                <EmptyState
                                    title="No components found"
                                    description="Try adjusting your search or filters to find what you're looking for"
                                    action={<Button onClick={() => window.open('/create', '_blank')} text="New Component" textSm="New" Icon={Plus} className="" />}
                                />
                            </div>
                        ) : (
                            <motion.div
                                layout
                                className="columns-1 md:columns-2 lg:columns-3 gap-6"
                            >
                                {searchResults?.map((result, index) => (
                                    <motion.div
                                        key={result.id || index}
                                        className="break-inside-avoid-column mb-6 h-fit"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: index * 0.05 }}
                                    >
                                        <ProductCard
                                            id={result.id}
                                            name={result.name}
                                            imageUploaded={result.imageUploaded}
                                            language={result.language}
                                            upvotes={result.upvotesCount}
                                            upvoteDefaultStatus={result.status}
                                            onCopy={() => setIsToastVisible(true)}
                                            publicImage={true}
                                        />
                                    </motion.div>
                                ))}
                            </motion.div>
                        )
                    )}

                    <div ref={ref} className="w-full py-8 flex items-center justify-center">
                        {isLoading && searchResults !== null && (
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400" />
                        )}
                    </div>
                </div>
            </div>

            {isToastVisible && (
                <Toast
                    message="Copied!"
                    duration={2000}
                    type="success"
                    onClose={() => setIsToastVisible(false)}
                />
            )}
        </div>
    );
};

export default SearchPage;
