'use client';

import { useState, useEffect } from 'react';
import { FearGreedEntry } from '@/lib/types';
import { API_ROUTES } from '@/lib/constants';
import { transformFearGreed } from '@/lib/transforms/feargreed';

export function useFearGreed() {
  const [data, setData] = useState<FearGreedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetch(API_ROUTES.fng)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (cancelled) return;
        const entries = transformFearGreed(json.data || []);
        setData(entries);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading, error };
}
