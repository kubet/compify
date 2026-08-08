'use client';
import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';
import { Button, InputField } from '@/components/Elements';
import { GradientSpot } from '@/components/Common';
import { resetPassword } from '@/lib/api';
import { isValidEmail } from '@/components/Footer';

function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [msg, setMsg] = useState({ text: '', status: '' });
    const [isLoading, setIsLoading] = useState(false);

    const handleResetPassword = async () => {
        if (!email) {
            setMsg({ text: 'Email is required', status: 'error' });
            return;
        }
        if (!isValidEmail(email)) {
            setMsg({ text: 'Invalid email address', status: 'error' });
            return;
        }
        if (isLoading) return;
        setIsLoading(true);
        const res = await resetPassword(email);
        setIsLoading(false);
        if (res.status === 201) {
            setMsg({ text: 'Reset link sent to your email', status: 'success' });
        } else {
            setMsg({ text: res.data?.message || 'Unable to send a reset link. Please try again.', status: 'error' });
        }
    }

    useEffect(() => {
        if (email) {
            setMsg({ text: '', status: '' });
        }
    }, [email]);
    return (
        <div className="flex bg-black text-white items-center justify-center" style={{ height: 'calc(100vh - 72px)' }}>
            <motion.div
                className="w-full md:w-2/5 flex items-center justify-center p-6 md:p-12 relative"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="hidden md:block">
                    {/* <GradientSpot color="#FF4B4B" size={500} position={{ x: '-30%', y: '-30%' }} opacity={0.15} /> */}
                    <GradientSpot color="#FF8F00" size={500} position={{ x: '30%', y: '30%' }} opacity={0.15} />
                </div>
                <div className="block md:hidden">
                    {/* <GradientSpot color="#FF4B4B" size={250} position={{ x: '-15%', y: '-15%' }} opacity={0.15} /> */}
                    <GradientSpot color="#FF8F00" size={250} position={{ x: '15%', y: '15%' }} opacity={0.15} />
                </div>

                <div className="w-full max-w-md space-y-6 relative z-10">
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-rose-500 to-orange-500 bg-clip-text text-transparent">
                            Forgot Password?
                        </h2>
                        <p className="text-gray-400">Please enter your email address to reset your password</p>
                    </motion.div>

                    <div className="space-y-6">
                        <InputField
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email address"
                            type="email"
                            Icon={Mail}
                        />
                    </div>
                    <div className='flex flex-col !m-0 gap-3'>
                        <p className={`h-5 ${msg.status === 'error' ? 'text-red-500' : 'text-green-500'}`}>
                            {msg.text}
                        </p>
                        <Button
                            text={msg.status === 'success' ? 'Resend Reset Link' : "Send Reset Link"}
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

export default ForgotPassword;