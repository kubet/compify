'use client';

import { Suspense } from 'react';
import { useUser } from '@/auth/UseUser';
import { whoAmI } from '@/lib/api';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { GradientSpot } from '@/components/Common';

function GoogleVerifyContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { setUser } = useUser();
    const [error, setError] = useState('');

    useEffect(() => {
        const verifyGoogleToken = async () => {
            try {
                const accessToken = searchParams.get('token');
                if (!accessToken) {
                    setError('No verification token found');
                    setTimeout(() => router.push('/login'), 3000);
                    return;
                }

                localStorage.setItem('token', accessToken);
                const usr = await whoAmI();
                setUser(usr.data);

                const afterLoginForwardLink = localStorage.getItem('afterLoginForwardLink');
                if (afterLoginForwardLink) {
                    localStorage.removeItem('afterLoginForwardLink');
                    router.push(afterLoginForwardLink);
                } else {
                    router.push('/profile');
                }
            } catch (error) {
                console.error('Google verification failed:', error);
                setError('Failed to verify Google account');
                setTimeout(() => router.push('/login'), 3000);
            }
        };

        verifyGoogleToken();
    }, [router, searchParams, setUser]);

    return (
        <div className="flex bg-black text-white items-center justify-center mx-auto w-full max-w-7xl" style={{ height: 'calc(100vh - 72px)' }}>
            <motion.div
                className="w-full md:w-2/5 flex items-center justify-center p-6 md:p-12 relative"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="hidden md:block">
                    <GradientSpot color="#4285F4" size={500} position={{ x: '-30%', y: '-30%' }} opacity={0.15} />
                    <GradientSpot color="#34A853" size={500} position={{ x: '30%', y: '30%' }} opacity={0.15} />
                </div>
                <div className="block md:hidden">
                    <GradientSpot color="#4285F4" size={250} position={{ x: '-15%', y: '-15%' }} opacity={0.15} />
                    <GradientSpot color="#34A853" size={250} position={{ x: '15%', y: '15%' }} opacity={0.15} />
                </div>

                <div className="w-full max-w-md space-y-8 relative z-10">
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
                            {error ? 'Error verifying account' : 'Verifying your Google account'}
                        </h2>
                        <p className="text-gray-400">
                            {error ? error : 'Please wait while we redirect you to the app.'}
                        </p>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
}

export default function GoogleVerify() {
    return (
        <Suspense fallback={
            <div className="flex bg-black text-white items-center justify-center mx-auto w-full max-w-7xl" style={{ height: 'calc(100vh - 72px)' }}>
                <div className="text-center">
                    <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
                        Loading...
                    </h2>
                </div>
            </div>
        }>
            <GoogleVerifyContent />
        </Suspense>
    );
}