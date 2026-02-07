'use client';

import { useDashboard } from '@/context/DashboardContext';
import type { OverlayKey } from '@/lib/types';
import SectionHeader from '@/components/ui/SectionHeader';

interface ToggleItem {
  key: OverlayKey;
  label: string;
  color: string;
}

const OVERLAY_GROUPS: { title: string; items: ToggleItem[] }[] = [
  {
    title: 'Indicators',
    items: [
      { key: 'sma50', label: 'SMA 50', color: '#00bbff' },
      { key: 'sma200', label: 'SMA 200', color: '#ff9500' },
      { key: 'bollingerBands', label: 'Bollinger', color: '#6366f1' },
      { key: 'rsi', label: 'RSI', color: '#a855f7' },
      { key: 'atr', label: 'ATR', color: '#f59e0b' },
    ],
  },
  {
    title: 'Analysis',
    items: [
      { key: 'volume', label: 'Volume', color: '#64748b' },
      { key: 'fearGreed', label: 'Fear & Greed', color: '#eab308' },
      { key: 'streakHistogram', label: 'Distribution', color: '#8b5cf6' },
      { key: 'heatmap', label: 'Heatmap', color: '#f97316' },
    ],
  },
  {
    title: 'Cycle',
    items: [
      { key: 'cycleTimeline', label: 'Cycle Timeline', color: '#f472b6' },
    ],
  },
  {
    title: 'Compare',
    items: [
      { key: 'btcEthComparison', label: 'BTC vs ETH', color: '#06b6d4' },
    ],
  },
];

export default function OverlayTogglePanel() {
  const { state, toggleOverlay } = useDashboard();

  return (
    <div className="rounded-lg border border-border-default bg-bg-card p-3 sm:p-4">
      <SectionHeader title="Overlays" />
      <div className="flex flex-wrap gap-3 sm:gap-6">
        {OVERLAY_GROUPS.map((group) => (
          <div key={group.title} className="flex flex-col gap-1.5 sm:gap-2">
            <span className="text-[8px] uppercase tracking-[0.1em] text-text-muted/60 sm:text-[9px] sm:tracking-[0.15em]">
              {group.title}
            </span>
            <div className="flex flex-wrap gap-1 sm:gap-1.5">
              {group.items.map((item) => {
                const active = state.overlays[item.key];
                return (
                  <button
                    key={item.key}
                    onClick={() => toggleOverlay(item.key)}
                    className={`flex items-center gap-1 rounded-md px-2 py-1 text-[9px] font-medium transition-all sm:gap-1.5 sm:px-2.5 sm:text-[10px] ${
                      active
                        ? 'border border-border-hover bg-bg-tertiary text-text-primary'
                        : 'border border-transparent text-text-muted hover:border-border-default hover:text-text-secondary'
                    }`}
                  >
                    <span
                      className="inline-block h-1.5 w-1.5 rounded-full"
                      style={{
                        backgroundColor: active ? item.color : '#4a5568',
                      }}
                    />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
