'use client';

import { Asset, StreakStats } from '@/lib/types';
import { useBinanceKlines } from '@/hooks/useBinanceKlines';
import { useStreakAnalysis } from '@/hooks/useStreakAnalysis';
import ComparisonChart from './ComparisonChart';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface Props {
  asset: Asset;
  currentStats: StreakStats;
  timeRange: string;
}

/**
 * Wrapper that only fetches the comparison asset data when actually
 * rendered (i.e., when the toggle is enabled). This avoids an
 * unnecessary API call + streak computation on every render.
 */
export default function LazyComparisonChart({ asset, currentStats, timeRange }: Props) {
  const compAsset: Asset = asset === 'BTC' ? 'ETH' : 'BTC';
  const { data: compCandles, loading } = useBinanceKlines(compAsset, timeRange);
  const { stats: compStats } = useStreakAnalysis(compCandles);

  if (loading || !compStats) {
    return <LoadingSpinner className="py-10" />;
  }

  return (
    <ComparisonChart
      btcStats={asset === 'BTC' ? currentStats : compStats}
      ethStats={asset === 'ETH' ? currentStats : compStats}
    />
  );
}
