import { OHLCV, CyclePoint, Cycle, CycleAnalysis, CycleProjection, Asset } from '../types';

// ── Known historical cycle points ──────────────────────────────────
// Full history from early BTC. Pre-Binance points use hardcoded prices
// from CoinMarketCap/CoinGecko historical data and are used for
// cycle duration calculations even without matching candle data.

const KNOWN_BTC_POINTS: CyclePoint[] = [
  // Cycle 1
  { type: 'trough', date: '2011-11-18', price: 2.05, index: -1, source: 'known' },   // Post-first-bubble bottom
  { type: 'peak', date: '2013-11-29', price: 1163, index: -1, source: 'known' },     // Second bubble
  // Cycle 2
  { type: 'trough', date: '2015-01-14', price: 152, index: -1, source: 'known' },    // Bear market bottom
  { type: 'peak', date: '2017-12-17', price: 19783, index: -1, source: 'known' },    // ICO mania top
  // Cycle 3
  { type: 'trough', date: '2018-12-15', price: 3122, index: -1, source: 'known' },   // Crypto winter
  { type: 'peak', date: '2021-11-10', price: 68789, index: -1, source: 'known' },    // Post-halving peak
  // Cycle 4 (current)
  { type: 'trough', date: '2022-11-21', price: 15460, index: -1, source: 'known' },  // FTX collapse bottom
  // Peak TBD — will be computed from candle data as "running peak"
];

const KNOWN_ETH_POINTS: CyclePoint[] = [
  // Cycle 1
  { type: 'trough', date: '2015-10-21', price: 0.42, index: -1, source: 'known' },   // Early low
  { type: 'peak', date: '2018-01-13', price: 1432, index: -1, source: 'known' },     // ICO mania top
  // Cycle 2
  { type: 'trough', date: '2018-12-15', price: 84, index: -1, source: 'known' },     // Crypto winter
  { type: 'peak', date: '2021-11-10', price: 4878, index: -1, source: 'known' },     // DeFi/NFT peak
  // Cycle 3 (current)
  { type: 'trough', date: '2022-06-18', price: 880, index: -1, source: 'known' },    // Bear bottom
  // Peak TBD
];

// ── Algorithm parameters ───────────────────────────────────────────
const WINDOW_DAYS = 120;
const PROMINENCE_THRESHOLD = 0.30; // 30% above/below surrounding
const MIN_SEPARATION_DAYS = 200;

// ── Helpers ────────────────────────────────────────────────────────

function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA).getTime();
  const b = new Date(dateB).getTime();
  return Math.round(Math.abs(b - a) / 86400000);
}

function findCandleIndex(candles: OHLCV[], date: string): number {
  for (let i = 0; i < candles.length; i++) {
    if (candles[i].date >= date) return i;
  }
  return candles.length - 1;
}

// ── Resolve known points against actual candle data ────────────────

function resolveKnownPoints(
  candles: OHLCV[],
  knownPoints: CyclePoint[]
): CyclePoint[] {
  if (candles.length === 0) return knownPoints.map((p) => ({ ...p }));

  const firstDate = candles[0].date;
  const lastDate = candles[candles.length - 1].date;

  return knownPoints
    .filter((p) => p.date <= lastDate)
    .map((p) => {
      if (p.date < firstDate) {
        return { ...p, index: -1 };
      }
      const idx = findCandleIndex(candles, p.date);
      return {
        ...p,
        index: idx,
        price: p.type === 'peak' ? candles[idx].high : candles[idx].low,
      };
    });
}

// ── Algorithmic detection for confirmed cycle points ─────────────

function detectNewPoints(
  candles: OHLCV[],
  lastKnownPoint: CyclePoint | null
): CyclePoint[] {
  const detected: CyclePoint[] = [];
  if (candles.length < WINDOW_DAYS * 2) return detected;

  const startIdx = lastKnownPoint && lastKnownPoint.index >= 0
    ? Math.max(lastKnownPoint.index + MIN_SEPARATION_DAYS, WINDOW_DAYS)
    : WINDOW_DAYS;

  const endIdx = candles.length - WINDOW_DAYS;
  if (startIdx >= endIdx) return detected;

  let expectType: 'peak' | 'trough' | null = null;
  if (lastKnownPoint) {
    expectType = lastKnownPoint.type === 'peak' ? 'trough' : 'peak';
  }

  for (let i = startIdx; i < endIdx; i++) {
    const windowStart = Math.max(0, i - WINDOW_DAYS);
    const windowEnd = Math.min(candles.length - 1, i + WINDOW_DAYS);

    if (expectType !== 'trough') {
      let isLocalMax = true;
      for (let j = windowStart; j <= windowEnd; j++) {
        if (j !== i && candles[j].high > candles[i].high) {
          isLocalMax = false;
          break;
        }
      }
      if (isLocalMax) {
        const windowLow = Math.min(
          ...candles.slice(windowStart, windowEnd + 1).map((c) => c.low)
        );
        const prominence = (candles[i].high - windowLow) / windowLow;
        if (prominence >= PROMINENCE_THRESHOLD) {
          const lastDetected = detected[detected.length - 1];
          const lastPoint = lastDetected || lastKnownPoint;
          if (!lastPoint || daysBetween(candles[i].date, lastPoint.date) >= MIN_SEPARATION_DAYS) {
            detected.push({
              type: 'peak',
              date: candles[i].date,
              price: candles[i].high,
              index: i,
              source: 'detected',
            });
            expectType = 'trough';
          }
        }
      }
    }

    if (expectType !== 'peak') {
      let isLocalMin = true;
      for (let j = windowStart; j <= windowEnd; j++) {
        if (j !== i && candles[j].low < candles[i].low) {
          isLocalMin = false;
          break;
        }
      }
      if (isLocalMin) {
        const windowHigh = Math.max(
          ...candles.slice(windowStart, windowEnd + 1).map((c) => c.high)
        );
        const prominence = (windowHigh - candles[i].low) / candles[i].low;
        if (prominence >= PROMINENCE_THRESHOLD) {
          const lastDetected = detected[detected.length - 1];
          const lastPoint = lastDetected || lastKnownPoint;
          if (!lastPoint || daysBetween(candles[i].date, lastPoint.date) >= MIN_SEPARATION_DAYS) {
            detected.push({
              type: 'trough',
              date: candles[i].date,
              price: candles[i].low,
              index: i,
              source: 'detected',
            });
            expectType = 'peak';
          }
        }
      }
    }
  }

  return detected;
}

// ── Find the running (unconfirmed) peak/trough since last cycle point ──

function findRunningPeakSince(
  candles: OHLCV[],
  sinceDate: string
): CyclePoint {
  const startIdx = findCandleIndex(candles, sinceDate);
  let best = candles[startIdx];
  let bestIdx = startIdx;
  for (let i = startIdx + 1; i < candles.length; i++) {
    if (candles[i].high > best.high) {
      best = candles[i];
      bestIdx = i;
    }
  }
  return {
    type: 'peak',
    date: best.date,
    price: best.high,
    index: bestIdx,
    source: 'detected',
  };
}

function findRunningTroughSince(
  candles: OHLCV[],
  sinceDate: string
): CyclePoint {
  const startIdx = findCandleIndex(candles, sinceDate);
  let best = candles[startIdx];
  let bestIdx = startIdx;
  for (let i = startIdx + 1; i < candles.length; i++) {
    if (candles[i].low < best.low) {
      best = candles[i];
      bestIdx = i;
    }
  }
  return {
    type: 'trough',
    date: best.date,
    price: best.low,
    index: bestIdx,
    source: 'detected',
  };
}

// ── Build cycles from ordered points ───────────────────────────────

export function buildCycles(points: CyclePoint[]): Cycle[] {
  const cycles: Cycle[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const from = points[i];
    const to = points[i + 1];
    const duration = daysBetween(from.date, to.date);
    const pctChange = from.price > 0
      ? ((to.price - from.price) / from.price) * 100
      : 0;

    const direction: 'bull' | 'bear' =
      from.type === 'trough' && to.type === 'peak' ? 'bull' : 'bear';

    cycles.push({
      from,
      to,
      durationDays: duration,
      priceChange: to.price - from.price,
      percentChange: pctChange,
      direction,
    });
  }
  return cycles;
}

// ── Projection helpers ─────────────────────────────────────────────

function addDaysToDate(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + Math.round(days));
  return d.toISOString().split('T')[0];
}

function computeProjections(
  currentPhase: 'bull' | 'bear',
  lastPoint: CyclePoint,
  todayStr: string,
  avgBullDuration: number,
  avgBearDuration: number,
  bullCycleCount: number,
  bearCycleCount: number
): { projectedTop: CycleProjection | null; projectedBottom: CycleProjection | null } {
  const today = new Date(todayStr).getTime();

  if (currentPhase === 'bull') {
    const projectedTopDate = addDaysToDate(lastPoint.date, avgBullDuration);
    const daysUntilTop = Math.round(
      (new Date(projectedTopDate).getTime() - today) / 86400000
    );
    const projectedBottomDate = addDaysToDate(projectedTopDate, avgBearDuration);
    const daysUntilBottom = Math.round(
      (new Date(projectedBottomDate).getTime() - today) / 86400000
    );

    return {
      projectedTop: {
        projectedDate: projectedTopDate,
        daysUntil: daysUntilTop,
        confidence: bullCycleCount >= 3 ? 'high' : bullCycleCount >= 2 ? 'medium' : 'low',
        basedOnCycles: bullCycleCount,
      },
      projectedBottom: {
        projectedDate: projectedBottomDate,
        daysUntil: daysUntilBottom,
        confidence: bearCycleCount >= 3 ? 'medium' : 'low',
        basedOnCycles: bearCycleCount,
      },
    };
  } else {
    const projectedBottomDate = addDaysToDate(lastPoint.date, avgBearDuration);
    const daysUntilBottom = Math.round(
      (new Date(projectedBottomDate).getTime() - today) / 86400000
    );
    const projectedTopDate = addDaysToDate(projectedBottomDate, avgBullDuration);
    const daysUntilTop = Math.round(
      (new Date(projectedTopDate).getTime() - today) / 86400000
    );

    return {
      projectedTop: {
        projectedDate: projectedTopDate,
        daysUntil: daysUntilTop,
        confidence: bullCycleCount >= 3 ? 'medium' : 'low',
        basedOnCycles: bullCycleCount,
      },
      projectedBottom: {
        projectedDate: projectedBottomDate,
        daysUntil: daysUntilBottom,
        confidence: bearCycleCount >= 3 ? 'high' : bearCycleCount >= 2 ? 'medium' : 'low',
        basedOnCycles: bearCycleCount,
      },
    };
  }
}

// ── Main computation ───────────────────────────────────────────────

export function computeCycleAnalysis(
  candles: OHLCV[],
  asset: Asset
): CycleAnalysis | null {
  if (candles.length < 30) return null;

  const knownRaw = asset === 'BTC' ? KNOWN_BTC_POINTS : KNOWN_ETH_POINTS;
  const knownResolved = resolveKnownPoints(candles, knownRaw);

  const lastKnown =
    knownResolved.length > 0
      ? knownResolved[knownResolved.length - 1]
      : null;

  const newPoints = detectNewPoints(candles, lastKnown);

  const allPoints = [...knownResolved, ...newPoints].sort((a, b) => {
    if (a.index === -1 && b.index === -1) return a.date.localeCompare(b.date);
    if (a.index === -1) return -1;
    if (b.index === -1) return -1;
    return a.index - b.index;
  });

  if (allPoints.length < 2) {
    const today = candles[candles.length - 1].date;
    const peaks = allPoints.filter((p) => p.type === 'peak');
    const troughs = allPoints.filter((p) => p.type === 'trough');
    const latestPeak = peaks.length > 0 ? peaks[peaks.length - 1] : null;
    const latestTrough = troughs.length > 0 ? troughs[troughs.length - 1] : null;

    return {
      cycles: [],
      allPoints,
      currentPeak: latestPeak,
      currentTrough: latestTrough,
      daysSincePeak: latestPeak ? daysBetween(today, latestPeak.date) : 0,
      daysSinceTrough: latestTrough ? daysBetween(today, latestTrough.date) : 0,
      avgBullDuration: 0,
      avgBearDuration: 0,
      avgBullReturn: 0,
      avgBearDrawdown: 0,
      currentPhase: latestTrough && (!latestPeak || latestTrough.date > latestPeak.date)
        ? 'bull'
        : 'bear',
      phaseProgress: 0,
      projectedTop: null,
      projectedBottom: null,
    };
  }

  // Build completed cycles for historical averages
  const cycles = buildCycles(allPoints);
  const bullCycles = cycles.filter((c) => c.direction === 'bull');
  const bearCycles = cycles.filter((c) => c.direction === 'bear');

  const avgBullDuration =
    bullCycles.length > 0
      ? bullCycles.reduce((s, c) => s + c.durationDays, 0) / bullCycles.length
      : 0;
  const avgBearDuration =
    bearCycles.length > 0
      ? bearCycles.reduce((s, c) => s + c.durationDays, 0) / bearCycles.length
      : 0;

  const validBullCycles = bullCycles.filter(
    (c) => isFinite(c.percentChange) && c.percentChange !== 0
  );
  const validBearCycles = bearCycles.filter(
    (c) => isFinite(c.percentChange) && c.percentChange !== 0
  );
  const avgBullReturn =
    validBullCycles.length > 0
      ? validBullCycles.reduce((s, c) => s + c.percentChange, 0) / validBullCycles.length
      : 0;
  const avgBearDrawdown =
    validBearCycles.length > 0
      ? validBearCycles.reduce((s, c) => s + c.percentChange, 0) / validBearCycles.length
      : 0;

  const today = candles[candles.length - 1].date;

  // ── Current cycle: determine phase from last confirmed point ──
  const lastConfirmedPoint = allPoints[allPoints.length - 1];
  const currentPhase: 'bull' | 'bear' =
    lastConfirmedPoint.type === 'trough' ? 'bull' : 'bear';

  // ── Current cycle peak/trough ──
  // Find the running (unconfirmed) peak since the last trough,
  // or the running trough since the last peak.
  // "Days from Peak" = days since highest price in current bull run
  // "Days from Bottom" = days since the cycle trough that started this run
  let currentPeak: CyclePoint;
  let currentTrough: CyclePoint;

  if (currentPhase === 'bull') {
    // We're in a bull run from the last confirmed trough
    // The "bottom" is the last confirmed trough
    // The "peak" is the highest price since that trough (running ATH of this cycle)
    currentTrough = lastConfirmedPoint;
    currentPeak = findRunningPeakSince(candles, lastConfirmedPoint.date);
  } else {
    // We're in a bear from the last confirmed peak
    // The "peak" is the last confirmed peak
    // The "trough" is the lowest price since that peak (running low of this cycle)
    currentPeak = lastConfirmedPoint;
    currentTrough = findRunningTroughSince(candles, lastConfirmedPoint.date);
  }

  // Phase progress: how far into the avg cycle duration we are
  const daysSinceLastPoint = daysBetween(today, lastConfirmedPoint.date);
  const avgDuration = currentPhase === 'bull' ? avgBullDuration : avgBearDuration;
  const phaseProgress = avgDuration > 0
    ? Math.min(daysSinceLastPoint / avgDuration, 1.5)
    : 0;

  // Compute projected cycle top/bottom dates
  const { projectedTop, projectedBottom } = computeProjections(
    currentPhase,
    lastConfirmedPoint,
    today,
    avgBullDuration,
    avgBearDuration,
    bullCycles.length,
    bearCycles.length
  );

  return {
    cycles,
    allPoints,
    currentPeak,
    currentTrough,
    daysSincePeak: daysBetween(today, currentPeak.date),
    daysSinceTrough: daysBetween(today, currentTrough.date),
    avgBullDuration: Math.round(avgBullDuration),
    avgBearDuration: Math.round(avgBearDuration),
    avgBullReturn,
    avgBearDrawdown,
    currentPhase,
    phaseProgress,
    projectedTop,
    projectedBottom,
  };
}
