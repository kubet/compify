import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { SwatchBook, Trash2 } from 'lucide-react';
import { GradientSpot } from '../Common';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getComponentImage } from '@/lib/api';
import getColorFromName from '../Common/GetColorFromName';

const ComponentCard = React.memo(({ component, onDelete, showControls = true }) => {
    const router = useRouter();
    const [imageUrl, setImageUrl] = useState(null);
    const [imageError, setImageError] = useState(null);
    const [fallbackImage, setFallbackImage] = useState(false);

    useEffect(() => {
        let isMounted = true;
        if (component.id && component.imageUploaded && !imageUrl && !imageError && !fallbackImage) {
            getComponentImage(component.id)
                .then(response => {
                    if (!isMounted) return;
                    if (response.data instanceof Blob) {
                        const url = URL.createObjectURL(response.data);
                        setImageUrl(url);
                    } else {
                        throw new Error('Invalid response data');
                    }
                })
                .catch(error => {
                    if (!isMounted) return;
                    console.error('Error loading image:', error);
                    setImageError(error.message);
                    setFallbackImage(true);
                });
        }
        // If no image is uploaded, set fallback image immediately
        if (!component.imageUploaded && !fallbackImage) {
            setFallbackImage(true);
        }
        return () => {
            isMounted = false;
            if (imageUrl) {
                URL.revokeObjectURL(imageUrl);
            }
        };
    }, [component.id, component.imageUploaded, imageUrl, imageError, fallbackImage]);

    const cardColor = useMemo(() => getColorFromName(component.id), [component.id]);

    const handleDelete = useCallback((e) => {
        e.stopPropagation();
        onDelete(component.id);
    }, [onDelete, component.id]);

    const handleClick = useCallback(() => {
        router.push(`/create/${component.id}`);
    }, [router, component.id]);

    const visibilityColorMap = {
        'public': 'text-green-400',
        'private': 'text-red-400',
        'draft': 'text-yellow-400',
    }

    return (
        <div className="relative [transform:translateZ(0)]">
            <motion.div
                className="relative cursor-pointer rounded-3xl shadow-md overflow-hidden border border-[rgba(255,255,255,0.1)] w-full aspect-[3/2]"
                style={{
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    transformStyle: 'preserve-3d',
                    backfaceVisibility: 'hidden',
                    WebkitTransformStyle: 'preserve-3d',
                    WebkitBackfaceVisibility: 'hidden',
                    perspective: '1000px',
                    WebkitPerspective: '1000px',
                    WebkitTransform: 'translate3d(0, 0, 0)'
                }}
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                whileHover={{
                    y: -10,
                    boxShadow: "0 8px 32px -1px rgba(0, 0, 0, 0.2), 0 0 0 2px rgba(255,255,255,0.3)",
                    border: '1px solid rgba(255,255,255,0.3)',
                    transition: { duration: 0.3 }
                }}
                onClick={handleClick}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
                <div className="absolute inset-0 rounded-3xl overflow-hidden">
                    <GradientSpot color={cardColor} size={200} position={{ x: '-20%', y: '-20%' }} />
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-br"
                        style={{
                            background: `linear-gradient(135deg, ${cardColor}33, ${cardColor}66)`,
                        }}
                        whileHover={{ opacity: 0.4 }}
                        initial={{ opacity: 0.2 }}
                        transition={{ duration: 0.3 }}
                    />
                </div>

                <div className="relative z-1 flex flex-col h-full w-full p-4">
                    <div className="flex-grow">
                        <h3 className="text-xl font-bold text-white truncate mb-2">{component.name}</h3>
                        <p className="text-sm text-gray-400 mb-4 truncate max-w-36">{component.description}</p>
                    </div>

                    <div className="flex justify-between items-end">
                        <div className='flex flex-col'>
                            <span className="text-sm text-blue-400 capitalize">
                                {component.language}
                            </span></div>
                        {showControls && (
                            <div className='flex flex-col gap-1'>
                                <motion.button
                                    className="z-20 p-1 group relative"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const searchParams = new URLSearchParams({
                                            c: component.id,
                                            t: component?.theme
                                        }).toString();
                                        router.push(`/theme?${searchParams}`);
                                    }}
                                >
                                    <SwatchBook
                                        size={20}
                                        className="transition-all text-gray-300 duration-300 group-hover:text-purple-500 group-hover:rotate-12"
                                        style={{
                                            background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4)',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                        }}
                                    />
                                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-purple-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                                </motion.button>
                                <motion.button
                                    className="z-20 p-1"
                                    whileHover={{ scale: 1.2 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={handleDelete}
                                >
                                    <Trash2 size={20} className="text-red-500" />
                                </motion.button>
                            </div>
                        )}
                    </div>
                </div>

                {(imageUrl || fallbackImage) && (
                    <div className="absolute inset-0 overflow-hidden">
                        <Image
                            src={fallbackImage ? '/the-cube.webp' : imageUrl}
                            alt={component.name}
                            fill
                            sizes="100%"
                            className={`object-scale-down p-2 w-full transition-opacity duration-300 hover:opacity-40 ${showControls ? 'opacity-10' : 'opacity-30'}`}
                            onError={() => {
                                setImageError('Failed to load image');
                                setImageUrl(null);
                                setFallbackImage(true);
                            }}
                        />
                    </div>
                )}

                {imageError && !fallbackImage && (
                    <div className="absolute inset-0 flex items-center justify-center text-red-500">
                        Error: {imageError}
                    </div>
                )}
            </motion.div>
        </div>
    );
});

ComponentCard.displayName = 'ComponentCard';

export default ComponentCard;
