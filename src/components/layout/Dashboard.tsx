'use client';

import { useDashboard } from '@/context/DashboardContext';
import { useBinanceKlines } from '@/hooks/useBinanceKlines';
import { useFearGreed } from '@/hooks/useFearGreed';
import { useStreakAnalysis } from '@/hooks/useStreakAnalysis';
import { useTechnicalIndicators } from '@/hooks/useTechnicalIndicators';
import { useCycleAnalysis } from '@/hooks/useCycleAnalysis';

import CurrentStreakCard from '@/components/cards/CurrentStreakCard';
import CyclePositionCard from '@/components/cards/CyclePositionCard';
import StatsCard from '@/components/cards/StatsCard';
import StreakRecordCard from '@/components/cards/StreakRecordCard';
import OverlayTogglePanel from '@/components/controls/OverlayTogglePanel';
import CandlestickChart from '@/components/charts/CandlestickChart';
import StreakTimeline from '@/components/charts/StreakTimeline';
import RSIChart from '@/components/charts/RSIChart';
import VolumeChart from '@/components/charts/VolumeChart';
import FearGreedChart from '@/components/charts/FearGreedChart';
import StreakHistogram from '@/components/charts/StreakHistogram';
import HeatmapChart from '@/components/charts/HeatmapChart';
import ComparisonChart from '@/components/charts/ComparisonChart';
import CycleTimelineChart from '@/components/charts/CycleTimelineChart';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import SkeletonCard from '@/components/ui/SkeletonCard';

export default function Dashboard() {
  const { state } = useDashboard();
  const { data: candles, loading, error } = useBinanceKlines(state.asset, state.timeRange);
  const { data: fearGreedData } = useFearGreed();
  const { stats } = useStreakAnalysis(candles);
  const { sma50, sma200, rsi, bollingerBands } = useTechnicalIndicators(candles);

  // Cycle analysis (always uses ALL-time data)
  const { cycleAnalysis, allCandles: cycleCandles } = useCycleAnalysis(state.asset);

  // Comparison data
  const compAsset = state.asset === 'BTC' ? 'ETH' : 'BTC';
  const { data: compCandles } = useBinanceKlines(compAsset, state.timeRange);
  const { stats: compStats } = useStreakAnalysis(compCandles);

  if (error) {
    return (
      <div className="mx-auto max-w-[1440px] px-4 py-20 text-center md:px-6">
        <div className="rounded-lg border border-red-streak/20 bg-red-muted p-6">
          <p className="text-sm text-red-streak">Failed to load data</p>
          <p className="mt-1 text-[11px] text-text-muted">{error}</p>
        </div>
      </div>
    );
  }

  if (loading || !stats) {
    return (
      <div className="mx-auto max-w-[1440px] space-y-3 px-3 py-4 sm:space-y-4 sm:px-4 sm:py-6 md:px-6">
        <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <LoadingSpinner className="py-20" />
      </div>
    );
  }

  const greenRedRatio = (
    (stats.totalGreenDays / (stats.totalGreenDays + stats.totalRedDays)) *
    100
  ).toFixed(1);

  return (
    <div className="mx-auto max-w-[1440px] space-y-3 px-3 py-4 sm:space-y-4 sm:px-4 sm:py-6 md:px-6">
      {/* Row 1: Stats cards */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
        <CurrentStreakCard streak={stats.currentStreak} asset={state.asset} />
        <StatsCard
          label="Longest Green Streak"
          value={`${stats.longestGreen.length}d`}
          subtext={stats.longestGreen.startDate}
          variant="green"
        />
        <StatsCard
          label="Longest Red Streak"
          value={`${stats.longestRed.length}d`}
          subtext={stats.longestRed.startDate}
          variant="red"
        />
        <StatsCard
          label="Green Day Ratio"
          value={`${greenRedRatio}%`}
          subtext={`${stats.totalGreenDays} green / ${stats.totalRedDays} red`}
        />
      </div>

      {/* Row 2: Averages */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
        <StatsCard
          label="Avg Green Streak"
          value={stats.avgGreenLength}
          subtext="consecutive days"
          variant="green"
        />
        <StatsCard
          label="Avg Red Streak"
          value={stats.avgRedLength}
          subtext="consecutive days"
          variant="red"
        />
        <StatsCard
          label="Total Streaks"
          value={`${stats.allStreaks.length}`}
          subtext={`${stats.allStreaks.filter((s) => s.type === 'green').length} green / ${stats.allStreaks.filter((s) => s.type === 'red').length} red`}
        />
        <StatsCard
          label="Current % Change"
          value={`${stats.currentStreak.percentChangeSoFar >= 0 ? '+' : ''}${stats.currentStreak.percentChangeSoFar.toFixed(2)}%`}
          subtext={`${stats.currentStreak.type} streak`}
          variant={stats.currentStreak.type === 'green' ? 'green' : 'red'}
        />
      </div>

      {/* Row 2.5: Cycle Position Card (always visible) */}
      {cycleAnalysis && (
        <CyclePositionCard analysis={cycleAnalysis} asset={state.asset} />
      )}

      {/* Row 3: Candlestick chart */}
      <CandlestickChart
        candles={candles}
        sma50={sma50}
        sma200={sma200}
        bollingerBands={bollingerBands}
        showSma50={state.overlays.sma50}
        showSma200={state.overlays.sma200}
        showBollinger={state.overlays.bollingerBands}
      />

      {/* Row 4: Streak timeline */}
      <StreakTimeline streaks={stats.allStreaks} />

      {/* Row 5: Overlay toggle panel */}
      <OverlayTogglePanel />

      {/* Row 6: Conditional panels */}
      <div className="grid grid-cols-1 gap-2 sm:gap-4 md:grid-cols-2">
        {state.overlays.rsi && <RSIChart data={rsi} />}
        {state.overlays.volume && <VolumeChart candles={candles} />}
      </div>

      {state.overlays.fearGreed && fearGreedData.length > 0 && (
        <FearGreedChart data={fearGreedData} />
      )}

      {state.overlays.streakHistogram && (
        <StreakHistogram
          greenDistribution={stats.greenStreakDistribution}
          redDistribution={stats.redStreakDistribution}
        />
      )}

      {state.overlays.cycleTimeline && cycleAnalysis && cycleCandles.length > 0 && (
        <CycleTimelineChart
          candles={cycleCandles}
          analysis={cycleAnalysis}
          asset={state.asset}
        />
      )}

      {state.overlays.heatmap && <HeatmapChart candles={candles} />}

      {state.overlays.btcEthComparison && (
        <ComparisonChart
          btcStats={state.asset === 'BTC' ? stats : compStats}
          ethStats={state.asset === 'ETH' ? stats : compStats}
        />
      )}

      {/* Row 7: Top streak records */}
      <div className="grid grid-cols-1 gap-2 sm:gap-4 md:grid-cols-2">
        <StreakRecordCard
          title="Top Green Streaks"
          streaks={stats.topGreenStreaks}
          variant="green"
        />
        <StreakRecordCard
          title="Top Red Streaks"
          streaks={stats.topRedStreaks}
          variant="red"
        />
      </div>
    </div>
  );
}
