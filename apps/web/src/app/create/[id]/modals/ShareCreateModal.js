import { InputField } from '@/components/Elements'
import LabelButton from '@/components/Elements/LabelButton'
import Modal from '@/components/Elements/Modal'
import { baseUrl } from '@/constains'
import {
    Copy,
    DownloadCloudIcon,
    Twitter,
    Linkedin,
    Facebook,
    MessageCircle,
    Share2,
    Link2,
    Heart,
    Eye,
    Check,
    Lock
} from 'lucide-react'
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import CardWrapper from '@/components/Elements/CardWrapper'

function ShareCreateModal({ id, image, shareModalOpen, setShareModalOpen, shareUrl, setToastMessage, setToastType, setShowToast, privacy }) {
    const [copyAnimation, setCopyAnimation] = useState(false);
    const [backgroundImage, setBackgroundImage] = useState(`url(${baseUrl}/c/og-image/${id}?v=${Math.floor(Date.now() / 1000)})`);

    useEffect(() => {
        if (privacy !== 'public') return;

        const img = new Image();
        img.src = `${baseUrl}/c/og-image/${id}?v=${Math.floor(Date.now() / 1000)}`;

        img.onerror = () => {
            setBackgroundImage('url(/the-cube.webp)');
        };
    }, [id, privacy]);

    const handleCopyUrl = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopyAnimation(true);
            setToastMessage('URL copied to clipboard');
            setToastType('success');
            setShowToast(true);
            setTimeout(() => setCopyAnimation(false), 1500);
        } catch (err) {
            setToastMessage('Failed to copy URL');
            setToastType('error');
            setShowToast(true);
        }
    };

    const downloadImage = async () => {
        try {
            const response = await fetch(image);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `component-${id}.png`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            setToastMessage('Image downloaded successfully');
            setToastType('success');
            setShowToast(true);
        } catch (err) {
            setToastMessage('Failed to download image');
            setToastType('error');
            setShowToast(true);
        }
    }

    const XIcon = () => {
        return <span className="text-xl font-bold">𝕏</span>
    }

    const shareOptions = [
        {
            name: 'Post',
            icon: XIcon,
            variant: 'info',
            onClick: () => window.open(`https://x.com/intent/tweet?text=Check%20out%20this%20amazing%20UI%20component%20I%20created!%20🎨✨%0A%0A${encodeURIComponent(shareUrl)}%0A%0A%23webdev%20%23design%20%23UIdesign%20%23frontend%20%23coding`, '_blank'),
        },
        {
            name: 'LinkedIn',
            icon: Linkedin,
            variant: 'info',
            onClick: () => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent('Check out this amazing UI component I created!')}`, '_blank'),
        },
        {
            name: 'Download Image',
            icon: DownloadCloudIcon,
            variant: 'success',
            onClick: downloadImage,
        },
    ]

    return (
        <Modal
            isOpen={shareModalOpen}
            onClose={() => setShareModalOpen(false)}
            color="hsl(213, 94%, 68%)"
            backdropColor="hsl(213, 94%, 68%)"
        >
            <div className="sm:px-4 w-full sm:min-w-[600px] max-h-[90vh] overflow-y-auto no-scrollbar" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-2xl font-bold mb-4 text-gray-300 text-center">
                    Share Your Masterpiece
                </h2>

                {/* Preview Card */}
                <CardWrapper
                    color="hsl(213, 94%, 68%)"
                    className="p-4 mb-6"
                    hoverEffect={false}
                >
                    {privacy === 'public' ? (
                        <div
                            className='w-full aspect-[1.9] rounded-xl overflow-hidden relative group'
                            style={{
                                backgroundImage: backgroundImage,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                transition: 'transform 0.3s ease-in-out',
                            }}
                        >
                        </div>
                    ) : (
                        <div className='w-full aspect-[1.9] rounded-xl overflow-hidden relative group bg-zinc-900/50 flex items-center justify-center flex-col gap-4'>
                            <div className="p-4 rounded-full bg-zinc-800/50">
                                <Lock size={32} className="text-zinc-400" />
                            </div>
                            <div className="text-center px-6">
                                <h3 className="text-lg font-semibold text-zinc-300 mb-2">Private Component</h3>
                                <p className="text-zinc-400 text-sm">
                                    To share this component, please make it public in the publish settings.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* URL Share Section */}
                    {privacy === 'public' && (
                        <div
                            className="mt-4 relative cursor-pointer"
                            onClick={handleCopyUrl}
                        >
                            <InputField
                                value={shareUrl}
                                placeholder="Component URL"
                                className={`w-full transition-all duration-300 ${copyAnimation ? 'border-green-500' : ''}`}
                            />
                            <div className="absolute cursor-pointer right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 bg-[#18181b] rounded-xl">
                                <motion.div
                                    className="absolute"
                                    initial={{ opacity: 1 }}
                                    animate={{
                                        opacity: copyAnimation ? 0 : 1,
                                        scale: copyAnimation ? 0.5 : 1
                                    }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <Link2 className="text-white" size={20} />
                                </motion.div>
                                <motion.div
                                    className="absolute"
                                    initial={{ opacity: 0 }}
                                    animate={{
                                        opacity: copyAnimation ? 1 : 0,
                                        scale: copyAnimation ? 1 : 0.5
                                    }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <Check className="text-white" size={20} />
                                </motion.div>
                            </div>
                        </div>
                    )}
                </CardWrapper>

                {/* Share Options Grid */}
                {privacy === 'public' && (
                    <div className="flex items-center justify-between w-full px-1">
                        {shareOptions.map((option) => (
                            <LabelButton
                                key={option.name}
                                onClick={option.onClick}
                                Icon={option.icon}
                                variant={option.variant}
                                className="w-fit"
                            >
                                {option.name}
                            </LabelButton>
                        ))}
                    </div>
                )}
            </div>
        </Modal>
    )
}

export default ShareCreateModal
