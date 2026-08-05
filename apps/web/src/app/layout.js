import NavBar from "@/components/NavBar";
import "./globals.css";
import { UserProvider } from '@/auth/UseUser';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';
import AxiosInterceptor from "@/components/AxiosInterceptor";
import localFont from 'next/font/local'

const suse = localFont({
  src: '../../public/fonts/SUSE.ttf',
  variable: '--font-suse'
})

export const metadata = {
  title: {
    default: 'Compify - Build & Share Beautiful UI Components | Component Library',
    template: '%s | Compify - Component Builder'
  },
  description: 'Build Faster Using Reusable Components. Preview, customize, and share high-quality UI across your projects.',
  openGraph: {
    type: 'website',
    siteName: 'Compify - Component Builder',
    images: ['https://cdn.compify.app/default-og.webp'],
    locale: 'en_US',
    title: 'Compify - Build Beautiful UI Components | Modern Component Library',
    description: 'Build Faster Using Reusable Components. Preview, customize, and share high-quality UI across your projects.',
  },
  twitter: {
    card: 'summary_large_image',
    // creator: '@yourtwitter', // TODO: add twitter handle
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favicon.ico',
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${suse.className}`}>
      <body suppressHydrationWarning={true}>
        <UserProvider>
          <AxiosInterceptor />
          <ServiceWorkerRegistration />
          <NavBar />
          <div className="w-full h-16"></div>
          {children}
        </UserProvider>
      </body>
    </html>
  );
}
