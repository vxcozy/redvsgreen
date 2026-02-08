'use client';

import { useState, useEffect } from 'react';
import type { IVTermStructureData } from '@/app/api/iv-term-structure/route';

export function useIVTermStructure(currency: string) {
  const [data, setData] = useState<IVTermStructureData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/iv-term-structure?currency=${currency}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json: IVTermStructureData) => {
        if (!cancelled) {
          setData(json);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currency]);

  return { data, loading, error };
}
