'use client'
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { GradientSpot } from '@/components/Common';
import { verifyUser } from '@/lib/api';
import { Suspense } from 'react';

// Create a separate component for the verification content
const VerificationContent = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [error, setError] = useState('');

    useEffect(() => {
        const token = searchParams.get('token');
        const email = searchParams.get('email');
        const type = searchParams.get('type');

        const handleVerifyEmail = async ({ token, email }) => {
            const response = await verifyUser(token, email);
            if (response.status === 201) {
                router.push('/login');
            } else {
                setError(response.message);
            }
        }

        const handleVerification = ({ token, email, type }) => {
            switch (type) {
                case '0':
                    handleVerifyEmail({ token, email });
                    break;
                default:
                    break;
            }
        };

        if (token && email && type) {
            handleVerification({ token, email, type });
        }
    }, [searchParams, router]);

    return (
        <div className="flex bg-black text-white items-center justify-center mx-auto w-full max-w-7xl" style={{ height: 'calc(100vh - 72px)' }}>
            <motion.div
                className="w-full md:w-2/5 flex items-center justify-center p-6 md:p-12 relative"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="hidden md:block">
                    <GradientSpot color="#00C853" size={500} position={{ x: '-30%', y: '-30%' }} opacity={0.15} />
                    <GradientSpot color="#1DE9B6" size={500} position={{ x: '30%', y: '30%' }} opacity={0.15} />
                </div>
                <div className="block md:hidden">
                    <GradientSpot color="#00C853" size={250} position={{ x: '-15%', y: '-15%' }} opacity={0.15} />
                    <GradientSpot color="#1DE9B6" size={250} position={{ x: '15%', y: '15%' }} opacity={0.15} />
                </div>

                <div className="w-full max-w-md space-y-8 relative z-10">
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent">
                            {error ? 'Error verifying email' : 'Your account is verified'}
                        </h2>
                        <p className="text-gray-400">
                            {error ? error : 'Please wait while we redirect you to the app.'}
                        </p>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
};

// Main page component with Suspense boundary
const VerifyPage = () => {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <VerificationContent />
        </Suspense>
    );
};

export default VerifyPage;
