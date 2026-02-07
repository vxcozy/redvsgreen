import { OHLCV, IndicatorPoint } from '@/lib/types';

/**
 * Calculate rolling historical volatility (annualised standard deviation of log returns).
 * window = number of days in the rolling window (default 30).
 * Returns one IndicatorPoint per candle starting from index = window.
 */
export function calculateHistoricalVolatility(
  candles: OHLCV[],
  window = 30,
): IndicatorPoint[] {
  if (candles.length < window + 1) return [];

  // log returns: ln(close_i / close_{i-1})
  const logReturns: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    logReturns.push(Math.log(candles[i].close / candles[i - 1].close));
  }

  const points: IndicatorPoint[] = [];
  const annualisationFactor = Math.sqrt(365);

  for (let i = window - 1; i < logReturns.length; i++) {
    const slice = logReturns.slice(i - window + 1, i + 1);
    const mean = slice.reduce((s, v) => s + v, 0) / slice.length;
    const variance =
      slice.reduce((s, v) => s + (v - mean) ** 2, 0) / (slice.length - 1);
    const stdDev = Math.sqrt(variance);
    const annualisedVol = stdDev * annualisationFactor * 100; // as percentage

    // +1 because logReturns[i] corresponds to candles[i+1]
    const candle = candles[i + 1];
    points.push({
      time: candle.date,
      value: parseFloat(annualisedVol.toFixed(2)),
    });
  }

  return points;
}
