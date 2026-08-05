'use client'
import React, { useState } from 'react'
import { uiFrameworkLook, uiLibraries } from '../Templates/common'
import Modal from '@/components/Elements/Modal'
import CardWrapper from '@/components/Elements/CardWrapper'
import { motion, AnimatePresence } from 'framer-motion'
import { Box, File } from 'lucide-react'
import LabelButton from '@/components/Elements/LabelButton'
import Toast from '@/components/Elements/Toast'


function SetupModal({ isOpen, onClose, template, setSelectedUIFramework, setPageView, onContinue }) {
    const [selectedFrameworks, setSelectedFrameworks] = useState([])
    const [currentPageView, setCurrentPageView] = useState('Component')
    const [isAnimating, setIsAnimating] = useState(false)
    const [isHovered, setIsHovered] = useState(null)
    const [activeVersionSelect, setActiveVersionSelect] = useState(null)
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');


    let avalibleUIFrameworks = uiLibraries.filter(library => library.templates.includes(template)).map(library => library.id)

    const checkIncompatibilities = (framework) => {
        const incompatibilityMessages = selectedFrameworks
            .map(usedFw => {
                const look = uiFrameworkLook[usedFw];
                return look?.customCompactibilityError?.[framework];
            })
            .filter(Boolean);

        if (incompatibilityMessages.length > 0) {
            setToastMessage(incompatibilityMessages[0]);
            setShowToast(true);
            return true; // has incompatibilities
        }
        return false; // no incompatibilities
    }

    const handleOptionClick = (option) => {
        setIsAnimating(true)
        const baseFramework = option.split('-')[0]

        // Check if any version of this framework is selected
        const isFrameworkSelected = selectedFrameworks.some(f => f.startsWith(baseFramework))

        let newSelection
        if (isFrameworkSelected) {
            // If framework is selected, remove all versions of it
            newSelection = selectedFrameworks.filter(f => !f.startsWith(baseFramework))
            setActiveVersionSelect(null)
        } else if (!uiFrameworkLook[option].versions) {
            // Check incompatibilities before adding
            if (!selectedFrameworks.includes(option) && checkIncompatibilities(option)) {
                setIsAnimating(false);
                return;
            }
            // If framework has no versions, toggle it directly
            newSelection = selectedFrameworks.includes(option)
                ? selectedFrameworks.filter(item => item !== option)
                : [...selectedFrameworks, option]
        } else {
            // Toggle version selection mode for this framework
            newSelection = [...selectedFrameworks]
            setActiveVersionSelect(activeVersionSelect === option ? null : option)
        }

        setSelectedFrameworks(newSelection)
        setSelectedUIFramework(newSelection)
        setTimeout(() => setIsAnimating(false), 400)
    }

    const handleVersionSelect = (framework, version) => {
        setIsAnimating(true);

        // Check incompatibilities before adding new version
        const isVersionSelected = selectedFrameworks.includes(version.value);
        if (!isVersionSelected) {
            const hasIncompatibility = checkIncompatibilities(version.value);
            if (hasIncompatibility) {
                setIsAnimating(false);
                return;
            }
        }

        // Remove any existing version of this framework
        const baseFramework = framework.split('-')[0];
        const filteredFrameworks = selectedFrameworks.filter(f => !f.startsWith(baseFramework));

        // Add the new version if we're not unselecting
        if (!isVersionSelected) {
            filteredFrameworks.push(version.value);
        }

        setSelectedFrameworks(filteredFrameworks);
        setSelectedUIFramework(filteredFrameworks);
        setActiveVersionSelect(null);
        setTimeout(() => setIsAnimating(false), 400);
    }

    const viewMap = {
        'Component': { justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' },
        'Page': { justifyContent: 'space-between', alignItems: 'stretch', width: '100%', height: '100%' }
    }

    const handlePageViewClick = (view) => {
        setCurrentPageView(view)
        setPageView(viewMap[view])
    }

    const WarningMessage = () => (
        <motion.div
            key="warning-message"
            initial={false}
            animate={{
                opacity: 1,
                height: 'auto',
                marginBottom: 16,
                transition: { duration: 0.2 }
            }}
            style={{
                opacity: 0,
                height: 0,
                marginBottom: 0
            }}
            className="w-full overflow-hidden bg-yellow-500/10 border border-yellow-500/20 rounded-lg"
        >
            <div className="p-3">
                <div className="flex items-start gap-2 text-yellow-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                        <p className="text-sm font-medium">Multiple UI Frameworks Selected</p>
                        <p className="text-xs opacity-80 mt-1">Using multiple UI frameworks simultaneously may lead to conflicts and increased bundle size. Consider selecting just one for optimal performance.</p>
                    </div>
                </div>
            </div>
        </motion.div>
    )

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            color='hsl(220, 80%, 75%)'
            backdropColor='hsl(220, 80%, 25%, 0.8)'
        >
            {showToast && (
                <Toast
                    message={toastMessage}
                    type="error"
                    onClose={() => setShowToast(false)}
                />
            )}
            <motion.div
                className='flex flex-col h-auto w-[32rem] max-w-[95vw] items-center'
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
            >
                <motion.h5
                    className="text-2xl font-extrabold text-start w-full bg-gradient-to-r from-gray-300 via-gray-500 to-gray-700 bg-clip-text text-transparent mb-6"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    Setup your component
                </motion.h5>

                {selectedFrameworks.length > 1 && <WarningMessage />}

                {/* Framework Selection Section */}
                <div className="w-full mb-2">
                    <h6 className="text-sm font-medium text-gray-400 mb-3">
                        Select Framework{selectedFrameworks.length > 0 ? 's' : ''}
                    </h6>
                    <div
                        className="flex flex-wrap gap-4 w-full"
                    >
                        {avalibleUIFrameworks.map((option, index) => {
                            const baseFramework = option.split('-')[0]
                            const isSelected = selectedFrameworks.some(f => f.startsWith(baseFramework))
                            const framework = uiFrameworkLook[option] || uiFrameworkLook.default
                            return (
                                <CardWrapper
                                    key={index}
                                    layoutId={`framework-${option}`}
                                    color={framework.color}
                                    onClick={() => handleOptionClick(option)}
                                    className="p-4 flex-1 basis-[calc(50%-0.5rem)] transition-all duration-200"
                                    hoverEffect={false}
                                    isChecked={isSelected}
                                >
                                    <div
                                        className="flex items-center gap-3 relative min-h-[44px]"
                                        onMouseEnter={() => setIsHovered(option)}
                                        onMouseLeave={() => setIsHovered(null)}
                                    >
                                        <motion.div
                                            layoutId={`framework-icon-${option}`}
                                            className="relative"
                                        >
                                            <AnimatePresence mode="wait" initial={false}>
                                                {framework.versions && (isHovered === option || activeVersionSelect === option) ? (
                                                    <motion.div
                                                        className="flex gap-2"
                                                        initial={{ opacity: 0, width: 40 }}
                                                        animate={{ opacity: 1, width: "auto" }}
                                                        exit={{ opacity: 0, width: 40 }}
                                                        transition={{
                                                            duration: 0.2,
                                                            ease: [0.23, 1, 0.32, 1]
                                                        }}
                                                        key="version-buttons"
                                                    >
                                                        {framework.versions.map((version) => (
                                                            <motion.button
                                                                key={version.value}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleVersionSelect(option, version);
                                                                }}
                                                                className={`p-2 text-sm min-w-10 min-h-10 flex items-center justify-center 
                                                                        rounded-2xl transition-all duration-200 relative
                                                                        ${selectedFrameworks.includes(version.value)
                                                                        ? 'bg-white/25 ring-[3px] ring-white/90 border border-white/60'
                                                                        : 'bg-white/5 hover:bg-white/25 hover:ring-[3px] hover:ring-white/70 hover:border hover:border-white/40'}`}
                                                                style={{
                                                                    backgroundColor: framework.color,
                                                                    boxShadow: selectedFrameworks.includes(version.value)
                                                                        ? '0 0 10px rgba(255,255,255,0.15), inset 0 0 15px rgba(255,255,255,0.05)'
                                                                        : 'none',
                                                                    transform: 'translateZ(0)',
                                                                }}
                                                                whileHover={{
                                                                    boxShadow: '0 0 10px rgba(255,255,255,0.15), inset 0 0 15px rgba(255,255,255,0.05)',
                                                                    scale: 1.05,
                                                                    transition: { duration: 0.2 }
                                                                }}
                                                            >
                                                                <span className={`font-semibold ${selectedFrameworks.includes(version.value)
                                                                    ? 'text-white'
                                                                    : 'text-white/80 group-hover:text-white'}`}>
                                                                    {version.label}
                                                                </span>
                                                            </motion.button>
                                                        ))}
                                                    </motion.div>
                                                ) : (
                                                    <motion.div
                                                        key="framework-icon"
                                                        className="p-2 text-sm min-w-10 min-h-10 flex items-center justify-center rounded-2xl bg-opacity-10"
                                                        style={{ backgroundColor: framework.color }}
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        exit={{ opacity: 0 }}
                                                        transition={{
                                                            duration: 0.2,
                                                            ease: [0.23, 1, 0.32, 1]
                                                        }}
                                                    >
                                                        {framework.iconText}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>

                                        <motion.div
                                            className="flex flex-col flex-1"
                                            initial={false}
                                            animate={framework.versions && (isHovered === option || activeVersionSelect === option)
                                                ? { opacity: 0.5, x: 3 }
                                                : { opacity: 1, x: 0 }}
                                            transition={{
                                                duration: 0.2,
                                                ease: [0.23, 1, 0.32, 1]
                                            }}
                                        >
                                            <span className="text-base font-medium text-gray-200">
                                                {framework.label}
                                            </span>
                                            {isSelected && framework.versions && !isHovered && activeVersionSelect !== option && (
                                                <motion.span
                                                    initial={{ opacity: 0, y: -4 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{
                                                        duration: 0.2,
                                                        ease: [0.23, 1, 0.32, 1]
                                                    }}
                                                    className="text-xs text-gray-400 mt-1"
                                                >
                                                    {framework.versions.find(v =>
                                                        selectedFrameworks.includes(v.value)
                                                    )?.label}
                                                </motion.span>
                                            )}
                                        </motion.div>
                                    </div>
                                </CardWrapper>
                            )
                        })}
                    </div>
                    <p className='text-xs text-white/50 mt-2'>*You can use many more unlisted by just importing</p>
                </div>

                {/* Page View Section */}
                <motion.div
                    className="border-t border-[rgba(255,255,255,0.15)] pt-6 w-full"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <h6 className="text-sm font-medium text-gray-400 mb-3">Choose View Mode</h6>
                    <div className="flex flex-wrap gap-4 w-full">
                        <CardWrapper
                            color='hsl(220, 80%, 75%)'
                            onClick={() => handlePageViewClick('Component')}
                            className="flex-1 basis-[calc(50%-0.5rem)] p-4"
                            hoverEffect={false}
                            isChecked={currentPageView === 'Component'}
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 text-sm min-w-10 min-h-10 flex items-center justify-center rounded-2xl bg-opacity-10" style={{ backgroundColor: '#000000' }}>
                                    <Box size={24} className="text-gray-300" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-base font-medium text-gray-200">Component view</span>
                                </div>
                            </div>
                        </CardWrapper>
                        <CardWrapper
                            color='hsl(220, 80%, 75%)'
                            onClick={() => handlePageViewClick('Page')}
                            className="flex-1 basis-[calc(50%-0.5rem)] p-4"
                            hoverEffect={false}
                            isChecked={currentPageView === 'Page'}
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 text-sm min-w-10 min-h-10 flex items-center justify-center rounded-2xl bg-opacity-10" style={{ backgroundColor: '#000000' }}>
                                    <File size={24} className="text-gray-300" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-base font-medium text-gray-200">Page view</span>
                                </div>
                            </div>
                        </CardWrapper>

                    </div>
                </motion.div>

                <div className='flex justify-between w-full mt-6 gap-3 px-1'>
                    <LabelButton
                        onClick={onClose}
                        variant='neutral'
                    >
                        Skip, I&apos;ll do it later
                    </LabelButton>
                    <LabelButton
                        onClick={onContinue}
                        variant='info'
                    >
                        Continue
                    </LabelButton>
                </div>
            </motion.div>
        </Modal>
    )
}

export default SetupModal