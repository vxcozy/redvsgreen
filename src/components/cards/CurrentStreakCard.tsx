'use client';

import { CurrentStreakStatus } from '@/lib/types';

interface Props {
  streak: CurrentStreakStatus | null;
  asset: string;
}

export default function CurrentStreakCard({ streak, asset }: Props) {
  if (!streak) return null;

  const isGreen = streak.type === 'green';
  const glowClass = isGreen ? 'glow-green' : 'glow-red';
  const textGlow = isGreen ? 'glow-green-text' : 'glow-red-text';
  const label = isGreen ? 'GREEN' : 'RED';
  const arrow = isGreen ? '\u25B2' : '\u25BC';
  const colorStyle = isGreen ? '#00ff87' : '#ff3b5c';

  return (
    <div className={`relative overflow-hidden rounded-lg border border-border-default bg-bg-card p-3 sm:p-5 ${glowClass}`}>
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          background: `radial-gradient(ellipse at top left, ${colorStyle}, transparent 60%)`,
        }}
      />
      <div className="relative">
        <div className="mb-0.5 flex items-center gap-1.5 sm:mb-1 sm:gap-2">
          <span className="text-[9px] uppercase tracking-[0.15em] text-text-muted sm:text-[10px] sm:tracking-[0.2em]">
            Current Streak
          </span>
          <span className="text-[9px] font-bold uppercase tracking-[0.1em] sm:text-[10px] sm:tracking-[0.15em]" style={{ color: colorStyle }}>
            {asset}
          </span>
        </div>
        <div className="flex items-baseline gap-2 sm:gap-3">
          <span className={`text-2xl font-black font-[var(--font-display)] sm:text-4xl ${textGlow}`} style={{ color: colorStyle }}>
            {streak.length}
          </span>
          <span className="text-xs font-medium text-text-secondary sm:text-sm">
            {label} {streak.length === 1 ? 'day' : 'days'}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-1.5 sm:mt-2 sm:gap-2">
          <span className="text-xs font-semibold sm:text-sm" style={{ color: colorStyle }}>
            {arrow} {Math.abs(streak.percentChangeSoFar).toFixed(2)}%
          </span>
          <span className="text-[9px] text-text-muted sm:text-[10px]">
            since {streak.startDate}
          </span>
        </div>
      </div>
    </div>
  );
}
