import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clipboard, Check, Import, RedoIcon, PlusIcon, ArrowUp, ArrowDown } from 'lucide-react';
import { GradientSpot } from '../Common';
import { useRouter } from 'next/navigation';
import getColorFromName from '../Common/GetColorFromName';
import { getComponentImage } from '@/lib/api';
import UpvoteButtons from './UpvoteButtons';
import { baseUrl } from '@/constains';

const ProductCard = ({ id, name, language, upvotes = 0, upvoteDefaultStatus, onCopy, imageUploaded, viewOnly, publicImage }) => {
    const [copied, setCopied] = useState(false);
    const [upvoteStatus, setUpvoteStatus] = useState(upvoteDefaultStatus);
    const [upvoteCount, setUpvoteCount] = useState(upvotes);
    const router = useRouter();
    const handleCopy = () => {
        navigator.clipboard.writeText(name);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        onCopy();
    };
    const [imageUrl, setImageUrl] = useState(null);
    const [imageError, setImageError] = useState(null);
    const [fallbackImage, setFallbackImage] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageHeight, setImageHeight] = useState(0);
    const imageRef = useRef(null);

    useEffect(() => {
        let isMounted = true;

        if (id && imageUploaded && !imageUrl && !imageError && !fallbackImage) {
            if (publicImage) {
                setImageUrl(`${baseUrl}/c/image/${id}`);
            } else {
                getComponentImage(id)
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
        }
        // If no image is uploaded, set fallback image immediately
        if (!imageUploaded && !fallbackImage) {
            setFallbackImage(true);
        }
        return () => {
            isMounted = false;
            if (imageUrl) {
                URL.revokeObjectURL(imageUrl);
            }
        };
    }, [id, imageUploaded, imageUrl, imageError, fallbackImage]);

    const handleImageLoad = () => {
        setImageLoaded(true);
        if (imageRef.current) {
            const height = Math.min(imageRef.current.naturalHeight, 450);
            setImageHeight(height);
        }
    };

    const handleUpvoteStatus = (newStatus) => {
        if (newStatus === upvoteStatus) {
            setUpvoteStatus(null);
            // Just remove the previous vote
            setUpvoteCount(upvoteCount + (upvoteStatus === 'upvote' ? -1 : 1));
        }
        // If switching from one vote to another
        else if (upvoteStatus !== null) {
            setUpvoteStatus(newStatus);
            // Need to reverse previous vote (-1) and add new vote (+1) = 2 vote difference
            setUpvoteCount(upvoteCount + (newStatus === 'upvote' ? 2 : -2));
        }
        // If voting for the first time
        else {
            setUpvoteStatus(newStatus);
            // Simply add the new vote
            setUpvoteCount(upvoteCount + (newStatus === 'upvote' ? 1 : -1));
        }
    }

    return (
        <div className="relative [transform:translateZ(0)]">
            <motion.div
                className="relative group cursor-pointer rounded-3xl shadow-md overflow-hidden border border-[rgba(255,255,255,0.1)] w-full"
                style={{
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    height: imageHeight ? `${imageHeight}px` : 'auto',
                    transition: 'height 0.3s ease-in-out',
                    minHeight: '200px',
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
                whileHover={!viewOnly && {
                    y: -10,
                    boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.5)",
                    transition: { duration: 0.3 }
                }}
                onClick={() => router.push(`/create/${id}`)}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
                <div className="absolute inset-0 rounded-3xl overflow-hidden">
                    <motion.div
                        className="absolute inset-0 bg-[rgba(255,255,255,0.03)]"
                        style={{
                            transformStyle: 'preserve-3d',
                        }}
                    />
                    <GradientSpot color={getColorFromName(id)} size={200} position={{ x: '-20%', y: '-20%' }} />
                </div>

                <div className="relative z-10 w-full h-full">
                    <div className="absolute inset-6 rounded-2xl overflow-hidden">
                        <AnimatePresence>
                            {(imageUrl || fallbackImage) && (
                                <motion.img
                                    ref={imageRef}
                                    key={imageUrl || 'fallback'}
                                    src={fallbackImage ? '/the-cube.webp' : imageUrl}
                                    alt={name}
                                    className="w-full h-full perspective-image"
                                    style={{
                                        objectFit: fallbackImage ? 'contain' : 'scale-down',
                                        objectPosition: 'center',
                                    }}
                                    initial={{ opacity: 0, rotateY: 30, rotateX: -10 }}
                                    animate={{
                                        opacity: imageLoaded ? 1 : 0,
                                        rotateY: imageLoaded ? 0 : 30,
                                        rotateX: imageLoaded ? 0 : -10
                                    }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.5, type: 'spring', stiffness: 100 }}
                                    onLoad={handleImageLoad}
                                    onError={() => {
                                        setImageError('Failed to load image');
                                        setImageUrl(null);
                                        setFallbackImage(true);
                                        setImageLoaded(true);
                                        setImageHeight(200);
                                    }}
                                />
                            )}
                        </AnimatePresence>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent opacity-90 group-hover:opacity-40 transition-opacity duration-300" />
                    <motion.div
                        className="absolute bottom-0 left-0 right-0 p-6 flex flex-col justify-end group-hover:opacity-0 transition-opacity duration-300"
                    >
                        <h3 className="text-xl font-bold text-white truncate mb-1">{name}</h3>
                        <span className="text-sm text-gray-300 mb-2">{language}</span>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-400">{upvoteCount >= 0 ? `+${upvoteCount}` : upvoteCount}</span>
                        </div>
                    </motion.div>
                    {!viewOnly && <div className="absolute bottom-0 left-0 right-0 p-6">
                        <UpvoteButtons id={id} status={upvoteStatus} changeStatus={handleUpvoteStatus} />
                    </div>}
                </div>
            </motion.div>
        </div>
    );
};

export default ProductCard;
