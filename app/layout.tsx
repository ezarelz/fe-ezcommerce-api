// app/layout.tsx
import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { ReactQueryProvider } from '@/lib/queryClient';

export const metadata: Metadata = {
  title: 'Shirt — Ecommerce - Web',
  description: 'Stylish fashion apparel for every occasion',
};

// NOTE: dari app/layout.tsx ke public/fonts = ../public/fonts/*
const sfProText = localFont({
  src: [
    {
      path: '../public/fonts/SF-Pro-Text-Regular.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/SF-Pro-Text-Medium.otf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../public/fonts/SF-Pro-Text-Semibold.otf',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../public/fonts/SF-Pro-Text-Bold.otf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-sfpro-text',
  display: 'swap',
});

const sfProDisplay = localFont({
  src: [
    {
      path: '../public/fonts/SF-Pro-Display-Regular.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/SF-Pro-Display-Medium.otf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../public/fonts/SF-Pro-Display-Semibold.otf',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../public/fonts/SF-Pro-Display-Bold.otf',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../public/fonts/SF-Pro-Display-BlackItalic.otf',
      weight: '900',
      style: 'italic',
    },
  ],
  variable: '--font-sfpro-display',
  display: 'swap',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en'>
      <body
        className={`${sfProText.variable} ${sfProDisplay.variable} antialiased bg-white text-zinc-900`}
      >
        <ReactQueryProvider>
          <main className='min-h-dvh'>{children}</main>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
