'use client';

import { useSession } from 'next-auth/react';
import SignInButton from './SignInButton';
import UserMenu from './UserMenu';

export default function AuthButton() {
  const { data: session, status } = useSession();

  // Don't render anything during loading to prevent layout shift
  if (status === 'loading') {
    return (
      <div className="h-[30px] w-[30px] animate-pulse rounded-md bg-bg-secondary" />
    );
  }

  if (session) {
    return <UserMenu session={session} />;
  }

  return <SignInButton />;
}
