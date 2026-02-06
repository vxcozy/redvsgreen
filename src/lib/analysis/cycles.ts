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
        let windowLow = candles[windowStart].low;
        for (let j = windowStart + 1; j <= windowEnd; j++) {
          if (candles[j].low < windowLow) windowLow = candles[j].low;
        }
        const prominence = windowLow > 0
          ? (candles[i].high - windowLow) / windowLow
          : 0;
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
        let windowHigh = candles[windowStart].high;
        for (let j = windowStart + 1; j <= windowEnd; j++) {
          if (candles[j].high > windowHigh) windowHigh = candles[j].high;
        }
        const prominence = candles[i].low > 0
          ? (windowHigh - candles[i].low) / candles[i].low
          : 0;
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

  // ── Post-detection sanity check ────────────────────────────────
  // Remove detected points that create impossible cycle transitions.
  // E.g. a "peak" at $2,119 followed by a "trough" at $2,223 means
  // the intermediate detection was a false positive (just a local
  // bounce within a larger cycle, not a real cycle inflection).
  return sanitizeDetectedPoints(detected, lastKnownPoint);
}

/**
 * Walk the detected points (paired with the last known point) and
 * remove any pair that creates an impossible cycle leg:
 *   - A peak→trough where trough.price >= peak.price (bear goes up)
 *   - A trough→peak where peak.price <= trough.price  (bull goes down)
 */
function sanitizeDetectedPoints(
  detected: CyclePoint[],
  lastKnown: CyclePoint | null
): CyclePoint[] {
  if (detected.length === 0) return detected;

  // Build full sequence: [lastKnown, ...detected] for pairwise validation
  const sequence: CyclePoint[] = lastKnown ? [lastKnown, ...detected] : [...detected];
  const toRemove = new Set<number>(); // indices in `detected`

  // Check each consecutive pair in the sequence
  for (let i = 0; i < sequence.length - 1; i++) {
    const from = sequence[i];
    const to = sequence[i + 1];
    if (from.type === to.type) continue; // same type — skip

    const isBull = from.type === 'trough';
    if (isBull && to.price <= from.price) {
      // Bull phase where "peak" is ≤ trough — both detected points are bad
      // (from may be lastKnown, so only mark 'to' for removal)
      const detIdx = detected.indexOf(to);
      if (detIdx >= 0) toRemove.add(detIdx);
    } else if (!isBull && to.price >= from.price) {
      // Bear phase where "trough" is ≥ peak — false trough
      const detIdx = detected.indexOf(to);
      if (detIdx >= 0) toRemove.add(detIdx);
    }
  }

  if (toRemove.size === 0) return detected;

  // When we remove a point, its partner in the pair is also suspect.
  // The simplest safe approach: if any detected point is invalid,
  // remove ALL detected points that were part of invalid pairs.
  // This prevents orphaned peaks/troughs from creating worse problems.
  //
  // Walk again: if either side of a pair is in toRemove, mark both.
  const detectedOffset = lastKnown ? 1 : 0;
  for (let i = 0; i < sequence.length - 1; i++) {
    const fromDetIdx = i - detectedOffset;
    const toDetIdx = (i + 1) - detectedOffset;

    const fromMarked = fromDetIdx >= 0 && toRemove.has(fromDetIdx);
    const toMarked = toDetIdx >= 0 && toRemove.has(toDetIdx);

    if (fromMarked && toDetIdx >= 0) toRemove.add(toDetIdx);
    if (toMarked && fromDetIdx >= 0) toRemove.add(fromDetIdx);
  }

  return detected.filter((_, idx) => !toRemove.has(idx));
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

    // Skip invalid adjacent same-type points (data corruption guard)
    if (from.type === to.type) continue;

    const duration = daysBetween(from.date, to.date);
    const pctChange = from.price > 0
      ? ((to.price - from.price) / from.price) * 100
      : 0;

    const direction: 'bull' | 'bear' =
      from.type === 'trough' ? 'bull' : 'bear';

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
    // Both pre-data: sort by date
    if (a.index === -1 && b.index === -1) return a.date.localeCompare(b.date);
    // Pre-data points always come before resolved points
    if (a.index === -1) return -1;
    if (b.index === -1) return 1;
    // Both resolved: sort by candle index
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

  // Build completed cycles from confirmed historical points
  const historicalCycles = buildCycles(allPoints);

  // Exclude Cycle 1 (pre-Binance era, both endpoints index === -1).
  // The $2→$1,163 era has wildly different durations and returns that
  // aren't representative of modern ~4yr halving-driven cycles.
  // The established pattern from Cycles 2-3:
  //   Bull (ATL → ATH): ~1,064 days
  //   Bear (ATH → ATL): ~364 days
  const modernCycles = historicalCycles.filter(
    (c) => !(c.from.index === -1 && c.to.index === -1)
  );

  const bullCycles = modernCycles.filter((c) => c.direction === 'bull');
  const bearCycles = modernCycles.filter((c) => c.direction === 'bear');

  const avgBullDuration =
    bullCycles.length > 0
      ? bullCycles.reduce((s, c) => s + c.durationDays, 0) / bullCycles.length
      : 0;
  const avgBearDuration =
    bearCycles.length > 0
      ? bearCycles.reduce((s, c) => s + c.durationDays, 0) / bearCycles.length
      : 0;

  // For return/drawdown stats, only use cycles where BOTH endpoints have
  // real candle data. Cycle 2 bull ($152→$19,783) has a pre-data start
  // point with a hardcoded price, giving +12,838% — still not representative
  // of the modern era. Only Cycle 3+ (fully within Binance data) are reliable.
  const fullDataCycles = modernCycles.filter(
    (c) => c.from.index !== -1 && c.to.index !== -1
  );
  const validBullCycles = fullDataCycles.filter(
    (c) => c.direction === 'bull' && isFinite(c.percentChange) && c.percentChange !== 0
  );
  const validBearCycles = fullDataCycles.filter(
    (c) => c.direction === 'bear' && isFinite(c.percentChange) && c.percentChange !== 0
  );

  // Use median for returns to resist outliers.
  const median = (arr: number[]): number => {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  };

  const avgBullReturn = median(validBullCycles.map((c) => c.percentChange));
  const avgBearDrawdown = median(validBearCycles.map((c) => c.percentChange));

  const today = candles[candles.length - 1].date;
  const todayClose = candles[candles.length - 1].close;

  // ── Smart phase detection ──
  // Don't blindly trust the last confirmed cycle point type.
  // Instead, find the running peak since the last trough (or vice versa)
  // and check if a significant drawdown/rally has occurred.
  const BEAR_THRESHOLD = 0.25; // >25% drawdown from peak = bear started

  const lastConfirmedPoint = allPoints[allPoints.length - 1];
  const naivePhase: 'bull' | 'bear' =
    lastConfirmedPoint.type === 'trough' ? 'bull' : 'bear';

  let currentPeak: CyclePoint;
  let currentTrough: CyclePoint;
  let currentPhase: 'bull' | 'bear';
  let phaseAnchor: CyclePoint; // The point the current phase is measured from

  if (naivePhase === 'bull') {
    // Last confirmed point is a trough — nominally in a bull.
    // But check if a significant drawdown has occurred from the running peak.
    const runningPeak = findRunningPeakSince(candles, lastConfirmedPoint.date);
    const drawdownFromPeak = (runningPeak.price - todayClose) / runningPeak.price;

    if (drawdownFromPeak >= BEAR_THRESHOLD) {
      // We've topped and entered a bear — the running peak is the cycle top
      currentPhase = 'bear';
      currentPeak = runningPeak;
      currentTrough = findRunningTroughSince(candles, runningPeak.date);
      phaseAnchor = runningPeak; // Bear started from the peak
    } else {
      // Still in bull territory
      currentPhase = 'bull';
      currentTrough = lastConfirmedPoint;
      currentPeak = runningPeak;
      phaseAnchor = lastConfirmedPoint; // Bull started from the trough
    }
  } else {
    // Last confirmed point is a peak — nominally in a bear.
    // Check if a significant rally has occurred from the running trough.
    const runningTrough = findRunningTroughSince(candles, lastConfirmedPoint.date);
    const rallyFromTrough = (todayClose - runningTrough.price) / runningTrough.price;

    if (rallyFromTrough >= BEAR_THRESHOLD) {
      // We've bottomed and entered a bull
      currentPhase = 'bull';
      currentTrough = runningTrough;
      currentPeak = findRunningPeakSince(candles, runningTrough.date);
      phaseAnchor = runningTrough;
    } else {
      // Still in bear territory
      currentPhase = 'bear';
      currentPeak = lastConfirmedPoint;
      currentTrough = runningTrough;
      phaseAnchor = lastConfirmedPoint;
    }
  }

  // ── Append current (unconfirmed) cycle segments ──
  // The historical cycles only go up to the last confirmed point.
  // We need to extend them with the current bull and bear legs
  // so the timeline chart and table show the full picture.
  const cycles = [...historicalCycles];
  const extendedPoints = [...allPoints];

  if (naivePhase === 'bull') {
    // Last confirmed point is a trough. Add bull leg: trough → running peak
    const bullLeg: Cycle = {
      from: lastConfirmedPoint,
      to: currentPeak,
      durationDays: daysBetween(lastConfirmedPoint.date, currentPeak.date),
      priceChange: currentPeak.price - lastConfirmedPoint.price,
      percentChange: lastConfirmedPoint.price > 0
        ? ((currentPeak.price - lastConfirmedPoint.price) / lastConfirmedPoint.price) * 100
        : 0,
      direction: 'bull',
    };
    cycles.push(bullLeg);

    // Add peak to extended points if not already there
    if (!extendedPoints.some((p) => p.date === currentPeak.date && p.type === 'peak')) {
      extendedPoints.push(currentPeak);
    }

    if (currentPhase === 'bear') {
      // Also add bear leg: running peak → running trough
      const bearLeg: Cycle = {
        from: currentPeak,
        to: currentTrough,
        durationDays: daysBetween(currentPeak.date, currentTrough.date),
        priceChange: currentTrough.price - currentPeak.price,
        percentChange: currentPeak.price > 0
          ? ((currentTrough.price - currentPeak.price) / currentPeak.price) * 100
          : 0,
        direction: 'bear',
      };
      cycles.push(bearLeg);

      if (!extendedPoints.some((p) => p.date === currentTrough.date && p.type === 'trough')) {
        extendedPoints.push(currentTrough);
      }
    }
  } else {
    // Last confirmed point is a peak. Add bear leg: peak → running trough
    const bearLeg: Cycle = {
      from: lastConfirmedPoint,
      to: currentTrough,
      durationDays: daysBetween(lastConfirmedPoint.date, currentTrough.date),
      priceChange: currentTrough.price - lastConfirmedPoint.price,
      percentChange: lastConfirmedPoint.price > 0
        ? ((currentTrough.price - lastConfirmedPoint.price) / lastConfirmedPoint.price) * 100
        : 0,
      direction: 'bear',
    };
    cycles.push(bearLeg);

    if (!extendedPoints.some((p) => p.date === currentTrough.date && p.type === 'trough')) {
      extendedPoints.push(currentTrough);
    }

    if (currentPhase === 'bull') {
      // Also add bull leg: running trough → running peak
      const bullLeg: Cycle = {
        from: currentTrough,
        to: currentPeak,
        durationDays: daysBetween(currentTrough.date, currentPeak.date),
        priceChange: currentPeak.price - currentTrough.price,
        percentChange: currentTrough.price > 0
          ? ((currentPeak.price - currentTrough.price) / currentTrough.price) * 100
          : 0,
        direction: 'bull',
      };
      cycles.push(bullLeg);

      if (!extendedPoints.some((p) => p.date === currentPeak.date && p.type === 'peak')) {
        extendedPoints.push(currentPeak);
      }
    }
  }

  // Sort extended points for the timeline chart
  extendedPoints.sort((a, b) => {
    if (a.index === -1 && b.index === -1) return a.date.localeCompare(b.date);
    if (a.index === -1) return -1;
    if (b.index === -1) return 1;
    return a.index - b.index;
  });

  // Phase progress: how far into the avg cycle duration we are
  const daysSincePhaseStart = daysBetween(today, phaseAnchor.date);
  const avgDuration = currentPhase === 'bull' ? avgBullDuration : avgBearDuration;
  const phaseProgress = avgDuration > 0
    ? Math.min(daysSincePhaseStart / avgDuration, 1.5)
    : 0;

  // Compute projected cycle top/bottom dates from the phase anchor
  const { projectedTop, projectedBottom } = computeProjections(
    currentPhase,
    phaseAnchor,
    today,
    avgBullDuration,
    avgBearDuration,
    bullCycles.length,
    bearCycles.length
  );

  // Final safety: clamp any NaN/Infinity values
  const safe = (v: number, fallback = 0) => (isFinite(v) ? v : fallback);

  return {
    cycles,
    allPoints: extendedPoints,
    currentPeak,
    currentTrough,
    daysSincePeak: daysBetween(today, currentPeak.date),
    daysSinceTrough: daysBetween(today, currentTrough.date),
    avgBullDuration: Math.round(safe(avgBullDuration)),
    avgBearDuration: Math.round(safe(avgBearDuration)),
    avgBullReturn: safe(avgBullReturn),
    avgBearDrawdown: safe(avgBearDrawdown),
    currentPhase,
    phaseProgress: safe(phaseProgress),
    projectedTop,
    projectedBottom,
  };
}
