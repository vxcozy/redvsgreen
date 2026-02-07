'use client';

import { useEffect, useRef } from 'react';
import {
  createChart,
  IChartApi,
  Time,
  ColorType,
  LineStyle,
  LineSeries,
} from 'lightweight-charts';
import { OHLCV } from '@/lib/types';
import { COLORS } from '@/lib/constants';
import SectionHeader from '@/components/ui/SectionHeader';

interface Props {
  btcCandles: OHLCV[];
  ethCandles: OHLCV[];
}

const BTC_COLOR = '#f7931a';
const ETH_COLOR = '#627eea';

/**
 * Normalise candle close prices to % change from start (index = 100).
 * Aligns both series to the same date range.
 */
function normalise(candles: OHLCV[]) {
  if (candles.length === 0) return [];
  const base = candles[0].close;
  return candles.map((c) => ({
    time: c.date as Time,
    value: parseFloat((((c.close - base) / base) * 100).toFixed(2)),
  }));
}

export default function ComparisonPriceChart({ btcCandles, ethCandles }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 220,
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: COLORS.bg.card },
        textColor: COLORS.text.secondary,
        fontSize: 10,
        fontFamily: "'JetBrains Mono', monospace",
      },
      grid: {
        vertLines: { color: '#141820', style: LineStyle.Dotted },
        horzLines: { color: '#141820', style: LineStyle.Dotted },
      },
      rightPriceScale: {
        borderColor: COLORS.border.default,
        scaleMargins: { top: 0.05, bottom: 0.05 },
      },
      timeScale: {
        borderColor: COLORS.border.default,
        timeVisible: false,
      },
      crosshair: {
        vertLine: { color: COLORS.text.muted, width: 1 as const, style: LineStyle.Dashed },
        horzLine: { color: COLORS.text.muted, width: 1 as const, style: LineStyle.Dashed },
      },
    });

    const btcSeries = chart.addSeries(LineSeries, {
      color: BTC_COLOR,
      lineWidth: 2 as const,
      priceLineVisible: false,
      title: 'BTC',
    });

    const ethSeries = chart.addSeries(LineSeries, {
      color: ETH_COLOR,
      lineWidth: 2 as const,
      priceLineVisible: false,
      title: 'ETH',
    });

    // Align date ranges — find common start date
    const btcDates = new Set(btcCandles.map((c) => c.date));
    const commonEth = ethCandles.filter((c) => btcDates.has(c.date));
    const ethDates = new Set(commonEth.map((c) => c.date));
    const commonBtc = btcCandles.filter((c) => ethDates.has(c.date));

    const btcNorm = normalise(commonBtc);
    const ethNorm = normalise(commonEth);

    if (btcNorm.length > 0) btcSeries.setData(btcNorm);
    if (ethNorm.length > 0) ethSeries.setData(ethNorm);

    chart.timeScale().fitContent();
    chartRef.current = chart;

    return () => {
      chart.remove();
      chartRef.current = null;
    };
  }, [btcCandles, ethCandles]);

  return (
    <div className="chart-container rounded-lg border border-border-default bg-bg-card p-2 sm:p-3">
      <SectionHeader title="Price Performance Comparison">
        <span className="flex items-center gap-1 text-[8px] text-text-muted sm:text-[9px]">
          <span className="inline-block h-[2px] w-2.5 rounded sm:w-3" style={{ backgroundColor: BTC_COLOR }} />
          BTC
        </span>
        <span className="flex items-center gap-1 text-[8px] text-text-muted sm:text-[9px]">
          <span className="inline-block h-[2px] w-2.5 rounded sm:w-3" style={{ backgroundColor: ETH_COLOR }} />
          ETH
        </span>
        <span className="text-[7px] text-text-muted/60 sm:text-[8px]">
          (% change from start)
        </span>
      </SectionHeader>
      <div ref={containerRef} className="h-[180px] sm:h-[220px]" />
    </div>
  );
}
