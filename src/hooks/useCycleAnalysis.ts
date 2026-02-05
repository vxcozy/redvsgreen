'use client';

import { useMemo } from 'react';
import { Asset, CycleAnalysis } from '@/lib/types';
import { useBinanceKlines } from './useBinanceKlines';
import { computeCycleAnalysis } from '@/lib/analysis/cycles';

/**
 * Always fetches ALL-time candle data for the given asset,
 * regardless of dashboard time range, because cycle analysis
 * needs the full price history.
 */
export function useCycleAnalysis(asset: Asset) {
  const { data: allCandles, loading } = useBinanceKlines(asset, 'ALL');

  const cycleAnalysis: CycleAnalysis | null = useMemo(() => {
    if (allCandles.length === 0) return null;
    return computeCycleAnalysis(allCandles, asset);
  }, [allCandles, asset]);

  return { cycleAnalysis, allCandles, loading };
}
