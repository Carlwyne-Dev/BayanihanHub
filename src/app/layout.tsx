import type { Metadata } from 'next';
import './globals.css';
import { BottomNav } from '@/components/BottomNav';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'BayanihanHub — Community Help, Connected',
  description:
    'A community platform that centralizes help requests and offers, AI-structures them, and connects people faster than scattered social media posts. Built for the DoGoodie Impact Hack.',
  keywords: ['community help', 'bayanihan', 'volunteer', 'Philippines', 'help requests', 'AI'],
  icons: {
    icon: [{ url: '/favicon.png', type: 'image/png' }],
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
  openGraph: {
    title: 'BayanihanHub',
    description: 'See what your community needs right now. Ask for help. Offer help.',
    type: 'website',
    images: ['/logo.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#fcf9f6" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased bg-background text-on-background min-h-screen flex flex-col">
        {children}
        <BottomNav />
        <Toaster position="bottom-center" toastOptions={{ duration: 3000, style: { background: 'var(--surface-container-high)', color: 'var(--on-surface)', border: '1px solid var(--outline-variant)', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontWeight: 500 } }} />
      </body>
    </html>
  );
}
