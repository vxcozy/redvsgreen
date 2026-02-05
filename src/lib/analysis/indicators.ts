import { OHLCV, IndicatorPoint, BollingerPoint } from '../types';

export function calculateSMA(
  candles: OHLCV[],
  period: number
): IndicatorPoint[] {
  const results: IndicatorPoint[] = [];
  for (let i = period - 1; i < candles.length; i++) {
    const slice = candles.slice(i - period + 1, i + 1);
    const avg = slice.reduce((sum, c) => sum + c.close, 0) / period;
    results.push({ time: candles[i].date, value: avg });
  }
  return results;
}

export function calculateRSI(
  candles: OHLCV[],
  period: number = 14
): IndicatorPoint[] {
  const results: IndicatorPoint[] = [];
  if (candles.length < period + 1) return results;

  const changes = candles.map((c, i) =>
    i === 0 ? 0 : c.close - candles[i - 1].close
  );

  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    if (changes[i] > 0) avgGain += changes[i];
    else avgLoss += Math.abs(changes[i]);
  }
  avgGain /= period;
  avgLoss /= period;

  const rs0 = avgLoss === 0 ? Infinity : avgGain / avgLoss;
  results.push({
    time: candles[period].date,
    value: avgLoss === 0 ? 100 : 100 - 100 / (1 + rs0),
  });

  for (let i = period + 1; i < candles.length; i++) {
    const gain = changes[i] > 0 ? changes[i] : 0;
    const loss = changes[i] < 0 ? Math.abs(changes[i]) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    const rs = avgLoss === 0 ? Infinity : avgGain / avgLoss;
    results.push({
      time: candles[i].date,
      value: avgLoss === 0 ? 100 : 100 - 100 / (1 + rs),
    });
  }

  return results;
}

export function calculateBollingerBands(
  candles: OHLCV[],
  period: number = 20,
  multiplier: number = 2
): BollingerPoint[] {
  const results: BollingerPoint[] = [];
  for (let i = period - 1; i < candles.length; i++) {
    const slice = candles.slice(i - period + 1, i + 1);
    const closes = slice.map((c) => c.close);
    const mean = closes.reduce((a, b) => a + b, 0) / period;
    const variance =
      closes.reduce((sum, c) => sum + (c - mean) ** 2, 0) / period;
    const stdDev = Math.sqrt(variance);

    results.push({
      time: candles[i].date,
      upper: mean + multiplier * stdDev,
      middle: mean,
      lower: mean - multiplier * stdDev,
    });
  }
  return results;
}

export function calculateATR(
  candles: OHLCV[],
  period: number = 14
): IndicatorPoint[] {
  const results: IndicatorPoint[] = [];
  if (candles.length < period) return results;

  const trueRanges: number[] = [candles[0].high - candles[0].low];
  for (let i = 1; i < candles.length; i++) {
    const prevClose = candles[i - 1].close;
    trueRanges.push(
      Math.max(
        candles[i].high - candles[i].low,
        Math.abs(candles[i].high - prevClose),
        Math.abs(candles[i].low - prevClose)
      )
    );
  }

  let atr =
    trueRanges.slice(0, period).reduce((a, b) => a + b, 0) / period;
  results.push({ time: candles[period - 1].date, value: atr });

  for (let i = period; i < candles.length; i++) {
    atr = (atr * (period - 1) + trueRanges[i]) / period;
    results.push({ time: candles[i].date, value: atr });
  }

  return results;
}
