'use client';

import Button from '@/components/Elements/Button';
import Chip from '@/components/Elements/Chip';
import { Code2, Heart, Boxes, PackageOpen, Share2, Check, Terminal, Copy } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { baseUrl } from '@/constains';
import { motion } from 'framer-motion';
import { useUser } from '@/auth/UseUser';
import { runtimeLables, uiLibsLabels } from '@/components/Editor/Templates/common';
import { useEffect, useState } from 'react';

const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
};

const fadeInRight = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.5 }
};

const stagger = {
    animate: {
        transition: {
            staggerChildren: 0.1
        }
    }
};

const shareOptions = [
    {
        id: 'copy',
        label: 'Copy URL',
        color: 'text-white',
        action: async (url, title) => {
            await navigator.clipboard.writeText(url);
            return true;
        }
    },
    {
        id: 'x',
        label: 'X',
        color: 'text-white/80',
        action: (url, title) => {
            window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, '_blank');
        }
    },
    {
        id: 'bluesky',
        label: 'Bluesky',
        color: 'text-white/80',
        action: (url, title) => {
            window.open(`https://bsky.app/intent/compose?text=${encodeURIComponent(title + ' ' + url)}`, '_blank');
        }
    },
    {
        id: 'linkedin',
        label: 'LinkedIn',
        color: 'text-white/80',
        action: (url, title) => {
            window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
        }
    },
    {
        id: 'reddit',
        label: 'Reddit',
        color: 'text-white/80',
        action: (url, title) => {
            window.open(`https://www.reddit.com/submit?url=${encodeURIComponent(url)}`, '_blank');
        }
    },
    {
        id: 'facebook',
        label: 'Facebook',
        color: 'text-white/80',
        action: (url, title) => {
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        }
    },
    {
        id: 'mastodon',
        label: 'Mastodon',
        color: 'text-white/80',
        action: (url, title) => {
            window.open(`https://toot.kytta.dev/?text=${encodeURIComponent(title + '\n\n' + url)}`, '_blank');
        }
    }
];


function InstallCommand({ label, command }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(command);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            onClick={handleCopy}
            className="group flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left transition hover:border-purple-400/30 hover:bg-white/[0.05]"
        >
            <span className="shrink-0 rounded-md bg-purple-500/10 px-2 py-0.5 text-xs font-medium text-purple-300">{label}</span>
            <code className="flex-1 overflow-x-auto whitespace-nowrap text-sm text-gray-300 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{command}</code>
            {copied ? <Check size={16} className="shrink-0 text-green-400" /> : <Copy size={16} className="shrink-0 text-gray-500 group-hover:text-gray-300" />}
        </button>
    );
}

export default function ComponentDisplay({ data }) {
    const { isSignedIn } = useUser();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [showCopied, setShowCopied] = useState(false);
    const [installCopied, setInstallCopied] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return null;
    }

    const { name, description, language, usedUiFrameworks, upvotesCount, publishingDomain } = data;
    const registryPath = publishingDomain?.replace(/^compify\//, '');
    const installCommand = registryPath
        ? `bunx shadcn@4.16.2 add ${baseUrl}/r/${registryPath}.json`
        : null;

    const handleInstallCopy = async () => {
        if (!installCommand) return;
        await navigator.clipboard.writeText(installCommand);
        setInstallCopied(true);
        setTimeout(() => setInstallCopied(false), 2000);
    };

    const filteredUsedUiFrameworks = usedUiFrameworks.filter(framework => framework !== 'theme');


    const handleClick = () => {
        if (isSignedIn) {
            router.push(`/create/${data.id}`);
        } else {
            localStorage.setItem('afterLoginForwardLink', window.location.pathname);
            router.push('/login');
        }
    };

    const handleShare = async (type = 'copy') => {
        const url = window.location.href;
        const title = `Check out this awesome component: ${name}`;

        const shareOption = shareOptions.find(option => option.id === type);
        if (shareOption) {
            const shouldShowCopied = await shareOption.action(url, title);
            if (shouldShowCopied) {
                setShowCopied(true);
                setTimeout(() => setShowCopied(false), 2000);
            }
        }
    };

    return (
        <div className="min-fit w-full text-white overflow-hidden">
            <div className="container max-w-7xl mx-auto px-4 py-8 sm:py-16 relative">
                {/* Login/Copy Banner */}
                <motion.div
                    variants={fadeInUp}
                    initial="initial"
                    animate="animate"
                    className="mb-12 rounded-2xl border border-white/10 bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-blue-500/5 p-3 sm:p-4"
                >
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="shrink-0 p-2 rounded-xl bg-purple-500/10">
                                <PackageOpen size={18} className="text-purple-300" />
                            </div>
                            <p className="text-sm font-medium text-gray-200">
                                <span className="hidden sm:inline">{installCommand ? 'Install this component directly with the shadcn CLI' : 'No registry install URL is available for this component'}</span>
                                <span className="sm:hidden">{installCommand ? 'Install with shadcn' : 'Install unavailable'}</span>
                            </p>
                        </div>

                        {/* Desktop buttons */}
                        <div className="hidden sm:flex items-center gap-2">
                            <div className="relative group">
                                <Button
                                    text={showCopied ? "Copied!" : "Share"}
                                    showIcon={false}
                                    color="blue"
                                    size="small"
                                    blurBackground={true}
                                    onClick={() => handleShare('copy')}
                                />
                                <div className="absolute right-0 top-full mt-2 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 z-50">
                                    <div className="rounded-2xl border border-white/10 bg-[#111111] shadow-xl p-1 min-w-[160px]">
                                        {shareOptions.map((option) => (
                                            <button
                                                key={option.id}
                                                onClick={() => handleShare(option.id)}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-200 hover:bg-white/5 rounded-lg transition-colors"
                                            >
                                                <span className={option.color}>{option.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            {installCommand && (
                                <Button
                                    text={installCopied ? "Copied!" : "Copy install command"}
                                    showIcon={false}
                                    color="purple"
                                    size="small"
                                    blurBackground={true}
                                    onClick={handleInstallCopy}
                                />
                            )}
                        </div>

                        {/* Mobile buttons */}
                        <div className="flex sm:hidden items-center gap-2">
                            <div className="relative group">
                                <Button
                                    text=""
                                    showIcon={true}
                                    Icon={showCopied ? Check : Share2}
                                    color="blue"
                                    size="small"
                                    blurBackground={true}
                                    onClick={() => handleShare('copy')}
                                />
                                <div className="absolute right-0 top-full mt-2 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 z-50">
                                    <div className="rounded-2xl border border-white/10 bg-[#111111] shadow-xl p-1 min-w-[160px]">
                                        {shareOptions.map((option) => (
                                            <button
                                                key={option.id}
                                                onClick={() => handleShare(option.id)}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-200 hover:bg-white/5 rounded-lg transition-colors"
                                            >
                                                <span className={option.color}>{option.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            {installCommand && (
                                <Button
                                    text={installCopied ? "Copied" : "Install"}
                                    showIcon={true}
                                    Icon={installCopied ? Check : Terminal}
                                    color="purple"
                                    size="small"
                                    blurBackground={true}
                                    onClick={handleInstallCopy}
                                />
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Mobile Title Section */}
                <motion.div
                    variants={fadeInUp}
                    initial="initial"
                    animate="animate"
                    className="mb-8 lg:hidden"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-blue-200 leading-tight py-1">
                            {name}
                        </h1>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/5 rounded-lg border border-white/5">
                                <Heart size={16} className="text-purple-300" />
                                <span className="text-base font-medium text-purple-200">
                                    {upvotesCount}
                                </span>
                            </div>
                            <button
                                onClick={handleShare}
                                className="group relative px-3 py-1.5 bg-blue-500/5 hover:bg-blue-500/10 rounded-lg border border-white/5 transition-colors"
                            >
                                <Share2 size={16} className="text-blue-300" />
                                <div className={`absolute -top-9 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-900 text-xs text-white rounded transition-opacity ${showCopied ? 'opacity-100' : 'opacity-0'}`}>
                                    Copied!
                                </div>
                            </button>
                        </div>
                    </div>
                    <p className="text-xl text-gray-300 leading-relaxed">
                        {description}
                    </p>
                </motion.div>

                {/* Main Content Grid */}
                <div className="flex flex-col space-y-8">
                    <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
                        {/* Preview Image - Shows up earlier in mobile */}
                        <motion.div
                            variants={fadeInRight}
                            initial="initial"
                            animate="animate"
                            className="lg:sticky lg:top-8 order-1 lg:order-2 flex flex-col"
                        >
                            <div
                                className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl group bg-gradient-to-br from-purple-500/5 to-blue-500/5 w-full"
                                onClick={handleClick}
                            >
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10" />
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    transition={{ duration: 0.4 }}
                                    className="relative aspect-[4/3] w-full"
                                >
                                    <Image
                                        src={`${baseUrl}/c/image/${data.id}`}
                                        fill
                                        unoptimized
                                        sizes="(min-width: 1024px) 50vw, 100vw"
                                        alt={`Preview of ${name}`}
                                        className="w-full h-full object-contain shadow-lg transform transition-transform p-10"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                </motion.div>

                                <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                                    {publishingDomain ? (
                                        <Link
                                            href={`/view/@${publishingDomain.replace(/^compify\//, '')}`}
                                            onClick={(e) => e.stopPropagation()}
                                            className="inline-block rounded-xl bg-black/30 px-4 py-2 text-sm text-purple-200 backdrop-blur-sm transition hover:text-white"
                                        >
                                            Try it live in the editor →
                                        </Link>
                                    ) : (
                                        <div className="text-sm text-gray-300 backdrop-blur-sm bg-black/30 px-4 py-2 rounded-xl inline-block">
                                            Live preview
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>

                        {/* Content Section */}
                        <motion.div
                            variants={stagger}
                            initial="initial"
                            animate="animate"
                            className="flex flex-col space-y-8 lg:space-y-12 order-2 lg:order-1"
                        >
                            {/* Header Section with Stats - Hidden on mobile */}
                            <motion.div variants={fadeInUp} className="space-y-6 hidden lg:block">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-blue-200 leading-tight py-1">
                                            {name}
                                        </h1>
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/5 rounded-lg border border-white/5">
                                            <Heart size={16} className="text-purple-300" />
                                            <span className="text-base font-medium text-purple-200">
                                                {upvotesCount}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-xl text-gray-300 leading-relaxed">
                                        {description}
                                    </p>
                                </div>
                            </motion.div>

                            {/* Tech Stack Section */}
                            <motion.div variants={fadeInUp} className="space-y-4">
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <Boxes size={16} className="text-purple-400" />
                                    <span>Built with {filteredUsedUiFrameworks?.length + 1} technologies</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <div className="px-3 py-1.5 bg-purple-500/5 rounded-lg border border-white/5 flex items-center gap-2">
                                        <Code2 size={14} className="text-purple-300" />
                                        <span className="text-sm text-purple-200">{runtimeLables?.[language] || language}</span>
                                    </div>
                                    {filteredUsedUiFrameworks?.map((framework, index) => (
                                        <div
                                            key={index}
                                            className="px-3 py-1.5 bg-blue-500/5 rounded-lg border border-white/5 flex items-center gap-2"
                                        >
                                            <span className="text-sm text-blue-200">{uiLibsLabels?.[framework] || framework}</span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>

                            {/* Install Section */}
                            {publishingDomain && (
                                <motion.div variants={fadeInUp} className="space-y-4">
                                    <div className="flex items-center gap-2 text-sm text-gray-400">
                                        <Terminal size={16} className="text-purple-400" />
                                        <span>Install in your project</span>
                                    </div>
                                    <div className="space-y-2">
                                        <InstallCommand
                                            label="shadcn"
                                            command={installCommand}
                                        />
                                        <InstallCommand
                                            label="compify"
                                            command={`compify add @${publishingDomain}`}
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
} 