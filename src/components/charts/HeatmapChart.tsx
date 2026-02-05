'use client';

import { useMemo } from 'react';
import { OHLCV } from '@/lib/types';

interface Props {
  candles: OHLCV[];
}

export default function HeatmapChart({ candles }: Props) {
  const { weeks, maxAbsChange } = useMemo(() => {
    const data = candles.map((c) => {
      const pctChange = ((c.close - c.open) / c.open) * 100;
      return {
        date: c.date,
        pctChange,
        dayOfWeek: new Date(c.date + 'T00:00:00Z').getUTCDay(),
      };
    });

    const weeksArr: typeof data[] = [];
    let currentWeek: typeof data = [];

    data.forEach((d, i) => {
      currentWeek.push(d);
      if (d.dayOfWeek === 0 || i === data.length - 1) {
        weeksArr.push(currentWeek);
        currentWeek = [];
      }
    });

    const maxAbs = Math.max(...data.map((d) => Math.abs(d.pctChange)), 1);

    return { weeks: weeksArr.slice(-52), maxAbsChange: maxAbs };
  }, [candles]);

  function getColor(pct: number): string {
    const intensity = Math.min(Math.abs(pct) / maxAbsChange, 1);
    const alpha = Math.floor(intensity * 200 + 30)
      .toString(16)
      .padStart(2, '0');
    return pct >= 0 ? `#00ff87${alpha}` : `#ff3b5c${alpha}`;
  }

  return (
    <div className="rounded-lg border border-border-default bg-bg-card p-2 sm:p-4">
      <div className="mb-2 text-[9px] uppercase tracking-[0.15em] text-text-muted sm:mb-3 sm:text-[10px] sm:tracking-[0.2em]">
        Daily Returns Heatmap
      </div>
      <div className="overflow-x-auto">
        <div className="flex gap-[2px]" style={{ minWidth: weeks.length * 12 }}>
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[2px]">
              {week.map((day) => (
                <div
                  key={day.date}
                  className="h-[10px] w-[10px] rounded-[1px] transition-all hover:scale-150 hover:z-10"
                  style={{ backgroundColor: getColor(day.pctChange) }}
                  title={`${day.date}: ${day.pctChange >= 0 ? '+' : ''}${day.pctChange.toFixed(2)}%`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 flex items-center justify-center gap-1">
        <span className="text-[8px] text-text-muted">-{maxAbsChange.toFixed(0)}%</span>
        <div className="flex gap-[1px]">
          {[-0.8, -0.6, -0.4, -0.2, 0, 0.2, 0.4, 0.6, 0.8].map((v) => (
            <div
              key={v}
              className="h-2 w-3 rounded-[1px]"
              style={{ backgroundColor: getColor(v * maxAbsChange) }}
            />
          ))}
        </div>
        <span className="text-[8px] text-text-muted">+{maxAbsChange.toFixed(0)}%</span>
      </div>
    </div>
  );
}
