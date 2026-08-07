"use client";
import React, { useState, useEffect } from "react";
import { Button } from "../Elements";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "@/auth/UseUser";
import { motion, AnimatePresence } from "framer-motion";
import { Menu } from "lucide-react";
import PreloadLink from "@/utils/pre-fetch";

function NavBar() {
  const router = useRouter();
  const { isSignedIn } = useUser();
  const [navLinks, setNavLinks] = useState([]);
  const [buttonText, setButtonText] = useState("Login"); // Default to 'Login'a
  const [logoHref, setLogoHref] = useState("/"); // Add this line
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const notLoggedInLinks = [
    { title: "Browse", href: "/search" },
    { title: "Features", href: "/#features" },
    { title: "Demo", href: "/#demo" },
    { title: "Pricing", href: "/#pricing" },
    { title: "Templates", href: "/templates" },
    { title: "Components", href: "/#components" },
  ];

  const loggedInLinks = [
    { title: "Search", href: "/search" },
    { title: "Templates", href: "/templates" },
    { title: "Create", href: "/create" },
    { title: "My Components", href: "/my-components" },
  ];

  useEffect(() => {
    setNavLinks(isSignedIn ? loggedInLinks : notLoggedInLinks);
    setButtonText(isSignedIn ? "Profile" : "Login");
    setLogoHref(isSignedIn ? "/search" : "/");
  }, [isSignedIn, isOpen]);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <div
      className={`site-navbar fixed top-0 left-0 w-full z-[9999] ${pathname === "/" ? "border-b border-white/5" : ""} bg-black backdrop-blur-sm ${isOpen ? "bg-opacity-80" : "bg-opacity-50"}`}
    >
      <div className="mx-auto max-w-7xl px-4">
        <nav className="flex justify-between items-center w-full py-4">
          <PreloadLink
            href={logoHref}
            className="text-2xl font-bold text-white relative"
          >
            Comp
            <span className="relative">
              <span className="relative">i</span>
              <span className="absolute top-0 left-0 w-full h-full flex justify-center">
                <span className="w-[0.22em] h-[0.22em] bg-pink-500 rounded-full mt-[0.21em] ml-[0.05em] shadow-glow opacity-60 blur-[1px]"></span>
              </span>
            </span>
            fy
          </PreloadLink>
          <div className="hidden md:flex space-x-4">
            {navLinks.map((link, index) => (
              <PreloadLink
                key={index}
                href={link.href}
                className={`${pathname === link.href ? "text-white" : "text-gray-300"
                  } hover:text-white transition-colors`}
              >
                {link.title}
              </PreloadLink>
            ))}
          </div>
          <div className="hidden md:block">
            <Button
              text={buttonText}
              variant="outline"
              size="small"
              showIcon={false}
              onClick={() => router.push(isSignedIn ? "/profile" : "/login")}
            />
          </div>
          <div className="md:hidden">
            <motion.div
              animate={{
                scale: isOpen ? 0.9 : 1,
              }}
              transition={{ duration: 0.1 }}
            >
              <button
                className="text-white p-2"
                onClick={toggleMenu}
                aria-label="Toggle navigation menu"
                aria-expanded={isOpen}
                aria-controls="mobile-menu"
              >
                <Menu size={24} aria-hidden="true" />
              </button>
            </motion.div>
          </div>
        </nav>
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="relative z-10 max-w-7xl mx-auto px-4 py-4 space-y-4 h-full overflow-y-auto">
              {navLinks.map((link, index) => (
                <PreloadLink
                  key={index}
                  href={link.href}
                  className={`block py-2 text-lg ${pathname === link.href ? "text-white" : "text-gray-300"
                    } hover:text-white transition-colors`}
                  onClick={() => setIsOpen(false)}
                >
                  {link.title}
                </PreloadLink>
              ))}
              <Button
                text={buttonText}
                variant="outline"
                size="small"
                showIcon={false}
                onClick={() => {
                  router.push(isSignedIn ? "/profile" : "/login");
                  setIsOpen(false);
                }}
                fullWidth
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default NavBar;
