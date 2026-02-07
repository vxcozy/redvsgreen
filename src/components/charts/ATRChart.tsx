'use client';

import { useEffect, useRef } from 'react';
import { createChart, IChartApi, Time, ColorType, LineStyle, LineSeries } from 'lightweight-charts';
import { IndicatorPoint } from '@/lib/types';
import { COLORS } from '@/lib/constants';
import SectionHeader from '@/components/ui/SectionHeader';

interface Props {
  data: IndicatorPoint[];
  height?: number;
}

export default function ATRChart({ data, height = 180 }: Props) {
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

    const atrSeries = chart.addSeries(LineSeries, {
      color: COLORS.overlay.atr,
      lineWidth: 2 as const,
      priceLineVisible: false,
    });

    if (data.length > 0) {
      atrSeries.setData(data.map((p) => ({ time: p.time as Time, value: p.value })));
      chart.timeScale().fitContent();
    }

    chartRef.current = chart;

    return () => {
      chart.remove();
      chartRef.current = null;
    };
  }, [data, height]);

  return (
    <div className="chart-container flex h-full flex-col rounded-lg border border-border-default bg-bg-card p-2 sm:p-3">
      <SectionHeader title="ATR (14)">
        <span className="flex items-center gap-1 text-[8px] text-text-muted sm:text-[9px]">
          <span className="inline-block h-[2px] w-2.5 rounded sm:w-3" style={{ backgroundColor: COLORS.overlay.atr }} />
          Average True Range
        </span>
      </SectionHeader>
      <div ref={containerRef} className="min-h-[140px] flex-1" />
    </div>
  );
}
