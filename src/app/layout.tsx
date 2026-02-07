import type { Metadata } from 'next';
import SessionProvider from '@/components/auth/SessionProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'CoziestTools — BTC & ETH Analytics',
  description:
    'Analyze consecutive red and green trading days for Bitcoin and Ethereum. Compare historical streaks, overlay technical indicators, and track market momentum.',
  metadataBase: new URL('https://coziest.tools'),
  openGraph: {
    title: 'CoziestTools — BTC & ETH Analytics',
    description:
      'Streak analysis, technical indicators, and cycle analytics for BTC & ETH.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CoziestTools — BTC & ETH Analytics',
    description: 'BTC & ETH streak analytics dashboard with technical indicators and cycle analysis.',
    creator: '@vec0zy',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
