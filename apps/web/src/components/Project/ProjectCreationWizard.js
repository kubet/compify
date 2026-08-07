'use client'
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Info, Check, X, Edit2, PenTool, Palette, Sliders, ClipboardList, ArrowRight, Settings } from 'lucide-react';
import { Button, InputField, Slider, Toast } from '../Elements';
import Select from '../Elements/Select';
import ThemeSelectionInterface from './Steps/ThemeSelectionInterface';
import SimpleAi from './Steps/SimpleAi';
import ConfigurationStep from './Steps/ConfigurationStep';
import UILibStep from './Steps/UILibStep';
import DesignTokenWrapperStep from './Steps/DesignTokenWrapperStep';
// import { createProject } from '@/lib/api';
import SaveProjectStep from './SaveProjectStep';
import { useRouter } from 'next/navigation';

const steps = [
    { name: 'Project Name', icon: PenTool, steps: ['naming'] },
    { name: 'Project Configuration', icon: Settings, steps: ['runtime', 'ui-lib'] },
    // { name: 'Theme Selection', icon: Palette, steps: ['theme'] },
    // { name: 'Customization', icon: Sliders, steps: ['customization', 'ai', 'custom', 'template'] },
    { name: 'Project Summary', icon: Check, steps: ['summary'] },
];

const ProjectCreationWizard = ({ onComplete }) => {
    const router = useRouter()
    const [currentStep, setCurrentStep] = useState('naming');
    const [runtimeId, setRuntimeId] = useState(null);
    const [name, setName] = useState('');
    const [errors, setErrors] = useState({});
    const [uiLibIds, setUiLibIds] = useState([]);
    const [theme, setTheme] = useState(null);
    const [toast, setToast] = useState({});
    const [pageSettings, setPageSettings] = useState({
        fontFamily: 'Roboto',
        fonts: [{ n: 'Roboto', e: 'ital,wght@0,100..900;1,100..900' }]
    })

    const validateProjectName = (name) => {
        if (name.length < 3) return 'Project name must be at least 3 characters long';
        if (name.length > 50) return 'Project name must not exceed 50 characters';
        return '';
    };

    const handleInputChange = (field, value) => {
        setName(value);
        if (field === 'name') {
            const error = validateProjectName(value);
            setErrors((prev) => ({ ...prev, name: error }));
        }
    };


    const handleRuntimeSelect = (runtimeId) => {
        setCurrentStep('ui-lib')
        setRuntimeId(runtimeId)
    }

    const handleUiLibSelect = (uiLibIds) => {
        setCurrentStep('summary')
        setUiLibIds(uiLibIds)
    }

    const handleProjectSave = async () => {
        // const response = await createProject({
        //     name,
        //     language: runtimeId,
        //     usedUiFrameworks: uiLibIds,
        //     themes: [{
        //         name: 'Default',
        //         groups: theme?.groups,
        //         factors: theme?.factors,
        //         values: theme?.values
        //     }],
        //     pageSettings
        // })
        // if (response.status === 201) {
        //     setToast({
        //         message: 'Project created successfully',
        //         type: 'success',
        //     })
        //     router.push(`/project/${response.data.id}`)
        // } else {
        //     setToast({
        //         message: 'Failed to create project',
        //         type: 'error',
        //     })
        // }
    }

    const handleDesignTokenSave = (data) => {
        setTheme(data)
        setCurrentStep('summary')
    }

    const renderStepContent = () => {
        switch (currentStep) {
            case 'naming':
                return (
                    <div className="space-y-4">
                        <motion.h4
                            className="text-2xl mb-4 md:text-3xl font-extrabold text-start w-full  bg-gradient-to-r from-gray-300 via-gray-500 to-gray-700 bg-clip-text text-transparent"
                            initial={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            Name your project
                        </motion.h4>
                        <div className="relative">
                            <InputField
                                type="text"
                                value={name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                placeholder="Enter project name"
                                className={`w-full ${errors.name ? 'border-red-500' : ''}`}
                                showButton={true}
                                buttonAnimation={true}
                                RightIcon={ArrowRight}
                                onSubmit={() => setCurrentStep('runtime')}
                            />
                        </div>
                        {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
                    </div>
                );
            case 'runtime':
                return <ConfigurationStep handleRuntimeSelect={handleRuntimeSelect} />
            case 'ui-lib':
                return <UILibStep runtime={runtimeId} handleUiLibSelect={handleUiLibSelect} setFonts={(fonts) => setPageSettings({ ...pageSettings, fonts })} setMainFont={(font) => setPageSettings({ ...pageSettings, fontFamily: font })} />
            // case 'theme':
            //     return <ThemeSelectionInterface onSelectOption={(step) => setCurrentStep(step)} />
            // case 'ai':
            //     return <SimpleAi />
            // case 'custom':
            //     return <DesignTokenWrapperStep handleNext={handleDesignTokenSave} />
            // case 'template':
            //     return
            case 'customization':
                return
            case 'summary':
                return <SaveProjectStep
                    handleProjectSave={handleProjectSave}
                    name={name}
                    runtimeId={runtimeId}
                    uiLibIds={uiLibIds}
                    theme={theme}
                    pageSettings={pageSettings}
                />
            case 'end':
                return <div><Toast {...toast} /></div>
            default:
                return null;
        }
    };

    return (
        <div className="flex flex-col items-start justify-between px-4 mt-8 mx-auto w-full max-w-7xl sm:overflow-visible overflow-hidden">
            <motion.h3
                className="text-3xl mb-4 sm:mb-12 md:text-4xl font-extrabold text-start w-full  bg-gradient-to-r from-gray-300 via-gray-500 to-gray-700 bg-clip-text text-transparent"
                initial={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                Project creation wizard
            </motion.h3>
            <div className="flex flex-col sm:flex-row items-start justify-between w-full">
                <div className="sm:w-1/4 sm:mr-8 w-full sm:mb-0 mb-4">
                    <div className="flex flex-row justify-center sm:flex-col sm:space-y-4 space-x-4 sm:space-x-0">
                        {steps.map((step, index) => {
                            const isCurrentStep = step.steps.includes(currentStep);
                            const isPreviousStep = steps.findIndex(s => s.steps.includes(currentStep)) > index;
                            const isCompleted = isCurrentStep || isPreviousStep;
                            return (
                                <div
                                    key={step.name}
                                    className={`flex flex-col sm:flex-row items-center ${isCompleted ? 'text-purple-500/70' : 'text-gray-500'}`}
                                >
                                    <div
                                        className={`w-11 h-11 rounded-2xl flex items-center justify-center border  ${isCompleted ? 'bg-gradient-to-r from-purple-950/55 to-[#191919] border-purple-800/80' : ' border-white/15 bg-[#191919]'
                                            }`}
                                    >
                                        {isPreviousStep ? (
                                            <Check className="w-5 h-5 text-purple-500/70" />
                                        ) : isCurrentStep ? (
                                            <step.icon className="w-5 h-5 text-purple-500/70" />
                                        ) : (
                                            <step.icon className="w-5 h-5" />
                                        )}
                                    </div>
                                    <span className="ml-2 text-sm sm:block hidden">{step.name}</span>
                                    {isCompleted && (
                                        <div className="w-1 h-full mx-auto sm:my-2 hidden sm:block">
                                            <div
                                                className="w-full bg-blue-500"
                                                style={{
                                                    height: '100%',
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="sm:w-3/4 w-full">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            transition={{ duration: 0.3 }}
                        >
                            {renderStepContent()}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default ProjectCreationWizard;