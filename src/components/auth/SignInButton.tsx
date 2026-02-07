'use client';

import { useState } from 'react';
import AuthModal from './AuthModal';

export default function SignInButton() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="rounded-md border border-border-default bg-bg-secondary px-2.5 py-1 text-[10px] font-medium text-text-muted transition-colors hover:border-border-hover hover:text-text-primary sm:text-[11px]"
      >
        Sign in
      </button>
      <AuthModal open={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}
