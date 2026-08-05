'use client'
import { resendVerificationEmail } from '@/lib/api';
import React, { useEffect, useState, Suspense } from 'react'
import { motion } from 'framer-motion';
import { GradientSpot } from '@/components/Common';
import { Toast } from '@/components/Elements';
import { useSearchParams } from 'next/navigation';

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const email = searchParams.get('a');

    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('success');


    const handleResendVerificationEmail = async () => {
        if (!email) {
            setToastMessage('Email is required');
            setToastType('error');
            setShowToast(true);
            return;
        }
        const resp = await resendVerificationEmail(email);
        if (resp.status === 201) {
            setToastMessage('Verification email sent successfully');
            setToastType('success');
            setShowToast(true);
        } else {
            setToastMessage(resp.data.message);
            setToastType('error');
            setShowToast(true);
        }
    };

    useEffect(() => {
        handleResendVerificationEmail();
    }, [email]);
    return (
        <div className="flex bg-black text-white items-center justify-center mx-auto w-full max-w-7xl" style={{ height: 'calc(100vh - 72px)' }}>
            <motion.div
                className="w-full md:w-2/5 flex items-center justify-center p-6 md:p-12 relative"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="hidden md:block">
                    <GradientSpot color="#FF512F" size={500} position={{ x: '-30%', y: '-30%' }} opacity={0.15} />
                    <GradientSpot color="#DD2476" size={500} position={{ x: '30%', y: '30%' }} opacity={0.15} />
                </div>
                <div className="block md:hidden">
                    <GradientSpot color="#FF512F" size={250} position={{ x: '-15%', y: '-15%' }} opacity={0.15} />
                    <GradientSpot color="#DD2476" size={250} position={{ x: '15%', y: '15%' }} opacity={0.15} />
                </div>

                <div className="w-full max-w-md space-y-8 relative z-10">
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                            Check your email
                        </h2>
                        <p className="text-gray-400">
                            We&apos;ve sent you an email to verify your account.
                            Didn&apos;t receive it? <span className="cursor-pointer text-blue-400 hover:underline" onClick={handleResendVerificationEmail}>Click here to resend</span>.
                        </p>
                        {toastType === 'error' && <p className="text-red-400">
                            {toastMessage}
                        </p>}
                    </motion.div>
                </div>
            </motion.div>
            {showToast && (
                <Toast
                    message={toastMessage}
                    type={toastType}
                    onClose={() => setShowToast(false)}
                />
            )}
        </div>
    )
}

function VerifyEmail() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <VerifyEmailContent />
        </Suspense>
    );
}

export default VerifyEmail