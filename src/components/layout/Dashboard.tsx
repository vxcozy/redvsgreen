'use client';

import { useMemo, useCallback } from 'react';
import { Reorder, useDragControls } from 'framer-motion';
import { useDashboard } from '@/context/DashboardContext';
import { useBinanceKlines } from '@/hooks/useBinanceKlines';
import { useFearGreed } from '@/hooks/useFearGreed';
import { useStreakAnalysis } from '@/hooks/useStreakAnalysis';
import { useTechnicalIndicators } from '@/hooks/useTechnicalIndicators';
import { useCycleAnalysis } from '@/hooks/useCycleAnalysis';
import { usePersistedLayout } from '@/hooks/usePersistedLayout';

import CurrentStreakCard from '@/components/cards/CurrentStreakCard';
import CyclePositionCard from '@/components/cards/CyclePositionCard';
import StatsCard from '@/components/cards/StatsCard';
import StreakRecordCard from '@/components/cards/StreakRecordCard';
import OverlayTogglePanel from '@/components/controls/OverlayTogglePanel';
import CandlestickChart from '@/components/charts/CandlestickChart';
import StreakTimeline from '@/components/charts/StreakTimeline';
import RSIChart from '@/components/charts/RSIChart';
import ATRChart from '@/components/charts/ATRChart';
import VolatilityChart from '@/components/charts/VolatilityChart';
import VolumeChart from '@/components/charts/VolumeChart';
import FearGreedChart from '@/components/charts/FearGreedChart';
import StreakHistogram from '@/components/charts/StreakHistogram';
import HeatmapChart from '@/components/charts/HeatmapChart';
import LazyComparisonChart from '@/components/charts/LazyComparisonChart';
import CycleTimelineChart from '@/components/charts/CycleTimelineChart';
import LazyVolatilitySurface from '@/components/charts/LazyVolatilitySurface';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import SkeletonCard from '@/components/ui/SkeletonCard';
import CardWrapper from '@/components/ui/CardWrapper';

import type { CardId, CardSize } from '@/lib/constants';

// ─── Column span helper ─────────────────────────────────────
function getColSpanClass(size: CardSize): string {
  return size === 'S' ? 'col-span-1' : 'col-span-1 lg:col-span-2';
}

// ─── Reorder Item wrapper (each card needs its own drag controls) ─────
function DraggableCard({
  cardId,
  children,
  size,
  onSizeChange,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  cardId: CardId;
  children: React.ReactNode;
  size: CardSize;
  onSizeChange: (s: CardSize) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}) {
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={cardId}
      dragListener={false}
      dragControls={controls}
      transition={{ duration: 0.25 }}
      className={`list-none ${getColSpanClass(size)}`}
    >
      <CardWrapper
        size={size}
        onSizeChange={onSizeChange}
        dragControls={controls}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        isFirst={isFirst}
        isLast={isLast}
      >
        {children}
      </CardWrapper>
    </Reorder.Item>
  );
}

export default function Dashboard() {
  const { state } = useDashboard();
  const { data: candles, loading, error } = useBinanceKlines(state.asset, state.timeRange);
  const { data: fearGreedData } = useFearGreed();
  const { stats } = useStreakAnalysis(candles);
  const { sma50, sma200, rsi, bollingerBands, atr, volatility } = useTechnicalIndicators(candles);
  const { cycleAnalysis, allCandles: cycleCandles } = useCycleAnalysis(state.asset);
  const { order, reorder, getCardSize, setCardSize, hydrated } = usePersistedLayout();

  // Card visibility map — only render cards that should be visible
  const visibleCards = useMemo(() => {
    const vis = new Set<CardId>();
    // Always-visible cards
    vis.add('cyclePosition');
    vis.add('priceChart');
    vis.add('streakTimeline');
    vis.add('overlayPanel');
    vis.add('streakRecords');

    // Overlay-dependent cards
    if (state.overlays.rsi) vis.add('rsi');
    if (state.overlays.atr) vis.add('atr');
    if (state.overlays.volume) vis.add('volume');
    if (state.overlays.fearGreed) vis.add('fearGreed');
    if (state.overlays.streakHistogram) vis.add('streakHistogram');
    if (state.overlays.cycleTimeline && cycleAnalysis && cycleCandles.length > 0) vis.add('cycleTimeline');
    if (state.overlays.volatility && volatility.length > 0) vis.add('volatility');
    if (state.overlays.heatmap) vis.add('heatmap');
    if (state.overlays.volatilitySurface) vis.add('volatilitySurface');
    if (state.overlays.btcEthComparison) vis.add('btcEthComparison');

    return vis;
  }, [state.overlays, cycleAnalysis, cycleCandles, volatility]);

  // Filter to only visible cards (must be before early returns to keep hook order stable)
  const visibleOrder = order.filter((id) => visibleCards.has(id));

  // Move a card up or down within the visible order
  const moveVisibleCard = useCallback((cardId: CardId, direction: 'up' | 'down') => {
    const visIdx = visibleOrder.indexOf(cardId);
    if (visIdx === -1) return;
    const targetVisIdx = direction === 'up' ? visIdx - 1 : visIdx + 1;
    if (targetVisIdx < 0 || targetVisIdx >= visibleOrder.length) return;

    // Swap in the full order array
    const fullIdxA = order.indexOf(cardId);
    const fullIdxB = order.indexOf(visibleOrder[targetVisIdx]);
    if (fullIdxA === -1 || fullIdxB === -1) return;
    const newOrder = [...order];
    [newOrder[fullIdxA], newOrder[fullIdxB]] = [newOrder[fullIdxB], newOrder[fullIdxA]];
    reorder(newOrder);
  }, [visibleOrder, order, reorder]);

  if (error) {
    return (
      <div className="mx-auto max-w-[2400px] px-4 py-20 text-center md:px-6">
        <div className="rounded-lg border border-red-streak/20 bg-red-muted p-6">
          <p className="text-sm text-red-streak">Failed to load data</p>
          <p className="mt-1 text-[11px] text-text-muted">{error}</p>
        </div>
      </div>
    );
  }

  if (loading || !stats) {
    return (
      <div className="mx-auto max-w-[2400px] space-y-3 px-3 py-4 sm:space-y-4 sm:px-4 sm:py-6 md:px-6">
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

  const totalDays = stats.totalGreenDays + stats.totalRedDays;
  const greenRedRatio = totalDays > 0
    ? ((stats.totalGreenDays / totalDays) * 100).toFixed(1)
    : '0.0';

  const greenStreakCount = stats.allStreaks.filter((s) => s.type === 'green').length;
  const redStreakCount = stats.allStreaks.filter((s) => s.type === 'red').length;

  // ─── Card renderer (stats guaranteed non-null after loading check) ───
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const s = stats!;
  function renderCard(cardId: CardId): React.ReactNode {
    switch (cardId) {
      case 'cyclePosition':
        return cycleAnalysis ? (
          <CyclePositionCard analysis={cycleAnalysis} asset={state.asset} />
        ) : (
          <div className="col-span-full rounded-lg border border-border-default bg-bg-card p-3 sm:p-5">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-text-muted/30 border-t-text-muted" />
              <span className="text-[9px] uppercase tracking-[0.15em] text-text-muted sm:text-[10px]">
                Loading cycle data...
              </span>
            </div>
          </div>
        );

      case 'priceChart':
        return (
          <CandlestickChart
            candles={candles}
            sma50={sma50}
            sma200={sma200}
            bollingerBands={bollingerBands}
            showSma50={state.overlays.sma50}
            showSma200={state.overlays.sma200}
            showBollinger={state.overlays.bollingerBands}
          />
        );

      case 'rsi':
        return <RSIChart data={rsi} />;

      case 'atr':
        return <ATRChart data={atr} />;

      case 'streakTimeline':
        return <StreakTimeline streaks={s.allStreaks} />;

      case 'overlayPanel':
        return <OverlayTogglePanel />;

      case 'volume':
        return <VolumeChart candles={candles} asset={state.asset} timeRange={state.timeRange} />;

      case 'fearGreed':
        return fearGreedData.length > 0 ? (
          <FearGreedChart data={fearGreedData} timeRange={state.timeRange} />
        ) : null;

      case 'streakHistogram':
        return (
          <StreakHistogram
            greenDistribution={s.greenStreakDistribution}
            redDistribution={s.redStreakDistribution}
          />
        );

      case 'cycleTimeline':
        return cycleAnalysis && cycleCandles.length > 0 ? (
          <CycleTimelineChart
            candles={cycleCandles}
            analysis={cycleAnalysis}
            asset={state.asset}
          />
        ) : null;

      case 'volatility':
        return <VolatilityChart data={volatility} />;

      case 'heatmap':
        return <HeatmapChart candles={candles} timeRange={state.timeRange} />;

      case 'volatilitySurface':
        return <LazyVolatilitySurface currency={state.asset} />;

      case 'btcEthComparison':
        return (
          <LazyComparisonChart
            asset={state.asset}
            currentStats={s}
            timeRange={state.timeRange}
            candles={candles}
          />
        );

      case 'streakRecords':
        return (
          <div className="grid grid-cols-1 gap-2 sm:gap-4 md:grid-cols-2">
            <StreakRecordCard
              title="Top Green Streaks"
              streaks={s.topGreenStreaks}
              variant="green"
            />
            <StreakRecordCard
              title="Top Red Streaks"
              streaks={s.topRedStreaks}
              variant="red"
            />
          </div>
        );

      default:
        return null;
    }
  }

  return (
    <div className="mx-auto max-w-[2400px] space-y-3 px-3 py-4 sm:space-y-4 sm:px-4 sm:py-6 md:px-6">
      {/* Fixed: Stats cards row 1 */}
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
          variant={parseFloat(greenRedRatio) >= 50 ? 'green' : 'red'}
        />
      </div>

      {/* Fixed: Stats cards row 2 */}
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
          subtext={`${greenStreakCount} green / ${redStreakCount} red`}
          variant={greenStreakCount > redStreakCount ? 'green' : greenStreakCount < redStreakCount ? 'red' : 'neutral'}
        />
        <StatsCard
          label="Current % Change"
          value={`${stats.currentStreak.percentChangeSoFar >= 0 ? '+' : ''}${stats.currentStreak.percentChangeSoFar.toFixed(2)}%`}
          subtext={`${stats.currentStreak.type} streak`}
          variant={stats.currentStreak.type === 'green' ? 'green' : 'red'}
        />
      </div>

      {/* Draggable cards — 2-col grid on lg+ for S/M/L width sizing */}
      {hydrated ? (
        <Reorder.Group
          axis="y"
          values={visibleOrder}
          onReorder={(newOrder) => {
            // Merge reordered visible cards back with hidden cards
            const hiddenInOrder = order.filter((id) => !visibleCards.has(id));
            const full: CardId[] = [];
            let vi = 0;
            let hi = 0;
            for (const id of order) {
              if (visibleCards.has(id)) {
                if (vi < newOrder.length) full.push(newOrder[vi++]);
              } else {
                full.push(hiddenInOrder[hi++]);
              }
            }
            while (vi < newOrder.length) full.push(newOrder[vi++]);
            while (hi < hiddenInOrder.length) full.push(hiddenInOrder[hi++]);
            reorder(full);
          }}
          className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2"
        >
          {visibleOrder.map((cardId, index) => (
            <DraggableCard
              key={cardId}
              cardId={cardId}
              size={getCardSize(cardId)}
              onSizeChange={(s) => setCardSize(cardId, s)}
              onMoveUp={() => moveVisibleCard(cardId, 'up')}
              onMoveDown={() => moveVisibleCard(cardId, 'down')}
              isFirst={index === 0}
              isLast={index === visibleOrder.length - 1}
            >
              {renderCard(cardId)}
            </DraggableCard>
          ))}
        </Reorder.Group>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
          {visibleOrder.map((cardId) => {
            const colClass = getColSpanClass(getCardSize(cardId));
            return (
              <div key={cardId} className={colClass}>{renderCard(cardId)}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
