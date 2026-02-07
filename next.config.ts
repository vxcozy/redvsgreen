import type { NextConfig } from "next";

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // unsafe-inline required by Next.js for inline styles/scripts;
      // unsafe-eval required by Three.js shader compilation at runtime
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://lh3.googleusercontent.com https://pbs.twimg.com https://api.dicebear.com",
      "font-src 'self' data:",
      "connect-src 'self' https://api.binance.com https://coins.llama.fi https://api.alternative.me https://api.coingecko.com https://www.deribit.com",
      "worker-src 'self' blob:",
      "frame-src 'none'",
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' }, // Google avatars
      { protocol: 'https', hostname: 'pbs.twimg.com' },             // Twitter/X avatars
      { protocol: 'https', hostname: 'api.dicebear.com' },          // Fallback avatars
    ],
  },
};

export default nextConfig;
