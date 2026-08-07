import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, Info, X, XCircle } from 'lucide-react';
import { GradientSpot } from '../Common';


const Toast = ({
    message,
    onClose,
    duration = 5000,
    type = 'info'
}) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const gradientColors = {
        success: ['#10B981', '#059669'],
        error: ['#EF4444', '#DC2626'],
        warning: ['#F59E0B', '#D97706'],
        info: ['#3B82F6', '#2563EB'],
    };

    const [color1, color2] = gradientColors[type] || gradientColors.info;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className="fixed bottom-4 right-4 max-w-[20rem] w-fit"
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0, transition: { duration: 0.2 } }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                    <motion.div
                        className="relative rounded-3xl shadow-2xl overflow-hidden border border-white/5 bg-zinc-900/80 backdrop-blur-xl"
                        whileHover={{
                            y: -5,
                            boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.5)",
                            transition: { duration: 0.3 }
                        }}
                    >
                        <GradientSpot color={color1} size={100} position={{ x: '-20%', y: '-20%' }} />
                        <GradientSpot color={color2} size={80} position={{ x: '120%', y: '50%' }} />

                        <div className="relative z-10 flex gap-4 items-center justify-between p-4">
                            <p className="text-white text-base font-medium w-fit">{message}</p>
                            <button
                                onClick={() => {
                                    setIsVisible(false);
                                    onClose();
                                }}
                                className=" text-gray-400 hover:text-white transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Toast;