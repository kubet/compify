'use client'
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { GradientSpot } from '@/components/Common';
import { Button, InputField, Toast } from '@/components/Elements';
import { registerUser, resendVerificationEmail, loginWithGoogle } from '@/lib/api';
import { baseUrl } from '@/constains';
import GoogleButton from '@/components/Login/GoogleButton';
import { useRouter } from 'next/navigation';

const RegisterPage = () => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [step, setStep] = useState(0);
    const [showPassword, setShowPassword] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('info');
    const [turnstileToken, setTurnstileToken] = useState(null);
    const [passwordStrength, setPasswordStrength] = useState({ score: 0, message: '' });
    const router = useRouter();

    const turnstileCallback = useCallback((token) => {
        setTurnstileToken(token);
    }, []);

    useEffect(() => {
        // Correctly attach the callback to window
        window.onTurnstileCallback = turnstileCallback;

        const script = document.createElement('script');
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
        script.async = true;
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
            delete window.onTurnstileCallback;
        };
    }, [turnstileCallback]);

    const checkPasswordStrength = (pass) => {
        let score = 0;
        let message = '';

        if (pass.length >= 8) score += 25;
        if (/[0-9]/.test(pass)) score += 25;
        if (/[A-Z]/.test(pass)) score += 25;
        if (/[!@#$%^&*(),.?":{}|<>]/.test(pass)) score += 25;

        if (score === 0) message = 'Too weak';
        else if (score <= 25) message = 'Weak';
        else if (score <= 50) message = 'Fair';
        else if (score <= 75) message = 'Good';
        else message = 'Strong';

        return { score, message };
    };

    const handlePasswordChange = (e) => {
        const newPassword = e.target.value;
        setPassword(newPassword);
        setPasswordStrength(checkPasswordStrength(newPassword));
    };

    const handleRegister = async () => {
        if (!firstName.trim()) {
            setToastMessage('First name is required');
            setToastType('error');
            setShowToast(true);
            return;
        }

        if (!email.trim()) {
            setToastMessage('Email address is required');
            setToastType('error');
            setShowToast(true);
            return;
        }

        // disable + in email
        if (email.includes('+')) {
            setToastMessage('Email address cannot contain a +');
            setToastType('error');
            setShowToast(true);
            return;
        }

        // Basic email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setToastMessage('Please enter a valid email address');
            setToastType('error');
            setShowToast(true);
            return;
        }

        if (!turnstileToken) {
            setToastMessage('Please complete the security check');
            setToastType('error');
            setShowToast(true);
            return;
        }

        if (passwordStrength.score <= 25) {
            setToastMessage('Please choose a stronger password. Add uppercase letters, numbers, or special characters.');
            setToastType('error');
            setShowToast(true);
            return;
        }

        const resp = await registerUser({
            firstName,
            lastName,
            email,
            password,
            turnstileToken
        });
        if (resp.status === 201) {
            setStep(1);
        } else {
            setToastMessage(resp.data.message);
            setToastType('error');
            setShowToast(true);
        }
    };

    const handleResendVerificationEmail = async () => {
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

    const handleGoogleSignup = async () => {
        window.open(`${baseUrl}/auth/google`, "_self");
    };

    const renderStep = () => {
        switch (step) {
            case 0: return <div className="w-full space-y-8 relative z-10 max-w-[400px]">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                        Create Account For Free
                    </h2>
                    <p className="text-gray-400">Build once, use anywhere. No credit card required.</p>
                </motion.div>

                <div className="space-y-6">
                    <div className="flex space-x-4">
                        <InputField
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="First Name"
                            onSubmit={() => { }}
                            type="text"
                            Icon={User}
                        />
                        <InputField
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="Last Name"
                            onSubmit={() => { }}
                            type="text"
                            Icon={User}
                        />
                    </div>

                    <InputField
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email address"
                        autoComplete="email"
                        onSubmit={() => { }}
                        type="email"
                        Icon={Mail}
                    />

                    <InputField
                        value={password}
                        onChange={handlePasswordChange}
                        placeholder="Password"
                        type={showPassword ? "text" : "password"}
                        Icon={Lock}
                        disableEnter={true}
                        showButton={true}
                        onSubmit={() => setShowPassword(!showPassword)}
                        RightIcon={showPassword ? EyeOff : Eye}
                    />
                    {password && (
                        <div className="mt-2">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm text-gray-400">Password strength:</span>
                                <span className="text-sm" style={{ color: passwordStrength.score >= 75 ? '#22c55e' : passwordStrength.score >= 50 ? '#eab308' : '#ef4444' }}>
                                    {passwordStrength.message}
                                </span>
                            </div>
                            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full transition-all duration-300"
                                    style={{
                                        width: `${passwordStrength.score}%`,
                                        backgroundColor: passwordStrength.score >= 75 ? '#22c55e' : passwordStrength.score >= 50 ? '#eab308' : '#ef4444'
                                    }}
                                ></div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="pt-2 flex justify-center items-center flex-col w-full">
                    <div
                        className="cf-turnstile"
                        data-callback="onTurnstileCallback"
                        data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                        data-theme="dark"
                        data-size="flexible"
                        style={{ width: '100%', paddingBottom: '10px' }}
                    ></div>
                    <div className="w-full space-y-5">

                        <Button
                            text="Sign Up For Free"
                            variant="full"
                            onClick={handleRegister}
                            fullWidth={true}
                        />

                        <div className="relative flex items-center gap-3">
                            <div className="w-full border-t border-gray-700"></div>
                            <span className="text-sm text-gray-400 whitespace-nowrap">Or continue to</span>
                            <div className="w-full border-t border-gray-700"></div>
                        </div>

                        <div className='w-full flex justify-center'>
                            <GoogleButton onClick={handleGoogleSignup} />
                        </div>
                    </div>
                </div>
                <p className="text-sm text-gray-400 text-center">
                    By registering, you agree to our <a href="/terms" className="text-blue-400 hover:underline">Terms of Service</a>
                </p>
                <p className="text-center text-gray-400 text-sm">
                    Already have an account? <a href="/login" className="text-blue-400 hover:underline">Sign in</a>
                </p>
            </div>;
            case 1: return <div className="w-full max-w-md space-y-8 relative z-10">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                        Check your email
                    </h2>
                    <p className="text-gray-400">
                        We&apos;ve sent you an email to verify your account.
                        Didn&apos;t receive it? <span className="cursor-pointer text-blue-400 hover:underline" onClick={handleResendVerificationEmail}>Click here to resend</span>.
                    </p>

                </motion.div>
            </div>
        }
    }
    return (
        <div className="flex bg-black text-white items-center justify-center mx-auto w-full max-w-7xl" style={{ height: 'calc(100vh - 72px)' }}>
            <motion.div
                className="w-full lg:w-2/5 flex items-center justify-center p-6 md:p-12 relative"
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

                {renderStep()}
            </motion.div>
            {showToast && (
                <Toast
                    message={toastMessage}
                    type={toastType}
                    onClose={() => setShowToast(false)}
                />
            )}
        </div>
    );
};

export default RegisterPage;
