import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';

import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import QueryProvider from '@/components/query-provider';

import { Toaster } from '@/components/ui/sonner';
import { NextIntlClientProvider } from 'next-intl';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || 'https://gomwh.com'
  ),
  title: {
    default: 'Mess with Humanity - Create Custom Cards Against Humanity Decks',
    template: '%s | Mess with Humanity',
  },
  description:
    'Create custom Cards Against Humanity decks with your own white answer cards and black question cards. Design, print, and play personalized card games with friends. Free online card creator and deck builder.',
  keywords: [
    'Cards Against Humanity',
    'custom cards',
    'custom card game',
    'card creator',
    'deck builder',
    'playing cards',
    'custom playing cards',
    'printable cards',
    'party game',
    'game cards',
    'custom card deck',
    'CAH',
    'card game maker',
    'white cards',
    'black cards',
    'question cards',
    'answer cards',
    'print playing cards',
    'custom game cards',
    'party card game',
  ],
  authors: [{ name: 'Mess with Humanity' }],
  creator: 'Mess with Humanity',
  publisher: 'Mess with Humanity',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'Mess with Humanity - Create Custom Cards Against Humanity Decks',
    description:
      'Create custom Cards Against Humanity decks with your own white answer cards and black question cards. Design, print, and play personalized card games.',
    siteName: 'Mess with Humanity',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mess with Humanity - Create Custom Cards Against Humanity Decks',
    description:
      'Create custom Cards Against Humanity decks with your own white answer cards and black question cards. Design, print, and play personalized card games.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: '/',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-x-hidden`}
        >
          <NextIntlClientProvider>
            <QueryProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="dark"
                disableTransitionOnChange
              >
                <Toaster />
                {children}
              </ThemeProvider>
            </QueryProvider>
          </NextIntlClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
