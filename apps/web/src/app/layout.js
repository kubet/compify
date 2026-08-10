import { siteUrl } from '@/constains';
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
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Compify — Reviewable Storybook to shadcn artifacts',
    template: '%s | Compify'
  },
  description: 'Statically package selected React component source, using Storybook CSF as the review boundary, into deterministic shadcn registry artifacts.',
  openGraph: {
    type: 'website',
    siteName: 'Compify',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Compify Storybook-to-shadcn handoff' }],
    locale: 'en_US',
    title: 'Compify — Reviewable Storybook to shadcn artifacts',
    description: 'Statically package selected React component source, using Storybook CSF as the review boundary, into deterministic shadcn registry artifacts.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Compify — Reviewable Storybook to shadcn artifacts',
    description: 'Statically package selected React component source, using Storybook CSF as the review boundary, into deterministic shadcn registry artifacts.',
    images: ['/og-image.png'],
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
          <div className="site-navbar-spacer w-full h-16"></div>
          {children}
        </UserProvider>
      </body>
    </html>
  );
}
