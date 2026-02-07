'use client';

import { useMemo } from 'react';
import { Asset, CycleAnalysis } from '@/lib/types';
import { useBinanceKlines } from './useBinanceKlines';
import { computeCycleAnalysis } from '@/lib/analysis/cycles';

/**
 * Always fetches ALL-time candle data for the given asset,
 * regardless of dashboard time range, because cycle analysis
 * needs the full price history.
 *
 * For non-BTC assets, also fetches BTC candles so that
 * projections use BTC's smart phase detection (same dates).
 */
export function useCycleAnalysis(asset: Asset) {
  const { data: allCandles, loading } = useBinanceKlines(asset, 'ALL');
  // Always fetch BTC candles for projection sync across assets
  const { data: btcCandles, loading: btcLoading } = useBinanceKlines('BTC', 'ALL');

  const cycleAnalysis: CycleAnalysis | null = useMemo(() => {
    if (loading || allCandles.length === 0) return null;
    // For non-BTC assets, pass BTC candles so projections match BTC's
    if (asset !== 'BTC' && !btcLoading && btcCandles.length > 0) {
      return computeCycleAnalysis(allCandles, asset, btcCandles);
    }
    return computeCycleAnalysis(allCandles, asset);
  }, [allCandles, asset, loading, btcCandles, btcLoading]);

  return { cycleAnalysis, allCandles, loading };
}
