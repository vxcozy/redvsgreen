'use client';

import { useEffect, useRef } from 'react';
import { createChart, IChartApi, Time, ColorType, LineStyle, LineSeries } from 'lightweight-charts';
import { IndicatorPoint } from '@/lib/types';
import { COLORS } from '@/lib/constants';

interface Props {
  data: IndicatorPoint[];
  height?: number;
}

export default function RSIChart({ data, height = 180 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height,
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

    const rsiSeries = chart.addSeries(LineSeries, {
      color: COLORS.overlay.rsi,
      lineWidth: 2 as const,
      priceLineVisible: false,
    });

    const overbought = chart.addSeries(LineSeries, {
      color: COLORS.streak.red + '66',
      lineWidth: 1 as const,
      lineStyle: LineStyle.Dashed,
      priceLineVisible: false,
    });

    const oversold = chart.addSeries(LineSeries, {
      color: COLORS.streak.green + '66',
      lineWidth: 1 as const,
      lineStyle: LineStyle.Dashed,
      priceLineVisible: false,
    });

    if (data.length > 0) {
      rsiSeries.setData(data.map((p) => ({ time: p.time as Time, value: p.value })));
      overbought.setData(data.map((p) => ({ time: p.time as Time, value: 70 })));
      oversold.setData(data.map((p) => ({ time: p.time as Time, value: 30 })));
      chart.timeScale().fitContent();
    }

    chartRef.current = chart;

    return () => {
      chart.remove();
      chartRef.current = null;
    };
  }, [data, height]);

  return (
    <div className="chart-container rounded-lg border border-border-default bg-bg-card p-2 sm:p-3">
      <div className="mb-1.5 flex items-center justify-between px-1 sm:mb-2">
        <span className="text-[9px] uppercase tracking-[0.15em] text-text-muted sm:text-[10px] sm:tracking-[0.2em]">
          RSI (14)
        </span>
        <div className="flex items-center gap-2 text-[8px] text-text-muted sm:text-[9px]">
          <span className="flex items-center gap-1">
            <span className="inline-block h-[2px] w-2.5 rounded sm:w-3" style={{ backgroundColor: '#ff3b5c66' }} />
            70
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-[2px] w-2.5 rounded sm:w-3" style={{ backgroundColor: '#00ff8766' }} />
            30
          </span>
        </div>
      </div>
      <div ref={containerRef} className="h-[140px] sm:h-[180px]" />
    </div>
  );
}
