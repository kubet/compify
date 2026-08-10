import { Button, InputField } from '@/components/Elements'
import LabelButton from '@/components/Elements/LabelButton'
import Modal from '@/components/Elements/Modal'
import TextArea from '@/components/Elements/TextArea'
import { generateAiComponentName, checkDomain } from '@/lib/api'
import { Loader, Save, Sparkles, Copy, Check, Globe2, Lock, Terminal, X, Eye } from 'lucide-react'
import React, { useEffect, useState, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { useUser } from '@/auth/UseUser'
import UtilityInput from '@/components/Elements/UtilityInput'
import useDebounce from '@/utils/debounce'
import { baseUrl } from '@/constains'

function PublishCreateModal({ publishModalOpen,
    setPublishModalOpen,
    name, setName,
    description, setDescription,
    privacy, setPrivacy,
    publishingDomain, setPublishingDomain,
    handleSaveComponent,
    image,
    componentId,
    fileTextContent
}) {
    const { user } = useUser();
    const [isLoading, setIsLoading] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [installationType, setInstallationType] = useState('command');
    const [isExpanded, setIsExpanded] = useState(false);
    const [actionLabel, setActionLabel] = useState('Save');
    const [selectedVisibility, setSelectedVisibility] = useState('private');
    const wasOpen = useRef(false);
    const [showPublishingDomain, setShowPublishingDomain] = useState(false);
    const [isDomainAvailable, setIsDomainAvailable] = useState(null);
    const [isCheckingDomain, setIsCheckingDomain] = useState(false);

    useEffect(() => {
        if (publishModalOpen && !wasOpen.current) {
            setActionLabel(privacy === 'draft' ? 'Publish' : 'Save');
            setSelectedVisibility(privacy === 'draft' ? 'private' : privacy);
        }
        wasOpen.current = publishModalOpen;
    }, [publishModalOpen, privacy]);

    const handleGenerateAiComponentName = async () => {
        setIsLoading(true);
        const response = await generateAiComponentName({ name, description, image });
        if (response.status === 201) {
            setName(response.data.name);
            setDescription(response.data.description);
        }
        setIsLoading(false);
    }

    const registryPath = publishingDomain && user?.username
        ? `${user.username}/${publishingDomain}`
        : null;
    const isRegistryVisible = selectedVisibility === 'public' || selectedVisibility === 'free';
    const installCommand = registryPath && isRegistryVisible
        ? `bunx shadcn@4.16.2 add ${baseUrl}/r/${registryPath}.json`
        : !isRegistryVisible
            ? 'Choose Public or Unlisted to enable registry installation'
            : 'Set a publishing domain to get your shadcn install command';

    const getInstallCommand = () => {
        if (installationType === 'prompt') {
            const prompt = `Add the following files to your project as-is, without modifications: ${fileTextContent}`;
            return !isExpanded && prompt.length > 90 ? `${prompt.slice(0, 90)}...` : prompt;
        }
        return installCommand;
    };

    const handleCopyCommand = () => {
        navigator.clipboard.writeText(installationType === 'prompt'
            ? `Add the following files to your project as-is, without modifications: ${fileTextContent}`
            : installCommand);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    // Define the callback function with clearer loading state management
    const checkDomainCallback = useCallback(async (domain) => {
        if (!domain) {
            setIsDomainAvailable(null);
            setIsCheckingDomain(false);
            return;
        }

        // Set loading state immediately
        setIsCheckingDomain(true);

        if (!user?.username) {
            setIsDomainAvailable(false);
            setIsCheckingDomain(false);
            return;
        }

        try {
            const response = await checkDomain(domain, componentId);
            setIsDomainAvailable(response.data.available);
        } catch (error) {
            console.error("Error checking domain:", error);
            setIsDomainAvailable(false);
        } finally {
            // Clear loading state after response
            setIsCheckingDomain(false);
        }
    }, [componentId, user?.username]);

    // Use our custom debounce hook with the stable callback
    const debouncedCheckDomain = useDebounce(checkDomainCallback, 500);

    // Effect to check domain availability when it changes
    useEffect(() => {
        // Clear state immediately on empty domain
        if (!publishingDomain) {
            setIsDomainAvailable(null);
            setIsCheckingDomain(false);
            setShowPublishingDomain(false);
            return;
        } else {
            setShowPublishingDomain(true);
        }

        // Set checking state before debounce to provide immediate feedback
        setIsCheckingDomain(true);
        debouncedCheckDomain(publishingDomain);
    }, [publishingDomain, debouncedCheckDomain]);

    const handleShowPublishingDomain = () => {
        setPublishingDomain(name.toLowerCase().replace(/\s+/g, '-'));
        setShowPublishingDomain(true);
    }

    const handlePublishOrSave = async () => {
        const saved = await handleSaveComponent(null, selectedVisibility);
        if (saved) setPrivacy(selectedVisibility);
    };

    return (
        <Modal isOpen={publishModalOpen} onClose={() => setPublishModalOpen(false)} color="hsl(262, 83%, 58%)" backdropColor="hsl(262, 83%, 58%, 0.8)">
            <motion.div
                className="pt-2 w-full sm:w-[600px]"
                onClick={(e) => e.stopPropagation()}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.15 }}
            >
                <motion.h2
                    className="text-2xl font-extrabold text-start w-full bg-gradient-to-r from-gray-300 via-gray-500 to-gray-700 bg-clip-text text-transparent mb-6"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    Publish Component
                </motion.h2>

                <div className="space-y-6">
                    {/* Component Details Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.15, delay: 0.05 }}
                        className="space-y-3"
                    >
                        <div className="flex items-center justify-between">
                            <h6 className="text-sm font-medium text-gray-400">Component Details</h6>
                            <LabelButton
                                onClick={handleGenerateAiComponentName}
                                Icon={isLoading ? Loader : Sparkles}
                                variant="primary"
                                isDisabled={isLoading}
                                className="!py-1.5"
                            >
                                Fill with AI
                            </LabelButton>
                        </div>
                        <div className="space-y-3">
                            <InputField
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Component Name"
                                className="w-full bg-black/30 border-white/5 backdrop-blur-sm"
                            />

                            <TextArea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Component Description"
                                className="w-full bg-black/30 border-white/5 backdrop-blur-sm"
                                rows={3}
                            />

                            {user?.username && (!showPublishingDomain ? (
                                <LabelButton
                                    onClick={handleShowPublishingDomain}
                                    Icon={Globe2}
                                    variant="primary"
                                    className="justify-center !py-2"
                                >
                                    Set Publishing Domain
                                </LabelButton>
                            ) : (
                                <UtilityInput
                                    value={publishingDomain}
                                    onChange={(e) => setPublishingDomain(e.target.value)}
                                    placeholder={name}
                                    className="w-full bg-black/30 border-white/5 backdrop-blur-sm"
                                    RightIcon={() => {
                                        if (isCheckingDomain) {
                                            return (
                                                <svg className="animate-spin h-4 w-4 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                            );
                                        }
                                        return publishingDomain ? (isDomainAvailable ? <Check className="text-green-500" /> : <X className="text-red-500" />) : null;
                                    }}
                                    showButton={true}
                                    StartElement={<span className="text-gray-400">@{user.username}/</span>}
                                />
                            ))}
                        </div>
                    </motion.div>

                    {/* Visibility Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.15, delay: 0.1 }}
                        className="border-t border-[rgba(255,255,255,0.15)] pt-4"
                    >
                        <h6 id="visibility-label" className="text-sm font-medium text-gray-400 mb-3">Visibility</h6>
                        <div role="radiogroup" aria-labelledby="visibility-label" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {[
                                { value: 'public', label: 'Public', description: 'Listed in the gallery', Icon: Globe2 },
                                { value: 'free', label: 'Unlisted', description: 'Accessible by link', Icon: Eye },
                                { value: 'private', label: 'Private', description: 'Only visible to you', Icon: Lock },
                            ].map(({ value, label, description: visibilityDescription, Icon }) => {
                                const checked = selectedVisibility === value;
                                return (
                                    <button
                                        key={value}
                                        type="button"
                                        role="radio"
                                        aria-checked={checked}
                                        onClick={() => setSelectedVisibility(value)}
                                        className={`relative rounded-3xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 ${checked
                                            ? 'border-white/30 bg-white/[0.08] ring-1 ring-white/20'
                                            : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Icon size={22} className="text-gray-300 shrink-0" />
                                            <div className="flex flex-col">
                                                <span className="text-base font-medium text-gray-200">{label}</span>
                                                <span className="text-xs text-gray-400">{visibilityDescription}</span>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>

                    {/* Installation Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.15, delay: 0.15 }}
                        className="border-t border-[rgba(255,255,255,0.15)] pt-6"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <h6 className="text-sm font-medium text-gray-400">Install after publishing</h6>
                            <div className="inline-flex bg-black/30 backdrop-blur-sm rounded-lg p-0.5 border border-white/5">
                                {['command', 'prompt'].map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setInstallationType(type)}
                                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 ${installationType === type
                                            ? 'bg-white/10 text-white shadow-sm'
                                            : 'text-gray-400 hover:text-white/90'
                                            }`}
                                    >
                                        {type === 'command' ? 'shadcn' : 'AI Prompt'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleCopyCommand}
                            disabled={installationType === 'command' && (!registryPath || !isRegistryVisible)}
                            className="group flex w-full items-center gap-3 rounded-xl border border-purple-400/30 bg-purple-500/10 px-4 py-3 text-left transition hover:bg-purple-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {installationType === 'command' ? <Terminal size={20} className="text-purple-300 shrink-0" /> : <Sparkles size={20} className="text-purple-300 shrink-0" />}
                            <code className={`font-mono text-sm text-gray-200 flex-1 min-w-0 ${installationType === 'prompt' && !isExpanded ? 'truncate' : 'break-all'}`}>
                                {getInstallCommand()}
                            </code>

                            {isCopied ? <Check size={16} className="text-green-400 shrink-0" /> : <Copy size={16} className="text-gray-400 shrink-0" />}
                        </button>
                        {installationType === 'prompt' && (
                            <button
                                type="button"
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="mt-2 text-xs text-purple-300 hover:text-purple-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                            >
                                {isExpanded ? 'Show less' : 'Show full prompt'}
                            </button>
                        )}
                        <p className="mt-2 text-xs text-gray-500">Uses the public shadcn registry URL directly; no Compify account or CLI is required to install.</p>
                    </motion.div>

                    {/* Action Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.15, delay: 0.2 }}
                        className="w-full flex items-center justify-between gap-4"
                    >
                        <p className="text-sm text-gray-400 flex-1">
                            {selectedVisibility === 'public'
                                ? 'Listed publicly in the gallery.'
                                : selectedVisibility === 'free'
                                    ? 'Unlisted and accessible to anyone with the link.'
                                    : 'Private and visible only to you.'}
                        </p>
                        <Button
                            onClick={handlePublishOrSave}
                            variant="full"
                            className="w-fit"
                            text={actionLabel}
                            Icon={Save}
                            disabled={(selectedVisibility === 'public' || selectedVisibility === 'free') && (!registryPath || isCheckingDomain || !isDomainAvailable)}
                        />
                    </motion.div>
                </div>
            </motion.div>
        </Modal>
    )
}

export default PublishCreateModal