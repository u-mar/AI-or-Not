import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import Navbar from '@/components/Navbar';
import ThemeProvider from '@/components/ThemeProvider';
import ScrollReveal from '@/components/ScrollReveal';
import { AuthProvider } from '@/components/AuthProvider';
import MobileAuthGate from '@/components/MobileAuthGate';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: {
    default: 'AI or Not — Can You Trust What You See?',
    template: '%s — AI or Not',
  },
  description: 'Detect whether images are real or AI-generated using machine learning.',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent' },
};

export const viewport: Viewport = {
  themeColor: '#0B1020',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>
            <MobileAuthGate>
              <Navbar />
              <main>{children}</main>
              <ScrollReveal />
            </MobileAuthGate>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
