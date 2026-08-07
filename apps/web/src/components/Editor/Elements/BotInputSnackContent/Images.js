import { X } from 'lucide-react'
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { createPortal } from 'react-dom'

const ImageModal = ({ image, onClose }) => {
    React.useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };

        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    return createPortal(
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative max-w-[90vw] max-h-[90vh] rounded-xl overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                <Image
                    src={image}
                    alt="Full size image"
                    width={1200}
                    height={800}
                    className="object-contain max-h-[90vh]"
                    quality={100}
                    priority
                />
                <motion.button
                    className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 p-2 rounded-full text-white backdrop-blur-sm"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                >
                    <X size={20} />
                </motion.button>
            </motion.div>
        </motion.div>,
        document.body
    );
};

const ImageCard = ({ image, onRemove, onClick }) => {
    return (
        <motion.div
            className="relative cursor-pointer w-full h-full"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            whileHover={{
                y: -10,
                transition: { duration: 0.3 }
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            onClick={onClick}
        >
            {/* Main Card Container */}
            <motion.div
                className="relative rounded-xl shadow-md border-[rgba(255,255,255,0.3)] 
                    border w-full h-full overflow-hidden max-w-[80px] max-h-[80px]"
                whileHover={{
                    boxShadow: "0 8px 32px -1px rgba(0, 0, 0, 0.2), 0 0 0 2px rgba(255,255,255,0.3)",
                    border: '1px solid rgba(255,255,255,0.3)',
                    transition: { duration: 0.3 }
                }}
            >
                {/* Image Container */}
                <div className="relative w-[80px] h-[80px]">
                    <Image
                        src={image}
                        alt="Pasted image"
                        className="object-cover"
                        fill
                        sizes="80px"
                        quality={90}
                        priority
                    />
                </div>
            </motion.div>

            {/* X Button Container */}
            <motion.div
                className="absolute -top-1 -right-1 z-50"
                onClick={(e) => {
                    e.stopPropagation();
                    onRemove();
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
            >
                <div
                    className="bg-[#2d2d2d] text-white
                        rounded-full h-6 w-6 flex items-center justify-center cursor-pointer
                        shadow-md hover:bg-[#3d3d3d] transition-all duration-200"
                >
                    <X size={15} />
                </div>
            </motion.div>
        </motion.div>
    );
};

const Images = ({ images, onRemove }) => {
    const [selectedImage, setSelectedImage] = useState(null);

    if (!images || images.length === 0) return null;

    const baseZIndex = 10;

    return (
        <>
            <div className="flex items-center relative py-2 px-2 w-full">
                {images.map((image, index) => (
                    <motion.div
                        key={index}
                        className="relative"
                        style={{
                            marginLeft: index === 0 ? 0 : '-20px',
                            transform: `translateY(${index % 2 === 0 ? '4px' : '-4px'})`,
                            zIndex: baseZIndex + (images.length - index),
                        }}
                        initial={{
                            x: 60,
                            opacity: 0,
                            rotate: index % 2 === 0 ? 3 : -3,
                            y: index % 2 === 0 ? 8 : -8
                        }}
                        animate={{
                            x: 0,
                            opacity: 1,
                            rotate: index % 2 === 0 ? 1.5 : -1.5,
                        }}
                        transition={{
                            delay: index * 0.15,
                            duration: 0.4,
                            type: 'spring',
                            stiffness: 300,
                            damping: 20
                        }}
                        whileHover={{
                            scale: 1.08,
                            rotate: 0,
                            y: -4,
                            zIndex: baseZIndex + images.length + 1,
                            transition: {
                                type: 'spring',
                                stiffness: 400,
                                damping: 25,
                                zIndex: { duration: 0 }
                            }
                        }}
                        whileTap={{ scale: 1.05 }}
                    >
                        <div className="relative">
                            <div
                                className="absolute inset-0 bg-black/5 rounded-xl"
                                style={{
                                    transform: 'translateY(4px) scale(0.95)',
                                    filter: 'blur(8px)',
                                    zIndex: -1
                                }}
                            />
                            <ImageCard
                                image={image}
                                onRemove={() => onRemove(index)}
                                onClick={() => setSelectedImage(image)}
                            />
                        </div>
                    </motion.div>
                ))}
            </div>
            <AnimatePresence>
                {selectedImage && (
                    <ImageModal
                        image={selectedImage}
                        onClose={() => setSelectedImage(null)}
                    />
                )}
            </AnimatePresence>
        </>
    );
};

export default Images;