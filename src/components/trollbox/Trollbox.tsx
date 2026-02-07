'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { usePusher } from '@/hooks/usePusher';
import TrollboxMessage from './TrollboxMessage';

export default function Trollbox() {
  const { data: session } = useSession();
  const { messages, connected, sendMessage } = usePusher();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current && isOpen) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setError('');

    const result = await sendMessage(trimmed);
    if (result.error) {
      setError(result.error);
    } else {
      setInput('');
    }

    setSending(false);
  }, [input, sending, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Unread badge
  const [lastSeenCount, setLastSeenCount] = useState(0);
  const unreadCount = isOpen ? 0 : Math.max(0, messages.length - lastSeenCount);

  useEffect(() => {
    if (isOpen) {
      setLastSeenCount(messages.length);
    }
  }, [isOpen, messages.length]);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end sm:bottom-6 sm:right-6">
      {/* Chat panel */}
      {isOpen && (
        <div className="mb-2 flex h-[420px] w-[320px] flex-col overflow-hidden rounded-lg border border-border-default bg-bg-primary shadow-2xl sm:w-[360px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border-default bg-bg-secondary px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-text-primary">
                Trollbox
              </span>
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  connected ? 'bg-green-streak' : 'bg-text-muted'
                }`}
                title={connected ? 'Connected' : 'Disconnected'}
              />
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-text-muted transition-colors hover:text-text-primary"
              aria-label="Close trollbox"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto py-1">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-[11px] text-text-muted">No messages yet. Be the first!</p>
              </div>
            ) : (
              messages.map((msg) => (
                <TrollboxMessage
                  key={msg.id}
                  message={msg}
                  isOwn={msg.userId === session?.user?.id}
                />
              ))
            )}
          </div>

          {/* Input area */}
          <div className="border-t border-border-default bg-bg-secondary p-2">
            {session ? (
              <>
                {error && (
                  <p className="mb-1 text-[10px] text-red-streak">{error}</p>
                )}
                <div className="flex gap-1.5">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Say something..."
                    maxLength={500}
                    disabled={sending}
                    className="flex-1 rounded-md border border-border-default bg-bg-primary px-2.5 py-1.5 text-[11px] text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none disabled:opacity-50"
                  />
                  <button
                    onClick={handleSend}
                    disabled={sending || !input.trim()}
                    className="shrink-0 rounded-md bg-accent px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-bg-primary transition-opacity hover:opacity-90 disabled:opacity-40"
                  >
                    {sending ? '...' : 'Send'}
                  </button>
                </div>
              </>
            ) : (
              <p className="text-center text-[11px] text-text-muted">
                <button
                  onClick={() => {
                    // Dispatch a click on the header sign-in button
                    const signInBtn = document.querySelector('[data-auth-trigger]');
                    if (signInBtn instanceof HTMLElement) signInBtn.click();
                  }}
                  className="font-semibold text-accent hover:underline"
                >
                  Sign in
                </button>
                {' '}to chat
              </p>
            )}
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-border-default bg-bg-secondary shadow-lg transition-all hover:bg-bg-tertiary hover:shadow-xl active:scale-95"
        aria-label={isOpen ? 'Close trollbox' : 'Open trollbox'}
      >
        {isOpen ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-primary">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-primary">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-streak px-1 text-[9px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}
