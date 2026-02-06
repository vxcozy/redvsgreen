'use client';

import { useState, useMemo } from 'react';
import { CycleAnalysis, CycleProjection, Cycle } from '@/lib/types';

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
  if (!isFinite(v)) return 'N/A';
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

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
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

function getYearRange(dateStr: string): string {
  return new Date(dateStr).getFullYear().toString().slice(2);
}

// Build cycle labels for the selector: pair bull+bear into numbered ~4yr cycles
interface CycleGroup {
  label: string;
  shortLabel: string;
  bull: Cycle | null;
  bear: Cycle | null;
}

function groupCycles(cycles: Cycle[], asset: string): CycleGroup[] {
  const groups: CycleGroup[] = [];
  let i = 0;
  let cycleNum = 1;

  while (i < cycles.length) {
    const bull = cycles[i]?.direction === 'bull' ? cycles[i] : null;
    const bear = bull && i + 1 < cycles.length && cycles[i + 1]?.direction === 'bear'
      ? cycles[i + 1]
      : (!bull && cycles[i]?.direction === 'bear' ? cycles[i] : null);

    const startYear = bull ? getYearRange(bull.from.date) : bear ? getYearRange(bear.from.date) : '??';
    const endYear = bear ? getYearRange(bear.to.date) : bull ? getYearRange(bull.to.date) : '??';

    groups.push({
      label: `Cycle ${cycleNum} ('${startYear}–'${endYear})`,
      shortLabel: `C${cycleNum}`,
      bull,
      bear,
    });

    i += (bull && bear) ? 2 : 1;
    cycleNum++;
  }

  return groups;
}

export default function CyclePositionCard({ analysis, asset }: Props) {
  const [selectedCycle, setSelectedCycle] = useState<number>(-1); // -1 = current

  const cycleGroups = useMemo(
    () => groupCycles(analysis.cycles, asset),
    [analysis.cycles, asset]
  );

  const isCurrentView = selectedCycle === -1;

  // Data for the selected historical cycle
  const selectedGroup = selectedCycle >= 0 ? cycleGroups[selectedCycle] : null;

  const isBull = analysis.currentPhase === 'bull';
  const phaseColor = isCurrentView
    ? (isBull ? '#00ff87' : '#ff3b5c')
    : '#6366f1'; // indigo for historical
  const phaseGlow = isCurrentView
    ? (isBull ? 'glow-green' : 'glow-red')
    : '';

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
        {/* Header with cycle selector */}
        <div className="mb-3 flex flex-col gap-2 sm:mb-4 sm:flex-row sm:items-center sm:justify-between">
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

          {/* Cycle selector tabs */}
          <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
            <button
              onClick={() => setSelectedCycle(-1)}
              className="rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.1em] transition-all sm:px-2.5 sm:text-[9px] sm:tracking-[0.15em]"
              style={{
                color: isCurrentView ? (isBull ? '#00ff87' : '#ff3b5c') : '#4a5568',
                backgroundColor: isCurrentView ? (isBull ? '#00ff8715' : '#ff3b5c15') : 'transparent',
                border: `1px solid ${isCurrentView ? (isBull ? '#00ff8730' : '#ff3b5c30') : '#1a1f2e'}`,
              }}
            >
              {isBull ? 'BULL' : 'BEAR'} NOW
            </button>
            {cycleGroups.map((group, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedCycle(idx)}
                className="rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.1em] transition-all sm:px-2.5 sm:text-[9px] sm:tracking-[0.15em]"
                style={{
                  color: selectedCycle === idx ? '#6366f1' : '#4a5568',
                  backgroundColor: selectedCycle === idx ? '#6366f115' : 'transparent',
                  border: `1px solid ${selectedCycle === idx ? '#6366f130' : '#1a1f2e'}`,
                }}
                title={group.label}
              >
                <span className="sm:hidden">{group.shortLabel}</span>
                <span className="hidden sm:inline">{group.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── CURRENT CYCLE VIEW ── */}
        {isCurrentView && (
          <>
            {/* Days from Peak / Days from Bottom */}
            <div className="grid grid-cols-2 gap-3 sm:gap-6">
              <div>
                {analysis.currentPhase === 'bull' && analysis.projectedTop && analysis.projectedTop.daysUntil > 0 ? (
                  <>
                    <div className="mb-0.5 text-[8px] uppercase tracking-[0.1em] text-text-muted/60 sm:mb-1 sm:text-[9px] sm:tracking-[0.15em]">
                      Est. Days to Top
                    </div>
                    <div className="flex items-baseline gap-1 sm:gap-2">
                      <span
                        className="text-xl font-black font-[var(--font-display)] sm:text-3xl"
                        style={{ color: '#ff3b5c' }}
                      >
                        ~{analysis.projectedTop.daysUntil.toLocaleString()}
                      </span>
                      <span className="text-[9px] text-text-muted sm:text-[11px]">days</span>
                    </div>
                    <div className="mt-0.5 text-[8px] text-text-muted sm:mt-1 sm:text-[10px]">
                      Est. {formatProjectedDate(analysis.projectedTop.projectedDate)}
                      <span className="hidden sm:inline">
                        {' · '}based on {analysis.projectedTop.basedOnCycles} cycles
                      </span>
                    </div>
                  </>
                ) : (
                  <>
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
                  </>
                )}
              </div>
              <div>
                {analysis.currentPhase === 'bear' && analysis.projectedBottom && analysis.projectedBottom.daysUntil > 0 ? (
                  <>
                    <div className="mb-0.5 text-[8px] uppercase tracking-[0.1em] text-text-muted/60 sm:mb-1 sm:text-[9px] sm:tracking-[0.15em]">
                      Est. Days to Bottom
                    </div>
                    <div className="flex items-baseline gap-1 sm:gap-2">
                      <span
                        className="text-xl font-black font-[var(--font-display)] sm:text-3xl"
                        style={{ color: '#00ff87' }}
                      >
                        ~{analysis.projectedBottom.daysUntil.toLocaleString()}
                      </span>
                      <span className="text-[9px] text-text-muted sm:text-[11px]">days</span>
                    </div>
                    <div className="mt-0.5 text-[8px] text-text-muted sm:mt-1 sm:text-[10px]">
                      Est. {formatProjectedDate(analysis.projectedBottom.projectedDate)}
                      <span className="hidden sm:inline">
                        {' · '}based on {analysis.projectedBottom.basedOnCycles} cycles
                      </span>
                    </div>
                  </>
                ) : (
                  <>
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
                  </>
                )}
              </div>
            </div>

            {/* Phase Progress Bar */}
            <div className="mt-3 sm:mt-4">
              <div className="mb-1 flex items-center justify-between text-[8px] uppercase tracking-[0.1em] text-text-muted/60 sm:mb-1.5 sm:text-[9px] sm:tracking-[0.15em]">
                <span>
                  Phase Progress (avg{' '}
                  {isBull
                    ? formatDays(analysis.avgBullDuration)
                    : formatDays(analysis.avgBearDuration)}
                  )
                </span>
                <span style={{ color: analysis.phaseProgress > 1 ? '#f59e0b' : phaseColor }}>
                  {(analysis.phaseProgress * 100).toFixed(0)}%
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-bg-tertiary">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(analysis.phaseProgress * 100, 100)}%`,
                    backgroundColor: analysis.phaseProgress > 1 ? '#f59e0b' : phaseColor,
                    boxShadow: `0 0 8px ${analysis.phaseProgress > 1 ? '#f59e0b44' : phaseColor + '44'}`,
                  }}
                />
              </div>
            </div>

            {/* Projected Cycle Dates */}
            {(analysis.projectedTop || analysis.projectedBottom) && (
              <div className="mt-3 grid grid-cols-2 gap-2 rounded-md border border-border-default/40 bg-bg-tertiary/30 p-2 sm:mt-4 sm:gap-4 sm:p-3">
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
          </>
        )}

        {/* ── HISTORICAL CYCLE VIEW ── */}
        {selectedGroup && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:gap-6">
              {/* Bull Phase */}
              <div>
                <div className="mb-0.5 text-[8px] uppercase tracking-[0.1em] text-text-muted/60 sm:mb-1 sm:text-[9px] sm:tracking-[0.15em]">
                  Bull Phase
                </div>
                {selectedGroup.bull ? (
                  <>
                    <div className="flex items-baseline gap-1 sm:gap-2">
                      <span
                        className="text-xl font-black font-[var(--font-display)] sm:text-3xl"
                        style={{ color: '#00ff87' }}
                      >
                        {selectedGroup.bull.durationDays.toLocaleString()}
                      </span>
                      <span className="text-[9px] text-text-muted sm:text-[11px]">days</span>
                    </div>
                    <div className="mt-0.5 text-[8px] text-text-muted sm:mt-1 sm:text-[10px]">
                      {formatDate(selectedGroup.bull.from.date)} → {formatDate(selectedGroup.bull.to.date)}
                    </div>
                    <div className="mt-0.5 text-[8px] sm:text-[10px]" style={{ color: '#00ff87' }}>
                      ${selectedGroup.bull.from.price.toLocaleString(undefined, { maximumFractionDigits: 0 })} → ${selectedGroup.bull.to.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      {' '}({formatPct(selectedGroup.bull.percentChange)})
                    </div>
                  </>
                ) : (
                  <div className="text-[10px] text-text-muted">N/A</div>
                )}
              </div>

              {/* Bear Phase */}
              <div>
                <div className="mb-0.5 text-[8px] uppercase tracking-[0.1em] text-text-muted/60 sm:mb-1 sm:text-[9px] sm:tracking-[0.15em]">
                  Bear Phase
                </div>
                {selectedGroup.bear ? (
                  <>
                    <div className="flex items-baseline gap-1 sm:gap-2">
                      <span
                        className="text-xl font-black font-[var(--font-display)] sm:text-3xl"
                        style={{ color: '#ff3b5c' }}
                      >
                        {selectedGroup.bear.durationDays.toLocaleString()}
                      </span>
                      <span className="text-[9px] text-text-muted sm:text-[11px]">days</span>
                    </div>
                    <div className="mt-0.5 text-[8px] text-text-muted sm:mt-1 sm:text-[10px]">
                      {formatDate(selectedGroup.bear.from.date)} → {formatDate(selectedGroup.bear.to.date)}
                    </div>
                    <div className="mt-0.5 text-[8px] sm:text-[10px]" style={{ color: '#ff3b5c' }}>
                      ${selectedGroup.bear.from.price.toLocaleString(undefined, { maximumFractionDigits: 0 })} → ${selectedGroup.bear.to.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      {' '}({formatPct(selectedGroup.bear.percentChange)})
                    </div>
                  </>
                ) : (
                  <div className="text-[10px] text-text-muted">N/A</div>
                )}
              </div>
            </div>

            {/* Full cycle duration */}
            <div className="mt-3 rounded-md border border-border-default/40 bg-bg-tertiary/30 p-2 sm:mt-4 sm:p-3">
              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                <div>
                  <div className="text-[8px] uppercase tracking-[0.05em] text-text-muted/60 sm:text-[9px] sm:tracking-[0.1em]">
                    Full Cycle
                  </div>
                  <div className="mt-0.5 text-xs font-semibold text-text-primary sm:text-sm">
                    {formatDays(
                      (selectedGroup.bull?.durationDays || 0) +
                      (selectedGroup.bear?.durationDays || 0)
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-[8px] uppercase tracking-[0.05em] text-text-muted/60 sm:text-[9px] sm:tracking-[0.1em]">
                    Bull Return
                  </div>
                  <div className="mt-0.5 text-xs font-semibold sm:text-sm" style={{ color: '#00ff87' }}>
                    {selectedGroup.bull ? formatPct(selectedGroup.bull.percentChange) : 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-[8px] uppercase tracking-[0.05em] text-text-muted/60 sm:text-[9px] sm:tracking-[0.1em]">
                    Bear Drawdown
                  </div>
                  <div className="mt-0.5 text-xs font-semibold sm:text-sm" style={{ color: '#ff3b5c' }}>
                    {selectedGroup.bear ? formatPct(selectedGroup.bear.percentChange) : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Cycle Stats Grid (always visible) */}
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
              Median Bull Return
            </div>
            <div className="mt-0.5 text-xs font-semibold sm:text-sm" style={{ color: '#00ff87' }}>
              {formatPct(analysis.avgBullReturn)}
            </div>
          </div>
          <div>
            <div className="text-[8px] uppercase tracking-[0.05em] text-text-muted/60 sm:text-[9px] sm:tracking-[0.1em]">
              Median Bear Drawdown
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
