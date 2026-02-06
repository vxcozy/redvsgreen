'use client';

import { useState, useEffect } from 'react';
import { OHLCV, Asset } from '@/lib/types';
import { BINANCE_SYMBOLS, API_ROUTES, TIME_RANGE_DAYS } from '@/lib/constants';
import { transformKlines } from '@/lib/transforms/binance';

export function useBinanceKlines(asset: Asset, timeRange: string) {
  const [data, setData] = useState<OHLCV[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const symbol = BINANCE_SYMBOLS[asset];
    const days = TIME_RANGE_DAYS[timeRange] || 365;

    fetch(`${API_ROUTES.klines}?symbol=${symbol}&interval=1d&days=${days}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((raw) => {
        if (cancelled) return;
        if (!Array.isArray(raw)) {
          throw new Error(raw?.error || 'Invalid response format');
        }
        if (raw.length === 0) {
          throw new Error('No candle data returned');
        }
        const transformed = transformKlines(raw);
        setData(transformed);
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
  }, [asset, timeRange]);

  return { data, loading, error };
}
