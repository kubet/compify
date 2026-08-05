'use client'

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input'

// Define types for our footer links
type FooterLinkGroup = {
    title: string;
    links: {
        label: string;
        href: string;
    }[];
};

export interface FooterProps {
    className?: string;
}

export function Footer({ className }: FooterProps) {
    const currentYear = new Date().getFullYear();

    const footerLinkGroups: FooterLinkGroup[] = [
        {
            title: 'Product',
            links: [
                { label: 'Features', href: '#features' },
                { label: 'Pricing', href: '#pricing' },
                { label: 'Case Studies', href: '#case-studies' },
                { label: 'Resources', href: '#resources' },
            ],
        },
        {
            title: 'Company',
            links: [
                { label: 'About', href: '#about' },
                { label: 'Team', href: '#team' },
                { label: 'Blog', href: '#blog' },
                { label: 'Careers', href: '#careers' },
            ],
        },
        {
            title: 'Legal',
            links: [
                { label: 'Privacy', href: '#privacy' },
                { label: 'Terms', href: '#terms' },
                { label: 'Cookie Policy', href: '#cookies' },
            ],
        },
    ];

    const socialLinks = [
        { label: 'Twitter', href: '#twitter', icon: 'twitter' },
        { label: 'LinkedIn', href: '#linkedin', icon: 'linkedin' },
        { label: 'GitHub', href: '#github', icon: 'github' },
        { label: 'Instagram', href: '#instagram', icon: 'instagram' },
    ];

    return (
        <motion.footer
            className={`w-full bg-black py-20 ${className}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <div className="container mx-auto px-4">
                {/* Minimal top section with logo and newsletter */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-8">
                    <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 rounded-full bg-primary"></div>
                        <Link href="/" className="text-xl font-medium text-white">
                            DarkSolar
                        </Link>
                    </div>

                    {/* Minimal newsletter */}
                    <div className="w-full md:w-auto">
                        <div className="flex">
                            <Input
                                type="email"
                                placeholder="Your email address"
                                className="rounded-r-none w-full md:w-64"
                                variant="default"
                                size="default"
                            />
                            <Button
                                className="rounded-l-none after:border-t-0"
                                variant="default"
                                size="default"
                            >
                                Subscribe
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Ultra-minimal link section */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-16">
                    {footerLinkGroups.map((group) => (
                        <div key={group.title}>
                            <p className="text-white/50 text-xs uppercase tracking-widest mb-4 font-medium">
                                {group.title}
                            </p>
                            <ul className="space-y-3">
                                {group.links.map((link) => (
                                    <li key={link.label}>
                                        <Link
                                            href={link.href}
                                            className="text-white text-sm hover:text-primary transition-colors"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}

                    {/* Social links */}
                    <div>
                        <p className="text-white/50 text-xs uppercase tracking-widest mb-4 font-medium">
                            Connect
                        </p>
                        <div className="flex space-x-4">
                            {socialLinks.map((link) => (
                                <Link
                                    key={link.label}
                                    href={link.href}
                                    className="text-white hover:text-primary transition-colors"
                                    aria-label={link.label}
                                >
                                    <SocialIcon icon={link.icon} />
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Minimal bottom bar with subtle divider */}
                <div className="pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between items-center">
                    <p className="text-white/40 text-xs mb-4 md:mb-0">
                        © {currentYear} DarkSolar. All rights reserved.
                    </p>
                    <div className="flex items-center space-x-6">
                        <span className="text-white/40 text-xs flex items-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary mr-2"></span>
                            All systems operational
                        </span>
                        <Link href="#" className="text-white/40 text-xs hover:text-white transition-colors">
                            Status
                        </Link>
                        <Link href="#" className="text-white/40 text-xs hover:text-white transition-colors">
                            Support
                        </Link>
                    </div>
                </div>
            </div>
        </motion.footer>
    );
};

// Simple component to render social icons
function SocialIcon({ icon }: { icon: string }) {
    switch (icon) {
        case 'twitter':
            return (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                </svg>
            );
        case 'linkedin':
            return (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                    <rect x="2" y="9" width="4" height="12"></rect>
                    <circle cx="4" cy="4" r="2"></circle>
                </svg>
            );
        case 'github':
            return (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                </svg>
            );
        case 'instagram':
            return (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
            );
        default:
            return null;
    }
}

export default Footer; 