import type { Metadata } from 'next';
import SessionProvider from '@/components/auth/SessionProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Red vs Green Streaks by Cozy',
  description:
    'Analyze consecutive red and green trading days for Bitcoin and Ethereum. Compare historical streaks, overlay technical indicators, and track market momentum.',
  metadataBase: new URL('https://www.redvgreen.tech'),
  openGraph: {
    title: 'Red vs Green Streaks by Cozy',
    description:
      'Consecutive day streak analysis for BTC & ETH with technical overlays.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Red vs Green Streaks by Cozy',
    description: 'BTC & ETH streak analytics dashboard with technical indicators and cycle analysis.',
    creator: '@vec0zy',
  },
  icons: {
    icon: '/favicon.ico',
  },
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
