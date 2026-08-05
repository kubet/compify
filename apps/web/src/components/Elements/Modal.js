import React, { useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GradientSpot } from '../Common'
import { X, XIcon } from 'lucide-react'

function Modal({ isOpen, onClose, children, color = 'hsl(220, 80%, 75%)', backdropColor = '#EEEEEE' }) {
    const handleEscapeKey = useCallback((event) => {
        if (event.key === 'Escape') {
            onClose()
        }
    }, [onClose])
    useEffect(() => {
        if (isOpen) {
            document.body.classList.add('overflow-hidden')
            document.addEventListener('keydown', handleEscapeKey)
        } else {
            document.body.classList.remove('overflow-hidden')
        }

        return () => {
            document.body.classList.remove('overflow-hidden')
            document.removeEventListener('keydown', handleEscapeKey)
        }
    }, [isOpen, handleEscapeKey])

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="!m-0 fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm"
                    onClick={onClose}
                >

                    <div className="relative z-10 rounded-[1.3rem] overflow-hidden border border-white/5 bg-black">
                        <GradientSpot
                            className="absolute top-0 left-0 w-full h-full opacity-30"
                            color={backdropColor}
                            size={300}
                            position={{ x: '25%', y: '-30%' }}
                        />
                        <XIcon
                            size={24}
                            className="absolute top-3 right-3 cursor-pointer text-gray-400 hover:text-white"
                            onClick={onClose}
                        />
                        <div className="p-6 overflow-auto max-h-[calc(90vh-100px)]">
                            {children}
                        </div>
                    </div>

                </motion.div>
            )}
        </AnimatePresence>
    )
}

export default Modal