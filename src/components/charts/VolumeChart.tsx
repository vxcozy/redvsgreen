'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { OHLCV } from '@/lib/types';

interface Props {
  candles: OHLCV[];
}

function formatVolume(v: number): string {
  if (v >= 1e9) return (v / 1e9).toFixed(1) + 'B';
  if (v >= 1e6) return (v / 1e6).toFixed(1) + 'M';
  if (v >= 1e3) return (v / 1e3).toFixed(1) + 'K';
  return v.toFixed(0);
}

export default function VolumeChart({ candles }: Props) {
  const step = Math.max(1, Math.floor(candles.length / 120));
  const sampled = candles.filter((_, i) => i % step === 0);

  const data = sampled.map((c) => ({
    date: c.date,
    // Prefer quoteVolume (USD-denominated), fall back to base volume
    volume: c.quoteVolume > 0 ? c.quoteVolume : c.volume,
    isGreen: c.close >= c.open,
  }));

  // Check if we actually have volume data (DeFiLlama fallback has none)
  const hasVolume = data.some((d) => d.volume > 0);

  if (!hasVolume) {
    return (
      <div className="rounded-lg border border-border-default bg-bg-card p-2 sm:p-3">
        <div className="mb-1.5 px-1 text-[9px] uppercase tracking-[0.15em] text-text-muted sm:mb-2 sm:text-[10px] sm:tracking-[0.2em]">
          Volume
        </div>
        <div className="flex h-[140px] items-center justify-center text-[10px] text-text-muted/60 sm:h-[180px] sm:text-[11px]">
          Volume data unavailable for current data source
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border-default bg-bg-card p-2 sm:p-3">
      <div className="mb-1.5 px-1 text-[9px] uppercase tracking-[0.15em] text-text-muted sm:mb-2 sm:text-[10px] sm:tracking-[0.2em]">
        Volume
      </div>
      <div className="h-[140px] sm:h-[180px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={0} barCategoryGap={0}>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 9, fill: '#4a5568' }}
            tickLine={false}
            axisLine={{ stroke: '#1a1f2e' }}
            interval={Math.floor(data.length / 5)}
          />
          <YAxis
            tick={{ fontSize: 9, fill: '#4a5568' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatVolume}
            width={50}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#12161f',
              border: '1px solid #1a1f2e',
              borderRadius: '6px',
              fontSize: '11px',
              fontFamily: "'JetBrains Mono', monospace",
            }}
            labelStyle={{ color: '#7a8599' }}
            formatter={(val) => [formatVolume(Number(val)), 'Volume']}
          />
          <Bar dataKey="volume" radius={[1, 1, 0, 0]}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.isGreen ? '#00ff8744' : '#ff3b5c44'}
                stroke={entry.isGreen ? '#00ff8766' : '#ff3b5c66'}
                strokeWidth={0.5}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
}
