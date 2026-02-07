'use client';

import { useDashboard } from '@/context/DashboardContext';
import type { Asset, TimeRange } from '@/lib/types';

export default function Header() {
  const { state, setAsset, setTimeRange } = useDashboard();

  const assets: Asset[] = ['BTC', 'ETH'];
  const timeRanges: TimeRange[] = ['3M', '6M', '1Y', '2Y', 'ALL'];

  return (
    <header className="sticky top-0 z-50 border-b border-border-default bg-bg-primary/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-3 py-2 sm:px-4 sm:py-3 md:px-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <h1 className="font-[var(--font-display)] text-base font-black tracking-tight sm:text-lg md:text-xl">
            <span className="text-red-streak">RED</span>
            <span className="mx-1 text-text-muted font-light sm:mx-1.5">vs</span>
            <span className="text-green-streak">GREEN</span>
          </h1>
          <span className="hidden text-[10px] uppercase tracking-[0.2em] text-text-muted md:inline">
            Streaks by{' '}
            <a
              href="https://x.com/vec0zy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              Cozy
            </a>
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
          <div className="flex rounded-md border border-border-default bg-bg-secondary p-0.5">
            {assets.map((asset) => (
              <button
                key={asset}
                onClick={() => setAsset(asset)}
                className={`rounded-[3px] px-2 py-1 text-[10px] font-semibold tracking-wide transition-all sm:px-3 sm:text-[11px] ${
                  state.asset === asset
                    ? 'bg-bg-tertiary text-accent shadow-sm'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                {asset}
              </button>
            ))}
          </div>

          <div className="flex rounded-md border border-border-default bg-bg-secondary p-0.5">
            {timeRanges.map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`rounded-[3px] px-2 py-1 text-[10px] font-medium tracking-wide transition-all sm:px-2.5 sm:text-[11px] ${
                  state.timeRange === range
                    ? 'bg-bg-tertiary text-text-primary shadow-sm'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
