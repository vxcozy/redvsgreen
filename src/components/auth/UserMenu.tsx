'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { signOut } from 'next-auth/react';
import type { Session } from 'next-auth';
import UserAvatar from '@/components/ui/UserAvatar';

interface Props {
  session: Session;
}

export default function UserMenu({ session }: Props) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, handleClickOutside]);

  const user = session.user;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-1.5 rounded-md border border-border-default bg-bg-secondary p-1 transition-colors hover:border-border-hover"
        aria-label="User menu"
      >
        <UserAvatar src={user?.image} name={user?.name} email={user?.email} size={22} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-border-default bg-bg-card p-1 shadow-xl">
          <div className="border-b border-border-default px-3 py-2">
            <p className="truncate text-[11px] font-medium text-text-primary">
              {user?.name || 'Anonymous'}
            </p>
            {user?.email && (
              <p className="truncate text-[9px] text-text-muted">{user.email}</p>
            )}
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="mt-1 w-full rounded-md px-3 py-1.5 text-left text-[11px] text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-primary"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
