'use client'
import React, { useState, useMemo, useEffect } from 'react'
import Modal from '@/components/Elements/Modal'
import CardWrapper from '@/components/Elements/CardWrapper'
import { motion, AnimatePresence } from 'framer-motion'
import LabelButton from '@/components/Elements/LabelButton'
import { setLanguagePreference } from '@/lib/api'
import { Chip } from '@/components/Elements'
import { runtimeList } from '@/components/Editor/Templates/common'

function PreferenceModal({ isOpen, onClose, defaultTemplates }) {
    const [selectedOptions, setSelectedOptions] = useState(defaultTemplates || [])
    const [selectedVariant, setSelectedVariant] = useState('All')

    useEffect(() => {
        if (defaultTemplates?.length > 0) {
            setSelectedOptions(defaultTemplates);
        }
    }, [defaultTemplates]);

    const variants = {
        'All': 'All Variants',
        'js': 'JavaScript',
        'ts': 'TypeScript'
    }

    // Background colors - Light for JS, Dark for TS
    const colorMap = {
        // React - Blue scale (TS is base, JS shifts slightly towards cyan)
        'react': '#2570EE',      // Slightly more cyan-blue for JS
        'react-ts': '#2563EB',   // Base royal blue for TS

        // Next.js - Monochrome scale (TS is base, JS shifts slightly warmer)
        'nextjs': '#1E2B3E',     // Slightly warmer deep gray for JS
        'nextts': '#1E293B',     // Base deep charcoal for TS

        // Vue - Teal scale (TS is base, JS shifts slightly towards cyan)
        'vue': '#14BBA3',        // Slightly more cyan-teal for JS
        'vue-ts': '#14B8A6',     // Base teal for TS

        // React Native - Purple scale (TS is base, JS shifts slightly towards magenta)
        'react-native': '#7E37ED',     // Slightly more magenta-purple for JS
        'react-native-ts': '#7C3AED'   // Base purple for TS
    }

    // Text colors - Following same principle
    const textColorMap = {
        // React - Blues
        'react': '#95C7FF',      // Slightly more cyan tint for JS
        'react-ts': '#93C5FD',   // Base light blue for TS

        // Next.js - Monochrome
        'nextjs': '#F8FAFC',     // Slightly warmer white for JS
        'nextts': '#F8FAFC',     // Base white for TS

        // Vue - Teals
        'vue': '#60ECD6',        // Slightly more cyan tint for JS
        'vue-ts': '#5EEAD4',     // Base light teal for TS

        // React Native - Purples
        'react-native': '#C6B3FE',     // Slightly more magenta tint for JS
        'react-native-ts': '#C4B5FD'   // Base light purple for TS
    }

    const getTemplateInfo = (template) => {
        return {
            id: template.id,
            name: template.displayName,
            variant: template.language === 'TypeScript' ? 'ts' : 'js',
            description: template.language,
            color: colorMap[template.id],
            iconText: <span className='font-bold' style={{ color: textColorMap[template.id] }}>{template.displayName[0]}</span>
        }
    }

    const templates = useMemo(() =>
        Object.fromEntries(
            runtimeList
                .filter(template => !template.id.startsWith('_'))
                .map(template => [template.id, getTemplateInfo(template)])
        ),
        []
    )

    const filteredTemplates = useMemo(() =>
        Object.entries(templates).filter(([_, template]) =>
            selectedVariant === 'All' || template.variant === selectedVariant
        ),
        [templates, selectedVariant]
    )

    const handleOptionClick = (option) => {
        setSelectedOptions(prev => {
            if (prev.includes(option)) return prev.filter(item => item !== option)
            if (prev.length >= 3) return prev
            return [...prev, option]
        })
    }

    const handleSavePreference = async () => {
        if (selectedOptions.length === 0) {
            onClose('react')
            return
        }
        await setLanguagePreference(selectedOptions)
        onClose(selectedOptions)
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={(preference) => onClose(preference)}
            color='hsl(220, 80%, 75%)'
            backdropColor='hsl(220, 80%, 25%, 0.8)'
        >
            <motion.div
                className='flex flex-col h-auto sm:w-[42rem] max-w-[95vw] items-center'
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
                    Select Template Preferences
                </motion.h5>

                {selectedOptions.length >= 3 && (
                    <motion.div
                        key="warning"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="w-full overflow-hidden bg-blue-500/10 border border-blue-500/20 rounded-lg mb-6"
                    >
                        <div className="p-3">
                            <div className="flex items-start gap-2 text-blue-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                <div>
                                    <p className="text-sm font-medium">Maximum Selection Reached</p>
                                    <p className="text-xs opacity-80 mt-1">You can select up to 3 template languages. Deselect an option to choose a different one.</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                <div className="w-full mb-6">
                    <h6 className="text-sm font-medium text-gray-400 mb-3">
                        Filter by Language Variant
                    </h6>
                    <motion.div
                        className="flex flex-wrap gap-3 w-full"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        {Object.entries(variants).map(([key, label]) => (
                            <Chip
                                key={key}
                                isSelected={selectedVariant === key}
                                label={label}
                                onSelect={() => setSelectedVariant(key)}
                                showX={false}
                                color={selectedVariant === key ? 'blue' : 'gray'}
                            />
                        ))}
                    </motion.div>
                </div>

                <div className="w-full mb-6">
                    <h6 className="text-sm font-medium text-gray-400 mb-3">
                        Choose up to 3 Template Languages
                    </h6>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                        {filteredTemplates.map(([id, template]) => (
                            <CardWrapper
                                key={id}
                                onClick={() => handleOptionClick(id)}
                                isChecked={selectedOptions.includes(id)}
                                color={template.color}
                                className="p-4"
                                hoverEffect={false}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 text-sm min-w-10 min-h-10 flex items-center justify-center rounded-2xl`}
                                        style={{ backgroundColor: `${template.color}20` }}>
                                        {template.iconText}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-base font-medium text-gray-200">{template.name}</span>
                                        <span className="text-sm text-gray-400">{template.description}</span>
                                    </div>
                                </div>
                            </CardWrapper>
                        ))}
                    </div>
                </div>

                <div className='flex justify-between w-full mt-6 gap-3 px-1'>
                    <LabelButton
                        onClick={() => onClose('react')}
                        variant='neutral'
                    >
                        Skip for now
                    </LabelButton>
                    <LabelButton
                        onClick={handleSavePreference}
                        variant='info'
                        isDisabled={selectedOptions.length === 0}
                    >
                        {selectedOptions.length === 0 ? 'Select at least one template' : 'Continue'}
                    </LabelButton>
                </div>
            </motion.div>
        </Modal>
    )
}

export default PreferenceModal