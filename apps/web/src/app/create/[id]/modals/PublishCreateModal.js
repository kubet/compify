import { Button, InputField } from '@/components/Elements'
import LabelButton from '@/components/Elements/LabelButton'
import Modal from '@/components/Elements/Modal'
import RadioButton from '@/components/Elements/RadioButton'
import TextArea from '@/components/Elements/TextArea'
import CardWrapper from '@/components/Elements/CardWrapper'
import { createComponent, generateAiComponentName, uploadComponentImage, checkDomain } from '@/lib/api'
import { Loader, Save, Sparkles, Copy, Check, Info, Globe2, Lock, Terminal, ChevronUp, ArrowLeft, X } from 'lucide-react'
import React, { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useUser } from '@/auth/UseUser'
import UtilityInput from '@/components/Elements/UtilityInput'
import useDebounce from '@/utils/debounce'

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
    const [packageManager, setPackageManager] = useState(() => {
        try {
            return localStorage.getItem('preferred_package_manager') || 'bun';
        } catch {
            return 'bun';
        }
    });
    const [isCopied, setIsCopied] = useState(false);
    const [installationType, setInstallationType] = useState(() => {
        try {
            return localStorage.getItem('preferred_installation_type') || 'command';
        } catch {
            return 'command';
        }
    });
    const [isExpanded, setIsExpanded] = useState(false);
    const [hasSeenFullSteps, setHasSeenFullSteps] = useState(() => {
        try {
            return localStorage.getItem('has_seen_install_steps') === 'true';
        } catch {
            return false;
        }
    });
    const [showFullSteps, setShowFullSteps] = useState(!hasSeenFullSteps);
    const [publicSubOptionVisible, setPublicSubOptionVisible] = useState(false);
    const [publicSubOption, setPublicSubOption] = useState(null);
    const [showPublishingDomain, setShowPublishingDomain] = useState(false);
    const [isDomainAvailable, setIsDomainAvailable] = useState(null);
    const [isCheckingDomain, setIsCheckingDomain] = useState(false);

    useEffect(() => {
        if (publishModalOpen && privacy === 'draft') {
            setPrivacy('private');
        }
    }, [publishModalOpen, privacy, setPrivacy]);

    // Save preferences when they change
    useEffect(() => {
        try {
            localStorage.setItem('preferred_package_manager', packageManager);
        } catch { }
    }, [packageManager]);

    useEffect(() => {
        try {
            localStorage.setItem('preferred_installation_type', installationType);
        } catch { }
    }, [installationType]);

    const handleGenerateAiComponentName = async () => {
        setIsLoading(true);
        const response = await generateAiComponentName({ name, description, image });
        if (response.status === 201) {
            setName(response.data.name);
            setDescription(response.data.description);
        }
        setIsLoading(false);
    }

    const getInstallCommand = () => {
        if (installationType === 'prompt') {
            const prompt = `Add the following files to your project as-is, without modifications: ${fileTextContent}`;
            if (!isExpanded) {
                return prompt.length > 90 ? prompt.slice(0, 90) + '...' : prompt;
            }
            return prompt;
        }
        return `compify add ${publishingDomain ? `@${user.username}/${publishingDomain}` : componentId}`;
    }

    const getFullCommand = () => {
        if (installationType === 'prompt') {
            return `Add following files to your project without any changes:
            ${fileTextContent}`;
        }
        // Return all commands for easy copying
        const installCmd = `bun add --global @compify/cli`;
        return showFullSteps ? `${installCmd}\ncompify login\ncompify add ${publishingDomain ? `@${user.username}/${publishingDomain}` : componentId}` : `compify add ${publishingDomain ? `@${user.username}/${publishingDomain}` : componentId}`;
    }

    const handleCopyCommand = () => {
        navigator.clipboard.writeText(getFullCommand());
        setIsCopied(true);
        setTimeout(() => {
            setIsCopied(false);
        }, 2000);
    }

    useEffect(() => {
        if (showFullSteps) {
            try {
                localStorage.setItem('has_seen_install_steps', 'true');
            } catch { }
        }
    }, [showFullSteps]);

    const getPrivacyDescription = () => {
        if (privacy === 'public') {
            return 'Premium';
        }
        if (privacy === 'free') {
            return 'Free';
        }
        return 'Share with the community';
    }

    // Define the callback function with clearer loading state management
    const checkDomainCallback = useCallback(async (domain) => {
        if (!domain) {
            setIsDomainAvailable(null);
            setIsCheckingDomain(false);
            return;
        }

        // Set loading state immediately
        setIsCheckingDomain(true);

        try {
            const response = await checkDomain(user.username + '/' + domain, componentId);
            setIsDomainAvailable(response.data.available);
        } catch (error) {
            console.error("Error checking domain:", error);
            setIsDomainAvailable(false);
        } finally {
            // Clear loading state after response
            setIsCheckingDomain(false);
        }
    }, [user.username]);

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

                    {/* Privacy Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.15, delay: 0.1 }}
                        className="border-t border-[rgba(255,255,255,0.15)] pt-4"
                    >
                        <div className="flex items-center">
                            <AnimatePresence mode="wait" initial={false}>
                                {publicSubOptionVisible ? (
                                    <motion.div
                                        className="flex items-center text-sm mb-3"
                                        initial={{ opacity: 0, x: 5 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -5 }}
                                        transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
                                        key="public-options-heading"
                                    >
                                        <button
                                            onClick={() => setPublicSubOptionVisible(false)}
                                            className="text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
                                        >
                                            <ChevronUp size={16} className="rotate-90" />
                                            Privacy Settings
                                        </button>
                                        <span className="mx-2 text-gray-500">›</span>
                                        <span className="text-gray-400">Public Options</span>
                                    </motion.div>
                                ) : (
                                    <motion.h6
                                        className="text-sm font-medium text-gray-400 mb-3"
                                        initial={{ opacity: 0, x: -5 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 5 }}
                                        transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
                                        key="privacy-heading"
                                    >
                                        Privacy Settings
                                    </motion.h6>
                                )}
                            </AnimatePresence>
                        </div>

                        <AnimatePresence mode="wait" initial={false}>
                            {publicSubOptionVisible ? (
                                <motion.div
                                    className="flex gap-4"
                                    initial={{
                                        x: 20,
                                        opacity: 0,
                                    }}
                                    animate={{
                                        x: 0,
                                        opacity: 1,
                                    }}
                                    exit={{
                                        x: -20,
                                        opacity: 0,
                                        transition: {
                                            duration: 0.15
                                        }
                                    }}
                                    transition={{
                                        duration: 0.2,
                                        ease: [0.32, 0.72, 0, 1]
                                    }}
                                    key="public-options"
                                >
                                    <CardWrapper
                                        color="hsl(262, 83%, 58%)"
                                        onClick={() => {
                                            setPublicSubOption('public');
                                            setPrivacy('public');
                                        }}
                                        className="flex-1 p-4 transition-transform active:scale-[0.98] duration-75"
                                        hoverEffect={false}
                                        isChecked={publicSubOption === 'public'}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 text-sm min-w-10 min-h-10 flex items-center justify-center rounded-2xl bg-opacity-10 bg-[hsl(262,83%,58%)]">
                                                <Globe2 size={24} className="text-gray-300" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-base font-medium text-gray-200">Premium</span>
                                                <span className="text-sm text-gray-400">Earn credits</span>
                                            </div>
                                        </div>
                                    </CardWrapper>

                                    <CardWrapper
                                        color="hsl(262, 83%, 58%)"
                                        onClick={() => {
                                            setPublicSubOption('free');
                                            setPrivacy('free');
                                        }}
                                        className="flex-1 p-4 transition-transform active:scale-[0.98] duration-75"
                                        hoverEffect={false}
                                        isChecked={publicSubOption === 'free'}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 text-sm min-w-10 min-h-10 flex items-center justify-center rounded-2xl bg-opacity-10 bg-[hsl(262,83%,58%)]">
                                                <Globe2 size={24} className="text-gray-300" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-base font-medium text-gray-200">Free</span>
                                                <span className="text-sm text-gray-400">Share with the community</span>
                                            </div>
                                        </div>
                                    </CardWrapper>
                                </motion.div>
                            ) : (
                                <motion.div
                                    className="flex gap-4"
                                    initial={{
                                        x: -20,
                                        opacity: 0,
                                    }}
                                    animate={{
                                        x: 0,
                                        opacity: 1,
                                    }}
                                    exit={{
                                        x: 20,
                                        opacity: 0,
                                        transition: {
                                            duration: 0.15
                                        }
                                    }}
                                    transition={{
                                        duration: 0.2,
                                        ease: [0.32, 0.72, 0, 1]
                                    }}
                                    key="privacy-options"
                                >
                                    <CardWrapper
                                        color="hsl(262, 83%, 58%)"
                                        onClick={() => {
                                            setPrivacy('public-options');
                                            setPublicSubOptionVisible(true);
                                        }}
                                        className="flex-1 p-4 transition-transform active:scale-[0.98] duration-75"
                                        hoverEffect={false}
                                        isChecked={privacy === 'public' || privacy === 'free'}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 text-sm min-w-10 min-h-10 flex items-center justify-center rounded-2xl bg-opacity-10 bg-[hsl(262,83%,58%)]">
                                                <Globe2 size={24} className="text-gray-300" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-base font-medium text-gray-200">Public</span>
                                                <span className="text-sm text-gray-400">{getPrivacyDescription()}</span>
                                            </div>
                                        </div>
                                    </CardWrapper>

                                    <CardWrapper
                                        color="hsl(262, 83%, 58%)"
                                        onClick={() => setPrivacy('private')}
                                        className="flex-1 p-4 transition-transform active:scale-[0.98] duration-75"
                                        hoverEffect={false}
                                        isChecked={privacy === 'private'}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 text-sm min-w-10 min-h-10 flex items-center justify-center rounded-2xl bg-opacity-10 bg-[hsl(262,83%,58%)]">
                                                <Lock size={24} className="text-gray-300" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-base font-medium text-gray-200">Private</span>
                                                <span className="text-sm text-gray-400">Only visible to you</span>
                                            </div>
                                        </div>
                                    </CardWrapper>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    {/* Installation Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.15, delay: 0.15 }}
                        className="border-t border-[rgba(255,255,255,0.15)] pt-6"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <h6 className="text-sm font-medium text-gray-400">Installation</h6>
                                {installationType === 'command' && (showFullSteps ? (
                                    <div className="inline-flex bg-black/30 backdrop-blur-sm rounded-lg p-0.5 border border-white/5">
                                        {['bun'].map((pm) => (
                                            <button
                                                key={pm}
                                                onClick={() => setPackageManager(pm)}
                                                className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 ${packageManager === pm
                                                    ? 'bg-white/10 text-white shadow-sm'
                                                    : 'text-gray-400 hover:text-white/90'
                                                    }`}
                                            >
                                                {pm}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setShowFullSteps(true)}
                                        className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                                    >
                                        Show full steps
                                    </button>
                                ))}
                            </div>
                            <div className="inline-flex bg-black/30 backdrop-blur-sm rounded-lg p-0.5 border border-white/5">
                                {['command', 'prompt'].map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setInstallationType(type)}
                                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 capitalize ${installationType === type
                                            ? 'bg-white/10 text-white shadow-sm'
                                            : 'text-gray-400 hover:text-white/90'
                                            }`}
                                    >
                                        {type === 'command' ? 'Install' : 'AI Prompt'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Main Installation Card */}
                        <div
                            className="relative rounded-3xl shadow-md overflow-hidden border-[rgba(255,255,255,0.1)] border w-full"
                            style={{
                                backdropFilter: 'blur(20px)',
                                WebkitBackdropFilter: 'blur(20px)',
                            }}
                        >
                            <div className="absolute inset-0 bg-[rgba(255,255,255,0.03)]" />

                            {/* Command View */}
                            <div className="relative p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 text-sm min-w-10 min-h-10 flex items-center justify-center rounded-2xl bg-opacity-10 bg-[hsl(262,83%,58%)]">
                                        {installationType === 'command' ? (
                                            <Terminal size={24} className="text-gray-300" />
                                        ) : (
                                            <Sparkles size={24} className="text-gray-300" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        {installationType === 'command' ? (
                                            <div className="space-y-2">
                                                {showFullSteps ? (
                                                    <>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-5 h-5 flex items-center justify-center rounded-full bg-purple-500/10 text-purple-300 text-xs font-medium">1</div>
                                                            <code className="font-mono text-sm text-gray-300 flex-1">
                                                                {`bun add --global @compify/cli`}
                                                            </code>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-5 h-5 flex items-center justify-center rounded-full bg-purple-500/10 text-purple-300 text-xs font-medium">2</div>
                                                            <code className="font-mono text-sm text-gray-300">compify login</code>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-5 h-5 flex items-center justify-center rounded-full bg-purple-500/10 text-purple-300 text-xs font-medium">3</div>
                                                            <code className="font-mono text-sm text-gray-300">{getInstallCommand()}</code>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <code className="font-mono text-sm text-gray-300">{getInstallCommand()}</code>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <code className={`font-mono text-sm text-gray-300 min-w-0 overflow-x-hidden ${!isExpanded ? 'line-clamp-1' : 'max-h-24 overflow-y-auto pr-2'}`}>
                                                    {getInstallCommand()}
                                                </code>
                                                <button
                                                    onClick={() => setIsExpanded(!isExpanded)}
                                                    className="text-gray-400 hover:text-white transition-colors text-xs underline underline-offset-2 flex-shrink-0 self-start pt-0.5"
                                                >
                                                    {isExpanded ? 'Show less' : 'Show more'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <button
                                            onClick={handleCopyCommand}
                                            className="text-gray-400 hover:text-white transition-colors p-1.5 hover:bg-white/5 rounded-md flex-shrink-0 group relative"
                                            title={showFullSteps ? "Copy all commands" : "Copy command"}
                                        >
                                            {isCopied ? <Check size={14} /> : <Copy size={14} />}
                                        </button>
                                        {showFullSteps && installationType === 'command' && (
                                            <button
                                                onClick={() => setShowFullSteps(false)}
                                                className="text-gray-400 hover:text-white transition-colors p-1.5 hover:bg-white/5 rounded-md flex-shrink-0"
                                                title="Hide steps"
                                            >
                                                <ChevronUp size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {!showFullSteps && installationType === 'command' && (
                            <div className="mt-2 ml-3">
                                <LabelButton
                                    Icon={Info}
                                    className="text-sm"
                                    variant="info"
                                >
                                    <Link href="https://www.npmjs.com/package/@compify/cli?activeTab=readme" target="_blank">
                                        View installation guide
                                    </Link>
                                </LabelButton>
                            </div>
                        )}
                    </motion.div>

                    {/* Action Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.15, delay: 0.2 }}
                        className="w-full flex items-center justify-between gap-4"
                    >
                        <AnimatePresence mode="wait" initial={false}>
                            {(privacy === 'public-options' || privacy === 'public' || privacy === 'free') ? (
                                <motion.p
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    transition={{
                                        duration: 0.15,
                                        ease: [0.32, 0.72, 0, 1]
                                    }}
                                    className="text-sm text-gray-400 flex-1"
                                >
                                    Component will appear in the public gallery. <a href="/terms" className="text-[hsl(262,83%,58%)] hover:underline">Terms apply</a>
                                </motion.p>
                            ) : (
                                <motion.div
                                    className="flex-1"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                />
                            )}
                        </AnimatePresence>
                        <Button
                            onClick={handleSaveComponent}
                            variant="full"
                            className="w-fit"
                            text="Save Component"
                            Icon={Save}
                            disabled={privacy === 'public-options'}
                        />
                    </motion.div>
                </div>
            </motion.div>
        </Modal>
    )
}

export default PublishCreateModal