'use client'
import React, { useState, useEffect, Suspense } from 'react'
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GradientSpot } from '@/components/Common';
import { Button, InputField, Toast } from '@/components/Elements';
import { resetPasswordWithToken } from '@/lib/api';
import { isValidEmail } from '@/components/Footer';

function PasswordReset() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <PasswordResetContent />
        </Suspense>
    )
}

function PasswordResetContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [msg, setMsg] = useState({ text: '', status: '' });
    const [isLoading, setIsLoading] = useState(false);

    const token = searchParams.get('token');
    const email = searchParams.get('email');

    useEffect(() => {
        if (!token || !email || !isValidEmail(email)) {
            router.push('/login/forgot-password');
        }
    }, [token, email, router]);

    const handleResetPassword = async () => {
        if (isLoading) return;

        if (!password || !confirmPassword) {
            setMsg({ text: 'Please fill in all fields', status: 'error' });
            return;
        }
        if (password !== confirmPassword) {
            setMsg({ text: 'Passwords do not match', status: 'error' });
            return;
        }
        if (password.length < 6) {
            setMsg({ text: 'Password must be at least 6 characters', status: 'error' });
            return;
        }

        setIsLoading(true);
        try {
            const res = await resetPasswordWithToken(token, email, password);
            if (res.status === 201) {
                setMsg({ text: 'Password reset successful', status: 'success' });
                setTimeout(() => router.push('/login'), 2000);
            } else {
                setMsg({ text: res.data?.message || 'Unable to reset password. Please try again.', status: 'error' });
            }
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="flex bg-black text-white items-center justify-center" style={{ height: 'calc(100vh - 72px)' }}>
            <motion.div
                className="w-full md:w-2/5 flex items-center justify-center p-6 md:p-12 relative"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="hidden md:block">
                    <GradientSpot color="#FF4B4B" size={500} position={{ x: '-30%', y: '-30%' }} opacity={0.15} />
                    <GradientSpot color="#FF8F00" size={500} position={{ x: '30%', y: '30%' }} opacity={0.15} />
                </div>
                <div className="block md:hidden">
                    <GradientSpot color="#FF4B4B" size={250} position={{ x: '-15%', y: '-15%' }} opacity={0.15} />
                    <GradientSpot color="#FF8F00" size={250} position={{ x: '15%', y: '15%' }} opacity={0.15} />
                </div>

                <div className="w-full max-w-md space-y-6 relative z-10">
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-rose-500 to-orange-500 bg-clip-text text-transparent">
                            Reset Password
                        </h2>
                        <p className="text-gray-400">Please enter your new password</p>
                    </motion.div>

                    <div className="space-y-6">
                        <InputField
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="New Password"
                            type={showPassword ? "text" : "password"}
                            Icon={Lock}
                            showButton={true}
                            disableEnter={true}
                            onSubmit={() => setShowPassword(!showPassword)}
                            RightIcon={showPassword ? EyeOff : Eye}
                        />

                        <InputField
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm Password"
                            type={showConfirmPassword ? "text" : "password"}
                            Icon={Lock}
                            showButton={true}
                            disableEnter={true}
                            onSubmit={() => setShowConfirmPassword(!showConfirmPassword)}
                            RightIcon={showConfirmPassword ? EyeOff : Eye}
                        />
                    </div>
                    <div className='flex flex-col !m-0 gap-3'>
                        <p className={`h-5 ${msg.status === 'error' ? 'text-red-500' : 'text-green-500'}`}>
                            {msg.text}
                        </p>
                        <Button
                            text="Reset Password"
                            variant="full"
                            onClick={handleResetPassword}
                            fullWidth={true}
                            disabled={isLoading}
                        />
                    </div>
                </div>
            </motion.div>
        </div>
    )
}

export default PasswordReset;