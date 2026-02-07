'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import PusherClient from 'pusher-js';

export interface TrollboxMessage {
  id: string;
  content: string;
  userId: string;
  userName: string;
  userImage: string | null;
  createdAt: string;
}

let pusherSingleton: PusherClient | null = null;

function getPusherClient(): PusherClient | null {
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

  if (!key || !cluster) return null;

  if (!pusherSingleton) {
    pusherSingleton = new PusherClient(key, { cluster });
  }
  return pusherSingleton;
}

export function usePusher() {
  const [messages, setMessages] = useState<TrollboxMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const channelRef = useRef<ReturnType<PusherClient['subscribe']> | null>(null);

  // Fetch history on mount
  useEffect(() => {
    let cancelled = false;

    fetch('/api/trollbox/history')
      .then((res) => res.json())
      .then((data: TrollboxMessage[]) => {
        if (!cancelled && Array.isArray(data)) {
          setMessages(data);
        }
      })
      .catch(() => {
        // Silently fail — trollbox is non-critical
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Subscribe to Pusher channel
  useEffect(() => {
    const client = getPusherClient();
    if (!client) return;

    const channel = client.subscribe('trollbox');
    channelRef.current = channel;

    channel.bind('new-message', (msg: TrollboxMessage) => {
      setMessages((prev) => [...prev.slice(-99), msg]); // Keep max 100 in memory
    });

    channel.bind('pusher:subscription_succeeded', () => setConnected(true));
    channel.bind('pusher:subscription_error', () => setConnected(false));

    // Check initial connection state
    if (client.connection.state === 'connected') {
      setConnected(true);
    }

    return () => {
      channel.unbind_all();
      client.unsubscribe('trollbox');
      channelRef.current = null;
    };
  }, []);

  // Send message helper
  const sendMessage = useCallback(async (content: string): Promise<{ error?: string }> => {
    try {
      const res = await fetch('/api/trollbox/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (!res.ok) {
        const data = await res.json();
        return { error: data.error || 'Failed to send message' };
      }

      return {};
    } catch {
      return { error: 'Network error' };
    }
  }, []);

  return { messages, connected, sendMessage };
}
