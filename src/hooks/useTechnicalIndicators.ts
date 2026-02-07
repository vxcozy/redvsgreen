'use client';

import { useMemo } from 'react';
import { OHLCV, IndicatorPoint, BollingerPoint } from '@/lib/types';
import {
  calculateSMA,
  calculateRSI,
  calculateBollingerBands,
  calculateATR,
} from '@/lib/analysis/indicators';
import { calculateHistoricalVolatility } from '@/lib/analysis/volatility';

export function useTechnicalIndicators(candles: OHLCV[]) {
  const sma50 = useMemo(() => calculateSMA(candles, 50), [candles]);
  const sma200 = useMemo(() => calculateSMA(candles, 200), [candles]);
  const rsi = useMemo(() => calculateRSI(candles, 14), [candles]);
  const bollingerBands = useMemo(
    () => calculateBollingerBands(candles, 20, 2),
    [candles]
  );
  const atr = useMemo(() => calculateATR(candles, 14), [candles]);
  const volatility = useMemo(() => calculateHistoricalVolatility(candles, 30), [candles]);

  return { sma50, sma200, rsi, bollingerBands, atr, volatility };
}

export type TechnicalIndicators = {
  sma50: IndicatorPoint[];
  sma200: IndicatorPoint[];
  rsi: IndicatorPoint[];
  bollingerBands: BollingerPoint[];
  atr: IndicatorPoint[];
  volatility: IndicatorPoint[];
};
