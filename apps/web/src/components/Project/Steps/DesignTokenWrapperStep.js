import React, { useCallback, useState, useEffect, useMemo } from 'react'
import DesignTokens from './DesignTokens';
import LabelButton from '@/components/Elements/LabelButton';
import keyReplace from '../utils';
import BotInput from '@/components/Editor/Elements/BotInput';
import { InputField } from '@/components/Elements';
import { Send, Bot, Sparkles, Palette, Layout, Type, Grid, Moon, TextQuote, LayoutGrid, BoxSelect, X, Loader, ArrowRight, Check, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { deleteTheme, generateTokens } from '@/lib/api';
import ConfirmationModal from '@/components/Common/ConfirmationModal';
import { useRouter } from 'next/navigation';
import HelpModal from '@/components/Elements/HelpModal';
import HelpThemeContent from '@/components/Editor/Elements/BotInputSnackContent/HelpThemeContent';

function DesignTokenWrapperStep({ handleNext, initialData }) {
    const router = useRouter();
    const [factors, setFactors] = useState(initialData?.factors || []);
    const [groups, setGroups] = useState(
        initialData?.groups && !Array.isArray(initialData.groups) ? initialData.groups : {}
    );
    const [values, setValues] = useState(initialData?.values || []);
    const [showAiInput, setShowAiInput] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [aiResponse, setAiResponse] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [backupState, setBackupState] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showHelpModal, setShowHelpModal] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    const getAllTokens = useMemo(() => {
        const factorTokens = factors.map(factor => ({ key: factor.key, value: factor.value, c: factor.c }));
        const groupTokens = Object.entries(groups).flatMap(([groupKey, group]) =>
            group.options.map(item => ({ key: `${groupKey}-${item.key}`, value: item.value, c: item.c }))
        );
        return [...factorTokens, ...groupTokens, ...values];
    }, [factors, groups, values]);

    const compileValue = useCallback((value, tokens) => {
        if (typeof value !== 'string') {
            return value; // Return non-string values as-is
        }
        let compiledValue = keyReplace(tokens, value);
        // Check if the compiled value still contains token references
        if (typeof compiledValue === 'string' && compiledValue.includes('--')) {
            compiledValue = keyReplace(tokens, compiledValue);
        }
        return compiledValue;
    }, []);

    const updateCompiledValues = useCallback(() => {
        const allTokens = getAllTokens;

        const updatedFactors = factors.map(factor => ({
            ...factor,
            c: compileValue(factor.value, allTokens)
        }));

        const updatedGroups = Object.fromEntries(
            Object.entries(groups).map(([key, group]) => [
                key,
                {
                    ...group,
                    options: group.options.map(item => ({
                        ...item,
                        c: compileValue(item.value, allTokens)
                    }))
                }
            ])
        );

        const updatedValues = values.map(value => ({
            ...value,
            c: compileValue(value.value, allTokens)
        }));

        return { updatedFactors, updatedGroups, updatedValues };
    }, [compileValue, getAllTokens, factors, groups, values]);

    useEffect(() => {
        const { updatedFactors, updatedGroups, updatedValues } = updateCompiledValues();

        setFactors(prevFactors => {
            if (JSON.stringify(prevFactors) !== JSON.stringify(updatedFactors)) {
                return updatedFactors;
            }
            return prevFactors;
        });

        setGroups(prevGroups => {
            if (JSON.stringify(prevGroups) !== JSON.stringify(updatedGroups)) {
                return updatedGroups;
            }
            return prevGroups;
        });

        setValues(prevValues => {
            if (JSON.stringify(prevValues) !== JSON.stringify(updatedValues)) {
                return updatedValues;
            }
            return prevValues;
        });
    }, [updateCompiledValues]);

    const handleGenerateDesign = async () => {
        setIsGenerating(true);
        try {
            setBackupState({
                factors: [...factors],
                groups: { ...groups },
                values: [...values]
            });

            const response = await generateTokens({ prompt, currentTokens: getAllTokens });
            setAiResponse(response?.data);

            if (response?.data) {
                setFactors(response.data.factors || []);
                setGroups(response.data.groups || {});
                setValues(response.data.values || []);
            }
        } catch (error) {
            console.error('Failed to generate design:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleAIDecline = () => {
        if (backupState) {
            setFactors(backupState.factors);
            setGroups(backupState.groups);
            setValues(backupState.values);
        }
        setAiResponse(null);
        setShowAiInput(false);
        setBackupState(null);
    };

    const handleAIAccept = () => {
        setAiResponse(null);
        setShowAiInput(false);
        setBackupState(null);
    };

    const handleDeleteClick = () => {
        setShowDeleteModal(true);
    };

    const handleDeleteTheme = async () => {
        if (!initialData?.id) return;
        const resp = await deleteTheme(initialData.id, initialData.etag);
        if (resp.status === 200 || resp.status === 201) {
            router.push('/my-components');
        } else if (resp.status === 409) {
            setDeleteError('This theme changed in another tab. Reload the page before deleting it.');
            setShowDeleteModal(false);
        } else if (resp.status === 404) {
            setDeleteError('This theme no longer exists or you no longer have access. Return to your components.');
            setShowDeleteModal(false);
        } else {
            setDeleteError('The theme could not be deleted. Reload the page and try again.');
            setShowDeleteModal(false);
        }
    }

    return (
        <div className="min-h-[calc(100vh-12rem)] relative space-y-8">
            {deleteError && <p className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{deleteError}</p>}
            {/* Design Tokens Section */}
            <div>
                <div className="flex items-center justify-between mb-6">

                    <motion.h4
                        className="text-xl mb-4 md:text-2xl font-extrabold text-start bg-gradient-to-r from-gray-300 via-gray-400 to-gray-500 bg-clip-text text-transparent flex items-center gap-2"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        Design Tokens
                        <motion.button
                            className="bg-white/10 text-sm hover:bg-white/20 text-white rounded-full w-6 h-6 flex items-center justify-center focus:outline-none backdrop-blur-sm"
                            onClick={() => setShowHelpModal(true)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            ?
                        </motion.button>
                    </motion.h4>
                    <motion.button
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white/90 transition-all"
                        onClick={() => setShowAiInput(prev => !prev)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {showAiInput ? (
                            <>
                                <X size={18} />
                                <span>Close AI</span>
                            </>
                        ) : (
                            <>
                                <Sparkles size={18} />
                                <span>AI Assist</span>
                            </>
                        )}
                    </motion.button>
                </div>

                {/* AI Input Section */}
                <AnimatePresence>
                    {showAiInput && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden mb-6"
                        >
                            <div className="bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm p-4">
                                <div className="relative">
                                    <InputField
                                        placeholder="Enhance your design system with AI..."
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        onSubmit={() => handleGenerateDesign()}
                                        showButton={true}
                                        RightIcon={isGenerating ? Loader : Send}
                                        iconClassName={isGenerating ? "animate-spin" : ""}
                                        disabled={isGenerating}
                                        blurBackground={true}
                                        StartIcon={Bot}
                                        startIconClassName="text-primary/80"
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* AI Response Interface */}
                <AnimatePresence>
                    {aiResponse && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm p-4 mb-6"
                        >
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-white/90">AI Suggestions</h3>
                                <div className="flex gap-2">
                                    <motion.button
                                        className="px-4 py-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 flex items-center gap-2"
                                        onClick={handleAIDecline}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <X size={16} />
                                        <span>Decline</span>
                                    </motion.button>
                                    <motion.button
                                        className="px-4 py-2 rounded-lg bg-green-500/20 text-green-300 hover:bg-green-500/30 flex items-center gap-2"
                                        onClick={handleAIAccept}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <Check size={16} />
                                        <span>Accept</span>
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <DesignTokens
                    factors={factors}
                    groups={groups}
                    values={values}
                    setFactors={setFactors}
                    setGroups={setGroups}
                    setValues={setValues}
                />
            </div>

            {/* Bottom Button */}
            <div className="sticky bottom-0 left-0 right-0 bg-black bg-opacity-50 backdrop-blur-sm z-30 m-0">
                <div className="px-0 py-7 w-full flex justify-between">
                    {initialData?.id && <LabelButton
                        onClick={handleDeleteClick}
                        variant="danger"
                        fullWidth
                    >
                        Delete Theme
                    </LabelButton>}
                    <LabelButton
                        onClick={() => handleNext({ factors, groups, values })}
                        variant="info"
                        fullWidth
                    >
                        {initialData ? 'Update theme' : 'Save and continue'}
                    </LabelButton>
                </div>
            </div>
            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDeleteTheme}
                title="Delete Theme"
                description="Are you sure you want to delete this theme? This action cannot be undone."
                confirmText="Delete Theme"
                cancelText="Cancel"
                variant="danger"
            />
            <HelpModal
                isOpen={showHelpModal}
                onClose={() => setShowHelpModal(false)}
                title="Design System Tokens"
            >
                <HelpThemeContent />
            </HelpModal>
        </div>
    );
}

export default DesignTokenWrapperStep