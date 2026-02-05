import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RED vs GREEN — Crypto Streak Analytics',
  description:
    'Analyze consecutive red and green trading days for Bitcoin and Ethereum. Compare historical streaks, overlay technical indicators, and track market momentum.',
  openGraph: {
    title: 'RED vs GREEN — Crypto Streak Analytics',
    description:
      'Consecutive day streak analysis for BTC & ETH with technical overlays.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
