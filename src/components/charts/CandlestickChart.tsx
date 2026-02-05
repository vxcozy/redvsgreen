'use client';

import { useEffect, useRef, useState } from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  LineData,
  Time,
  CandlestickSeries,
  LineSeries,
} from 'lightweight-charts';
import { OHLCV, IndicatorPoint, BollingerPoint } from '@/lib/types';
import { darkChartOptions, candlestickSeriesOptions, overlayLineStyles } from '@/styles/chart-theme';

interface Props {
  candles: OHLCV[];
  sma50?: IndicatorPoint[];
  sma200?: IndicatorPoint[];
  bollingerBands?: BollingerPoint[];
  showSma50?: boolean;
  showSma200?: boolean;
  showBollinger?: boolean;
  height?: number;
}

export default function CandlestickChart({
  candles,
  sma50,
  sma200,
  bollingerBands,
  showSma50 = false,
  showSma200 = false,
  showBollinger = false,
  height = 420,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const overlaySeriesRef = useRef<Record<string, ISeriesApi<'Line'>>>({});
  const [, setForceUpdate] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      ...darkChartOptions,
      width: containerRef.current.clientWidth,
      height,
      autoSize: true,
    });

    const candleSeries = chart.addSeries(CandlestickSeries, candlestickSeriesOptions);
    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;

    return () => {
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      overlaySeriesRef.current = {};
    };
  }, [height]);

  useEffect(() => {
    if (!candleSeriesRef.current || candles.length === 0) return;

    const data: CandlestickData<Time>[] = candles.map((c) => ({
      time: c.date as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    candleSeriesRef.current.setData(data);
    chartRef.current?.timeScale().fitContent();
  }, [candles]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    Object.values(overlaySeriesRef.current).forEach((s) => {
      try { chart.removeSeries(s); } catch { /* noop */ }
    });
    overlaySeriesRef.current = {};

    if (showSma50 && sma50 && sma50.length > 0) {
      const series = chart.addSeries(LineSeries,overlayLineStyles.sma50);
      series.setData(
        sma50.map((p) => ({ time: p.time as Time, value: p.value })) as LineData<Time>[]
      );
      overlaySeriesRef.current.sma50 = series;
    }

    if (showSma200 && sma200 && sma200.length > 0) {
      const series = chart.addSeries(LineSeries,overlayLineStyles.sma200);
      series.setData(
        sma200.map((p) => ({ time: p.time as Time, value: p.value })) as LineData<Time>[]
      );
      overlaySeriesRef.current.sma200 = series;
    }

    if (showBollinger && bollingerBands && bollingerBands.length > 0) {
      const upper = chart.addSeries(LineSeries,overlayLineStyles.bollingerUpper);
      const middle = chart.addSeries(LineSeries,overlayLineStyles.bollingerMiddle);
      const lower = chart.addSeries(LineSeries,overlayLineStyles.bollingerLower);

      upper.setData(
        bollingerBands.map((p) => ({ time: p.time as Time, value: p.upper })) as LineData<Time>[]
      );
      middle.setData(
        bollingerBands.map((p) => ({ time: p.time as Time, value: p.middle })) as LineData<Time>[]
      );
      lower.setData(
        bollingerBands.map((p) => ({ time: p.time as Time, value: p.lower })) as LineData<Time>[]
      );

      overlaySeriesRef.current.bbUpper = upper;
      overlaySeriesRef.current.bbMiddle = middle;
      overlaySeriesRef.current.bbLower = lower;
    }

    setForceUpdate((n) => n + 1);
  }, [showSma50, showSma200, showBollinger, sma50, sma200, bollingerBands]);

  return (
    <div className="chart-container rounded-lg border border-border-default bg-bg-card p-2 sm:p-3">
      <div className="mb-1.5 flex items-center justify-between px-1 sm:mb-2">
        <span className="text-[9px] uppercase tracking-[0.15em] text-text-muted sm:text-[10px] sm:tracking-[0.2em]">
          Price Chart
        </span>
        <div className="flex items-center gap-2 sm:gap-3">
          {showSma50 && (
            <span className="flex items-center gap-1 text-[8px] text-text-muted sm:text-[9px]">
              <span className="inline-block h-[2px] w-2.5 rounded sm:w-3" style={{ backgroundColor: '#00bbff' }} />
              SMA 50
            </span>
          )}
          {showSma200 && (
            <span className="flex items-center gap-1 text-[8px] text-text-muted sm:text-[9px]">
              <span className="inline-block h-[2px] w-2.5 rounded sm:w-3" style={{ backgroundColor: '#ff9500' }} />
              SMA 200
            </span>
          )}
          {showBollinger && (
            <span className="flex items-center gap-1 text-[8px] text-text-muted sm:text-[9px]">
              <span className="inline-block h-[2px] w-2.5 rounded sm:w-3" style={{ backgroundColor: '#6366f1' }} />
              BB
            </span>
          )}
        </div>
      </div>
      <div ref={containerRef} className="h-[280px] sm:h-[350px] md:h-[420px]" />
    </div>
  );
}
