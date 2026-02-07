'use client';

import { useState, useCallback, useEffect } from 'react';
import { CARD_IDS, CardId, CardSize } from '@/lib/constants';

const STORAGE_KEY = 'rvg-card-layout-v1';
const MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000; // 365 days

interface PersistedLayout {
  order: CardId[];
  sizes: Partial<Record<CardId, CardSize>>;
  timestamp: number;
}

function loadLayout(): PersistedLayout | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: PersistedLayout = JSON.parse(raw);
    if (Date.now() - parsed.timestamp > MAX_AGE_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function saveLayout(layout: PersistedLayout) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  } catch {
    // Silently fail if localStorage is full
  }
}

/**
 * Reconcile saved order with current CARD_IDS.
 * Preserves saved order for known IDs, appends new IDs at the end,
 * and removes IDs that no longer exist.
 */
function reconcileOrder(saved: CardId[]): CardId[] {
  const currentSet = new Set<CardId>(CARD_IDS);
  const kept = saved.filter((id) => currentSet.has(id));
  const keptSet = new Set(kept);
  const added = CARD_IDS.filter((id) => !keptSet.has(id));
  return [...kept, ...added];
}

export function usePersistedLayout() {
  const [order, setOrder] = useState<CardId[]>([...CARD_IDS]);
  const [sizes, setSizes] = useState<Partial<Record<CardId, CardSize>>>({});
  const [hydrated, setHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = loadLayout();
    if (saved) {
      setOrder(reconcileOrder(saved.order));
      setSizes(saved.sizes || {});
    }
    setHydrated(true);
  }, []);

  // Persist on changes (skip initial hydration)
  useEffect(() => {
    if (!hydrated) return;
    saveLayout({ order, sizes, timestamp: Date.now() });
  }, [order, sizes, hydrated]);

  const reorder = useCallback((newOrder: CardId[]) => {
    setOrder(newOrder);
  }, []);

  const setCardSize = useCallback((cardId: CardId, size: CardSize) => {
    setSizes((prev) => ({ ...prev, [cardId]: size }));
  }, []);

  const getCardSize = useCallback(
    (cardId: CardId): CardSize => sizes[cardId] || 'M',
    [sizes],
  );

  return { order, reorder, getCardSize, setCardSize, hydrated };
}
