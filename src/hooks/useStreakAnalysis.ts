'use client';

import { useMemo } from 'react';
import { OHLCV, StreakStats, Streak } from '@/lib/types';
import { detectStreaks, computeStreakStats } from '@/lib/analysis/streaks';

export function useStreakAnalysis(candles: OHLCV[]) {
  const streaks = useMemo(() => detectStreaks(candles), [candles]);
  const stats = useMemo(() => computeStreakStats(streaks), [streaks]);

  return { streaks, stats };
}

export function useComparisonStreaks(
  candlesA: OHLCV[],
  candlesB: OHLCV[]
): { streaksA: Streak[]; streaksB: Streak[]; statsA: StreakStats | null; statsB: StreakStats | null } {
  const streaksA = useMemo(() => detectStreaks(candlesA), [candlesA]);
  const streaksB = useMemo(() => detectStreaks(candlesB), [candlesB]);
  const statsA = useMemo(() => computeStreakStats(streaksA), [streaksA]);
  const statsB = useMemo(() => computeStreakStats(streaksB), [streaksB]);

  return { streaksA, streaksB, statsA, statsB };
}
