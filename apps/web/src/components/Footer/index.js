'use client'
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { InputField } from '../Elements';
import { ArrowRight, Github } from 'lucide-react';
import { subcribeToNewsletter } from '@/lib/api';

// Utility function for email validation
export const isValidEmail = (email) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
};

const Footer = () => {
    const [email, setEmail] = useState('');
    const [newsletterMessage, setNewsletterMessage] = useState('');
    const handleSubmit = async () => {
        if (!isValidEmail(email)) return;
        const response = await subcribeToNewsletter(email);
        if (response.status === 201) {
            setEmail('');
            setNewsletterMessage('Thank you! This is a beta version of the newsletter. We will send you updates when we launch.');
        } else {
            setNewsletterMessage('Something went wrong. Please try again.');
        }
    };

    const decodeEmail = () => {
        const encoded = '115,117,112,112,111,114,116,64,99,111,109,112,105,102,121,46,97,112,112';
        return encoded.split(',').map(char => String.fromCharCode(parseInt(char))).join('');
    };

    const footerSections = [
        {
            title: 'Connect',
            items: [
                { title: 'Open source on GitHub', href: 'https://github.com/kubet/compify', github: true, external: true },
                { title: '𝕏', href: 'https://x.com/compify_app', icon: '𝕏' },
                { title: 'Discord', href: 'https://discord.gg/FY7SZTVW', icon: 'Discord' },
                {
                    title: 'Support',
                    href: '#',
                    icon: 'Mail',
                    onClick: (e) => {
                        e.preventDefault();
                        window.location.href = `mailto:${decodeEmail()}`;
                    }
                }
            ]
        },
        { title: 'Resources', items: [{ title: 'Blog', href: '/blog' }, { title: 'Docs', href: '/docs' }, { title: 'Registry', href: 'https://api.compify.app/r/registry.json' }] },
        { title: 'Legal', items: [{ title: 'Terms of Service', href: '/terms' }, { title: 'Privacy Policy', href: '/privacy' }] },
    ];

    return (
        <motion.footer
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-gray-300 py-16 w-full"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                    <div className="space-y-6">
                        <h3 className="text-3xl font-bold text-white">Compify</h3>
                        <p className="text-base text-gray-400 leading-relaxed max-w-xs">
                            Package selected React CSF source into reviewable shadcn registry artifacts.
                        </p>
                    </div>

                    {footerSections.map((section) => (
                        <div key={section.title} className="space-y-6">
                            <h4 className="text-xl font-semibold text-white">{section.title}</h4>
                            <ul className="space-y-4">
                                {section.items.map((item) => (
                                    <li key={item.title}>
                                        <a
                                            href={item.href}
                                            onClick={item.onClick}
                                            target={item.external ? '_blank' : undefined}
                                            rel={item.external ? 'noreferrer' : undefined}
                                            className="group flex items-center text-base text-gray-400 hover:text-white transition-colors duration-200"
                                        >
                                            {item.github && <Github aria-hidden="true" className="mr-2 h-4 w-4" />}
                                            {item.title}
                                            <ArrowRight className="ml-2 h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                    <div className="space-y-6">
                        <h4 className="text-xl font-semibold text-white">Subscribe</h4>
                        <div className="space-y-4">
                            <p className="text-base text-gray-400 leading-relaxed">
                                Stay updated with our latest components and features.
                            </p>
                            <div className="space-y-3">
                                {newsletterMessage ? (
                                    <motion.p
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-sm text-white/80"
                                    >
                                        {newsletterMessage}
                                    </motion.p>
                                ) : (
                                    <InputField
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Enter your email"
                                        className="w-full backdrop-blur-sm bg-white/5 border-white/10 focus:border-purple-500"
                                        onSubmit={handleSubmit}
                                        showButton={isValidEmail(email)}
                                        buttonAnimation={{ x: [0, 5, 0] }}
                                        RightIcon={ArrowRight}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-8 border-t border-white/10">
                    <div className="flex flex-col md:flex-row justify-center items-center gap-4">
                        <p className="text-sm text-gray-400">&copy; 2026 Compify. All rights reserved.</p>
                    </div>
                </div>
            </div>
        </motion.footer>
    );
};

export default Footer;