'use client';

import { CycleAnalysis, CycleProjection } from '@/lib/types';

interface Props {
  analysis: CycleAnalysis;
  asset: string;
}

function formatDays(d: number): string {
  if (d >= 365) {
    const years = (d / 365).toFixed(1);
    return `${years}y`;
  }
  return `${d}d`;
}

function formatPct(v: number): string {
  const sign = v >= 0 ? '+' : '';
  return `${sign}${v.toFixed(0)}%`;
}

function formatProjectedDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
}

function formatCountdown(daysUntil: number): string {
  if (daysUntil <= 0) {
    const ago = Math.abs(daysUntil);
    if (ago >= 365) return `${(ago / 365).toFixed(1)}y ago`;
    return `${ago}d ago`;
  }
  if (daysUntil >= 365) {
    const y = Math.floor(daysUntil / 365);
    const m = Math.floor((daysUntil % 365) / 30);
    return m > 0 ? `${y}y ${m}m` : `${y}y`;
  }
  if (daysUntil >= 30) {
    return `${Math.round(daysUntil / 30)}m`;
  }
  return `${daysUntil}d`;
}

function confidenceColor(c: CycleProjection['confidence']): string {
  if (c === 'high') return '#00ff87';
  if (c === 'medium') return '#f59e0b';
  return '#4a5568';
}

export default function CyclePositionCard({ analysis, asset }: Props) {
  const isBull = analysis.currentPhase === 'bull';
  const phaseColor = isBull ? '#00ff87' : '#ff3b5c';
  const phaseLabel = isBull ? 'BULL PHASE' : 'BEAR PHASE';
  const phaseGlow = isBull ? 'glow-green' : 'glow-red';

  // Progress bar: clamp to 0-100% visually, allow overflow indicator
  const progressPct = Math.min(analysis.phaseProgress * 100, 100);
  const isOverAvg = analysis.phaseProgress > 1;

  return (
    <div
      className={`relative col-span-full overflow-hidden rounded-lg border border-border-default bg-bg-card p-3 sm:p-5 ${phaseGlow}`}
    >
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          background: `radial-gradient(ellipse at top left, ${phaseColor}, transparent 60%)`,
        }}
      />
      <div className="relative">
        {/* Header */}
        <div className="mb-3 flex items-center justify-between sm:mb-4">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-[9px] uppercase tracking-[0.15em] text-text-muted sm:text-[10px] sm:tracking-[0.2em]">
              Cycle Position
            </span>
            <span
              className="text-[9px] font-bold uppercase tracking-[0.1em] sm:text-[10px] sm:tracking-[0.15em]"
              style={{ color: phaseColor }}
            >
              {asset}
            </span>
          </div>
          <span
            className="rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.1em] sm:px-2.5 sm:text-[9px] sm:tracking-[0.15em]"
            style={{
              color: phaseColor,
              backgroundColor: isBull ? '#00ff8715' : '#ff3b5c15',
              border: `1px solid ${isBull ? '#00ff8730' : '#ff3b5c30'}`,
            }}
          >
            {phaseLabel}
          </span>
        </div>

        {/* Days from Peak / Days from Trough */}
        <div className="grid grid-cols-2 gap-3 sm:gap-6">
          {/* Days from Peak */}
          <div>
            <div className="mb-0.5 text-[8px] uppercase tracking-[0.1em] text-text-muted/60 sm:mb-1 sm:text-[9px] sm:tracking-[0.15em]">
              Days from Peak
            </div>
            <div className="flex items-baseline gap-1 sm:gap-2">
              <span
                className="text-xl font-black font-[var(--font-display)] sm:text-3xl"
                style={{ color: '#ff3b5c' }}
              >
                {analysis.daysSincePeak.toLocaleString()}
              </span>
              <span className="text-[9px] text-text-muted sm:text-[11px]">days</span>
            </div>
            {analysis.currentPeak && (
              <div className="mt-0.5 text-[8px] text-text-muted sm:mt-1 sm:text-[10px]">
                Peak: ${analysis.currentPeak.price.toLocaleString(undefined, { maximumFractionDigits: 0 })} on{' '}
                {analysis.currentPeak.date}
              </div>
            )}
          </div>

          {/* Days from Trough */}
          <div>
            <div className="mb-0.5 text-[8px] uppercase tracking-[0.1em] text-text-muted/60 sm:mb-1 sm:text-[9px] sm:tracking-[0.15em]">
              Days from Bottom
            </div>
            <div className="flex items-baseline gap-1 sm:gap-2">
              <span
                className="text-xl font-black font-[var(--font-display)] sm:text-3xl"
                style={{ color: '#00ff87' }}
              >
                {analysis.daysSinceTrough.toLocaleString()}
              </span>
              <span className="text-[9px] text-text-muted sm:text-[11px]">days</span>
            </div>
            {analysis.currentTrough && (
              <div className="mt-0.5 text-[8px] text-text-muted sm:mt-1 sm:text-[10px]">
                Bottom: ${analysis.currentTrough.price.toLocaleString(undefined, { maximumFractionDigits: 0 })} on{' '}
                {analysis.currentTrough.date}
              </div>
            )}
          </div>
        </div>

        {/* Cycle Progress Bar */}
        <div className="mt-3 sm:mt-4">
          <div className="mb-1 flex items-center justify-between text-[8px] uppercase tracking-[0.1em] text-text-muted/60 sm:mb-1.5 sm:text-[9px] sm:tracking-[0.15em]">
            <span>
              Phase Progress (avg{' '}
              {isBull
                ? formatDays(analysis.avgBullDuration)
                : formatDays(analysis.avgBearDuration)}
              )
            </span>
            <span style={{ color: isOverAvg ? '#f59e0b' : phaseColor }}>
              {(analysis.phaseProgress * 100).toFixed(0)}%
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-bg-tertiary">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progressPct}%`,
                backgroundColor: isOverAvg ? '#f59e0b' : phaseColor,
                boxShadow: `0 0 8px ${isOverAvg ? '#f59e0b44' : phaseColor + '44'}`,
              }}
            />
          </div>
        </div>

        {/* Projected Cycle Dates */}
        {(analysis.projectedTop || analysis.projectedBottom) && (
          <div className="mt-3 grid grid-cols-2 gap-2 rounded-md border border-border-default/40 bg-bg-tertiary/30 p-2 sm:mt-4 sm:gap-4 sm:p-3">
            {/* Projected Top */}
            {analysis.projectedTop && (
              <div>
                <div className="mb-0.5 flex flex-wrap items-center gap-1 sm:mb-1 sm:gap-1.5">
                  <span className="text-[8px] uppercase tracking-[0.1em] text-text-muted/60 sm:text-[9px] sm:tracking-[0.15em]">
                    Est. Cycle Top
                  </span>
                  <span
                    className="rounded-full px-1 py-px text-[7px] font-semibold uppercase sm:px-1.5 sm:text-[8px]"
                    style={{
                      color: confidenceColor(analysis.projectedTop.confidence),
                      backgroundColor: confidenceColor(analysis.projectedTop.confidence) + '15',
                    }}
                  >
                    {analysis.projectedTop.confidence}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span
                    className="text-sm font-bold font-[var(--font-display)] sm:text-lg"
                    style={{ color: '#ff3b5c' }}
                  >
                    {formatProjectedDate(analysis.projectedTop.projectedDate)}
                  </span>
                </div>
                <div className="mt-0.5 text-[8px] text-text-muted sm:text-[10px]">
                  {analysis.projectedTop.daysUntil > 0 ? (
                    <>
                      <span style={{ color: '#ff3b5c' }}>
                        {formatCountdown(analysis.projectedTop.daysUntil)}
                      </span>{' '}
                      remaining
                    </>
                  ) : (
                    <>
                      <span style={{ color: '#f59e0b' }}>
                        {formatCountdown(analysis.projectedTop.daysUntil)}
                      </span>{' '}
                      <span className="hidden sm:inline">— </span>passed
                    </>
                  )}
                  <span className="hidden sm:inline">
                    {' · '}
                    based on {analysis.projectedTop.basedOnCycles} cycles
                  </span>
                </div>
              </div>
            )}

            {/* Projected Bottom */}
            {analysis.projectedBottom && (
              <div>
                <div className="mb-0.5 flex flex-wrap items-center gap-1 sm:mb-1 sm:gap-1.5">
                  <span className="text-[8px] uppercase tracking-[0.1em] text-text-muted/60 sm:text-[9px] sm:tracking-[0.15em]">
                    Est. Cycle Bottom
                  </span>
                  <span
                    className="rounded-full px-1 py-px text-[7px] font-semibold uppercase sm:px-1.5 sm:text-[8px]"
                    style={{
                      color: confidenceColor(analysis.projectedBottom.confidence),
                      backgroundColor: confidenceColor(analysis.projectedBottom.confidence) + '15',
                    }}
                  >
                    {analysis.projectedBottom.confidence}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span
                    className="text-sm font-bold font-[var(--font-display)] sm:text-lg"
                    style={{ color: '#00ff87' }}
                  >
                    {formatProjectedDate(analysis.projectedBottom.projectedDate)}
                  </span>
                </div>
                <div className="mt-0.5 text-[8px] text-text-muted sm:text-[10px]">
                  {analysis.projectedBottom.daysUntil > 0 ? (
                    <>
                      <span style={{ color: '#00ff87' }}>
                        {formatCountdown(analysis.projectedBottom.daysUntil)}
                      </span>{' '}
                      remaining
                    </>
                  ) : (
                    <>
                      <span style={{ color: '#f59e0b' }}>
                        {formatCountdown(analysis.projectedBottom.daysUntil)}
                      </span>{' '}
                      <span className="hidden sm:inline">— </span>passed
                    </>
                  )}
                  <span className="hidden sm:inline">
                    {' · '}
                    based on {analysis.projectedBottom.basedOnCycles} cycles
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Cycle Stats Grid */}
        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border-default/50 pt-2 sm:mt-4 sm:grid-cols-4 sm:gap-4 sm:pt-3">
          <div>
            <div className="text-[8px] uppercase tracking-[0.05em] text-text-muted/60 sm:text-[9px] sm:tracking-[0.1em]">
              Avg Bull Run
            </div>
            <div className="mt-0.5 text-xs font-semibold text-text-primary sm:text-sm">
              {formatDays(analysis.avgBullDuration)}
            </div>
          </div>
          <div>
            <div className="text-[8px] uppercase tracking-[0.05em] text-text-muted/60 sm:text-[9px] sm:tracking-[0.1em]">
              Avg Bear Phase
            </div>
            <div className="mt-0.5 text-xs font-semibold text-text-primary sm:text-sm">
              {formatDays(analysis.avgBearDuration)}
            </div>
          </div>
          <div>
            <div className="text-[8px] uppercase tracking-[0.05em] text-text-muted/60 sm:text-[9px] sm:tracking-[0.1em]">
              Avg Bull Return
            </div>
            <div className="mt-0.5 text-xs font-semibold sm:text-sm" style={{ color: '#00ff87' }}>
              {formatPct(analysis.avgBullReturn)}
            </div>
          </div>
          <div>
            <div className="text-[8px] uppercase tracking-[0.05em] text-text-muted/60 sm:text-[9px] sm:tracking-[0.1em]">
              Avg Bear Drawdown
            </div>
            <div className="mt-0.5 text-xs font-semibold sm:text-sm" style={{ color: '#ff3b5c' }}>
              {formatPct(analysis.avgBearDrawdown)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
