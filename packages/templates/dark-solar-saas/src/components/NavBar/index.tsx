'use client'
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/Button';
import { Tab, TabGroup, TabList } from '@headlessui/react';

// Define types for our navigation items
type NavItem = {
    id: string;
    label: string;
    href: string;
};

// Define props for the MobileMenu component
interface MobileMenuProps {
    navItems: NavItem[];
    activeTab: number;
    setActiveTab: (index: number) => void;
}

function NavBar() {
    const [activeTab, setActiveTab] = useState(0);
    const pathname = usePathname();

    const navItems = useMemo(() => [
        { id: 'home', label: 'Home', href: '/' },
        { id: 'featured', label: 'Featured', href: '/#featured' },
        { id: 'pricing', label: 'Pricing', href: '/#pricing' },
        { id: 'blog', label: 'Blog', href: '/blog' },
    ], []);

    // Helper function to determine active tab from URL
    const determineActiveTab = useCallback(() => {
        const hash = typeof window !== 'undefined' ? window.location.hash : '';

        // For blog section - check this first with highest priority
        if (pathname.startsWith('/blog')) {
            const blogIndex = navItems.findIndex(item => item.href === '/blog');
            if (blogIndex !== -1) {
                return blogIndex;
            }
        }

        // For hash navigation (featured, pricing sections)
        if (pathname === '/' && hash) {
            for (let i = 0; i < navItems.length; i++) {
                const item = navItems[i];
                // Check for both /#hash and /hash patterns
                if (item.href === `/${hash}` ||
                    item.href === `${pathname}${hash}` ||
                    item.href.endsWith(hash)) {
                    return i;
                }
            }
        }

        // For homepage (no hash)
        if (pathname === '/' && !hash) {
            const homeIndex = navItems.findIndex(item => item.href === '/');
            if (homeIndex !== -1) {
                return homeIndex;
            }
        }

        return activeTab;
    }, [pathname, navItems, activeTab]);

    // Set tab on mount and URL change
    useEffect(() => {
        const newTabIndex = determineActiveTab();
        if (newTabIndex !== activeTab) {
            setActiveTab(newTabIndex);
        }
    }, [pathname, activeTab, determineActiveTab]);

    // Handle hash change separately
    useEffect(() => {
        // Handle hash changes that don't trigger pathname change
        const handleHashChange = () => {
            const newTabIndex = determineActiveTab();
            if (newTabIndex !== activeTab) {
                setActiveTab(newTabIndex);
            }
        };

        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, [activeTab, pathname, determineActiveTab]);

    // Handle navigation click with smooth scrolling for hash links
    const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string, index: number) => {
        // Set active tab when clicked
        setActiveTab(index);

        // Only handle hash links (#section)
        if (href.includes('#')) {
            e.preventDefault();

            // Check if we need to navigate to homepage first (if we're not already there)
            if (pathname !== '/' && href.startsWith('/#')) {
                // Navigate to homepage with the hash - this will cause a full page navigation
                window.location.href = href;
                return;
            }

            // Extract the hash portion for scrolling when already on the right page
            const hashPart = href.includes('/') ?
                href.substring(href.indexOf('#')) : href;

            const targetId = hashPart.substring(1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                // Scroll smoothly to the target element
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                });

                // Update URL hash without full page reload
                window.history.pushState(null, '', href);
            }
        }
    };

    // Update active tab based on scroll position
    useEffect(() => {
        // DISABLE the scroll-based tab selection completely as it's likely
        // interfering with our URL-based selection

        // Adding an empty function to prevent any scroll effects
        const handleScroll = () => {
            // Intentionally left empty - we're relying on URL matching instead
        };

        window.addEventListener('scroll', handleScroll);
        // Initial check
        handleScroll();

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    return (
        <header className="fixed top-0 left-0 right-0 z-50 flex justify-center px-6 py-4 md:py-6">
            <motion.nav
                className="flex items-center justify-between w-full md:max-w-fit mx-auto px-2 py-2 rounded-full bg-black/10 backdrop-blur-md border border-white/10"
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                <Link href="/" className="text-xl font-bold mx-6" onClick={() => setActiveTab(0)}>
                    DarkSolar
                </Link>

                {/* Desktop Navigation using Headless UI Tabs */}
                <div className="hidden md:block mr-6">
                    <TabGroup selectedIndex={activeTab} onChange={setActiveTab}>
                        <TabList className="flex gap-2 p-1 bg-black/20 rounded-full">
                            {navItems.map((item, index) => (
                                <Tab
                                    key={item.id}
                                    as={Link}
                                    href={item.href}
                                    onClick={(e) => handleNavClick(e, item.href, index)}
                                    className="rounded-full py-1 px-3 text-sm/6 font-medium text-white focus:outline-none data-[selected]:bg-white/10 data-[hover]:bg-white/5 data-[selected]:data-[hover]:bg-white/10 data-[focus]:outline-1 data-[focus]:outline-white"
                                >
                                    {item.label}
                                </Tab>
                            ))}
                        </TabList>
                    </TabGroup>
                </div>
                {/* CTA Button */}
                <Button className="hidden md:inline-flex" animate={true}>
                    Get Started
                </Button>

                {/* Mobile Menu Button */}
                <div className="md:hidden">
                    <MobileMenu
                        navItems={navItems}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                    />
                </div>
            </motion.nav>
        </header>
    );
}

// Mobile Menu Component
function MobileMenu({ navItems, activeTab, setActiveTab }: MobileMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    // Handle navigation click with smooth scrolling for hash links
    const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string, index: number) => {
        setActiveTab(index);

        // Only handle hash links (#section)
        if (href.includes('#')) {
            e.preventDefault();

            // Check if we need to navigate to homepage first (if we're not already there)
            if (pathname !== '/' && href.startsWith('/#')) {
                window.location.href = href;
                return;
            }

            // Extract the hash portion for scrolling when already on the right page
            const hashPart = href.includes('/') ?
                href.substring(href.indexOf('#')) : href;

            const targetId = hashPart.substring(1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                // Scroll smoothly to the target element
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                });

                // Update URL hash without full page reload
                window.history.pushState(null, '', href);
            }
        }

        // Close the mobile menu
        setIsOpen(false);
    };

    return (
        <div>
            <motion.button
                className="p-2 rounded-full bg-black/20 "
                onClick={() => setIsOpen(!isOpen)}
                whileTap={{ scale: 0.9 }}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {isOpen ? (
                        <>
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </>
                    ) : (
                        <>
                            <line x1="4" y1="8" x2="20" y2="8"></line>
                            <line x1="4" y1="16" x2="20" y2="16"></line>
                        </>
                    )}
                </svg>
            </motion.button>

            {isOpen && (
                <motion.div
                    className="absolute w-full top-16 right-0 p-2 rounded-2xl bg-black backdrop-blur-md border border-white/10"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                >
                    <TabGroup selectedIndex={activeTab} onChange={setActiveTab}>
                        <TabList className="flex flex-col space-y-1">
                            {navItems.map((item, index) => (
                                <Tab
                                    key={item.id}
                                    as={Link}
                                    href={item.href}
                                    onClick={(e) => handleNavClick(e, item.href, index)}
                                    className=" px-4 py-2 text-sm font-medium rounded-2xl transition-colors data-[selected]:bg-white/10 data-[hover]:bg-white/5 focus:outline-none"
                                >
                                    {item.label}
                                </Tab>
                            ))}
                            <Button size="sm" className="mt-2">
                                Get Started
                            </Button>
                        </TabList>
                    </TabGroup>
                </motion.div>
            )}
        </div>
    );
}

export default NavBar;