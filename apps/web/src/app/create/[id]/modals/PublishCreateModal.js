import { Button, InputField } from '@/components/Elements'
import LabelButton from '@/components/Elements/LabelButton'
import Modal from '@/components/Elements/Modal'
import RadioButton from '@/components/Elements/RadioButton'
import TextArea from '@/components/Elements/TextArea'
import CardWrapper from '@/components/Elements/CardWrapper'
import { createComponent, generateAiComponentName, uploadComponentImage } from '@/lib/api'
import { Loader, Save, Sparkles, Copy, Check, Info, Globe2, Lock, Terminal, ChevronUp } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

function PublishCreateModal({ publishModalOpen,
    setPublishModalOpen,
    name, setName,
    description, setDescription,
    privacy, setPrivacy,
    handleSaveComponent,
    image,
    componentId,
    fileTextContent
}) {
    const [isLoading, setIsLoading] = useState(false);
    const [packageManager, setPackageManager] = useState(() => {
        try {
            return localStorage.getItem('preferred_package_manager') || 'npm';
        } catch {
            return 'npm';
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
        return `compify add ${componentId}`;
    }

    const getFullCommand = () => {
        if (installationType === 'prompt') {
            return `Add following files to your project without any changes:
            ${fileTextContent}`;
        }
        // Return all commands for easy copying
        const installCmd = `${packageManager} ${packageManager === 'npm' ? 'install -g' : packageManager === 'yarn' ? 'global add' : 'add -g'} @compify/cli`;
        return showFullSteps ? `${installCmd}\ncompify login\ncompify add ${componentId}` : `compify add ${componentId}`;
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

    return (
        <Modal isOpen={publishModalOpen} onClose={() => setPublishModalOpen(false)} color="hsl(262, 83%, 58%)" backdropColor="hsl(262, 83%, 58%, 0.8)">
            <motion.div
                className="pt-2 w-full sm:w-[600px]"
                onClick={(e) => e.stopPropagation()}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2 }}
            >
                <motion.h2
                    className="text-2xl font-extrabold text-start w-full bg-gradient-to-r from-gray-300 via-gray-500 to-gray-700 bg-clip-text text-transparent mb-6"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    Publish Component
                </motion.h2>

                <div className="space-y-6">
                    {/* Component Details Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
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
                                rows={5}
                            />
                        </div>
                    </motion.div>

                    {/* Privacy Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="border-t border-[rgba(255,255,255,0.15)] pt-4"
                    >
                        <h6 className="text-sm font-medium text-gray-400 mb-3">Privacy Settings</h6>
                        <div className="flex gap-4">
                            <CardWrapper
                                color="hsl(262, 83%, 58%)"
                                onClick={() => setPrivacy('public')}
                                className="flex-1 p-4"
                                hoverEffect={false}
                                isChecked={privacy === 'public'}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 text-sm min-w-10 min-h-10 flex items-center justify-center rounded-2xl bg-opacity-10 bg-[hsl(262,83%,58%)]">
                                        <Globe2 size={24} className="text-gray-300" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-base font-medium text-gray-200">Public</span>
                                        <span className="text-sm text-gray-400">For credit holders • Earn rewards</span>
                                    </div>
                                </div>
                            </CardWrapper>

                            <CardWrapper
                                color="hsl(262, 83%, 58%)"
                                onClick={() => setPrivacy('private')}
                                className="flex-1 p-4"
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
                        </div>
                    </motion.div>

                    {/* Installation Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="border-t border-[rgba(255,255,255,0.15)] pt-6"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <h6 className="text-sm font-medium text-gray-400">Installation</h6>
                                {installationType === 'command' && (showFullSteps ? (
                                    <div className="inline-flex bg-black/30 backdrop-blur-sm rounded-lg p-0.5 border border-white/5">
                                        {['npm', 'yarn', 'pnpm', 'bun'].map((pm) => (
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
                                                                {`${packageManager} ${packageManager === 'npm' ? 'install -g' : packageManager === 'yarn' ? 'global add' : 'add -g'} @compify/cli`}
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
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="w-full flex items-center justify-between gap-4"
                    >
                        <AnimatePresence>
                            {privacy === 'public' ? (
                                <motion.p
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="text-sm text-gray-400 flex-1"
                                >
                                    Component will appear in the public gallery. <a href="/terms" className="text-[hsl(262,83%,58%)] hover:underline">Terms apply</a>
                                </motion.p>
                            ) : (
                                <div className="flex-1" />
                            )}
                        </AnimatePresence>
                        <Button
                            onClick={handleSaveComponent}
                            variant="full"
                            className="w-fit"
                            text="Save Component"
                            Icon={Save}
                        />
                    </motion.div>
                </div>
            </motion.div>
        </Modal>
    )
}

export default PublishCreateModal