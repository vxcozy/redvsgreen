'use client';

import { Asset, OHLCV, StreakStats } from '@/lib/types';
import { useBinanceKlines } from '@/hooks/useBinanceKlines';
import { useStreakAnalysis } from '@/hooks/useStreakAnalysis';
import ComparisonChart from './ComparisonChart';
import ComparisonPriceChart from './ComparisonPriceChart';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface Props {
  asset: Asset;
  currentStats: StreakStats;
  timeRange: string;
  candles: OHLCV[];
}

/**
 * Wrapper that only fetches the comparison asset data when actually
 * rendered (i.e., when the toggle is enabled). This avoids an
 * unnecessary API call + streak computation on every render.
 */
export default function LazyComparisonChart({ asset, currentStats, timeRange, candles }: Props) {
  const compAsset: Asset = asset === 'BTC' ? 'ETH' : 'BTC';
  const { data: compCandles, loading } = useBinanceKlines(compAsset, timeRange);
  const { stats: compStats } = useStreakAnalysis(compCandles);

  if (loading || !compStats) {
    return <LoadingSpinner className="py-10" />;
  }

  const btcCandles = asset === 'BTC' ? candles : compCandles;
  const ethCandles = asset === 'ETH' ? candles : compCandles;

  return (
    <div className="space-y-3 sm:space-y-4">
      <ComparisonPriceChart btcCandles={btcCandles} ethCandles={ethCandles} />
      <ComparisonChart
        btcStats={asset === 'BTC' ? currentStats : compStats}
        ethStats={asset === 'ETH' ? currentStats : compStats}
      />
    </div>
  );
}
