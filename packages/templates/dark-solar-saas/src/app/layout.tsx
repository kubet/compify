import type { Metadata } from "next";
import { Geist, Geist_Mono, Open_Sans } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DarkSolar - Modern SaaS Template",
  description: "A beautiful SaaS template with a pill-shaped navbar and responsive design",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <head>
        {/* Removed view-transition meta tag - experimental with limited support */}
      </head>
      <body className={`h-full text-white bg-black ${geistSans.variable} ${geistMono.variable} ${openSans.variable} font-sans`}>
        <NavBar />
        <div className="w-full max-w-7xl mx-auto px-6 sm:px-8 md:px-12 lg:px-16">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}
