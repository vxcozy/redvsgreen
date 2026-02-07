'use client';

import Image from 'next/image';

interface Props {
  src?: string | null;
  name?: string | null;
  email?: string | null;
  size?: number;
  className?: string;
}

// Simple hash to avoid sending raw PII (email/name) to external Dicebear service
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash).toString(36);
}

function getFallbackUrl(email?: string | null, name?: string | null): string {
  const seed = simpleHash(email || name || 'anonymous');
  return `https://api.dicebear.com/7.x/identicon/svg?seed=${seed}`;
}

export default function UserAvatar({ src, name, email, size = 28, className = '' }: Props) {
  const imgSrc = src || getFallbackUrl(email, name);

  return (
    <Image
      src={imgSrc}
      alt={name || 'User avatar'}
      width={size}
      height={size}
      className={`rounded-full bg-bg-tertiary ${className}`}
      unoptimized={imgSrc.includes('dicebear.com')}
    />
  );
}
