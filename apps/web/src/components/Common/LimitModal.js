import React, { useEffect, useState } from 'react'
import Modal from '@/components/Elements/Modal';
import PricingCard from '../Payment/PricingCard';
import { useUser } from '@/auth/UseUser';
import { AnimatePresence } from 'framer-motion';
import { getAllPlans, getUserSubscriptionUsage } from '@/lib/api';
import { motion } from 'framer-motion';
import LabelButton from '@/components/Elements/LabelButton';
import { useRouter } from 'next/navigation';
import { Button } from '../Elements';

function LimitModal({ isOpen, message }) {
    const router = useRouter();

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => router.push('/search')}
            color='#5C67F2'
            backdropColor='rgba(92, 103, 242, 0.8)'
        >
            <div className="flex flex-col items-center justify-center px-4 sm:px-8 mx-auto w-full py-4" onClick={(e) => e.stopPropagation()}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center max-w-lg"
                >
                    <div className="mb-6">
                        <motion.div
                            initial={{ scale: 0.5 }}
                            animate={{ scale: 1 }}
                            className="inline-block p-4 rounded-full bg-white/10"
                        >
                            <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </motion.div>
                    </div>

                    <h2 className="text-3xl font-extrabold mb-4 bg-gradient-to-r from-gray-300 via-gray-500 to-gray-700 bg-clip-text text-transparent">
                        Plan limit reached
                    </h2>
                    <p className="text-gray-400 mb-8 text-lg">
                        {message}
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <Button
                            onClick={() => router.push('/profile?plans=true')}
                            text='Upgrade Plan'
                            variant='full'
                            className="w-full sm:w-auto px-8 py-3"
                        />
                    </div>
                </motion.div>
            </div>
        </Modal>
    )
}

export default LimitModal