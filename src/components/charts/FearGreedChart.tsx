'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { useMemo } from 'react';
import { FearGreedEntry, TimeRange } from '@/lib/types';

interface Props {
  data: FearGreedEntry[];
  timeRange: TimeRange;
}

const TIME_RANGE_DAYS: Record<TimeRange, number> = {
  '1Y': 365,
  '2Y': 730,
  ALL: Infinity,
};

export default function FearGreedChart({ data, timeRange }: Props) {
  const chartData = useMemo(() => {
    const maxDays = TIME_RANGE_DAYS[timeRange];
    const sliced = maxDays === Infinity ? data : data.slice(0, maxDays);
    return [...sliced].reverse().map((d) => ({
      date: d.date,
      value: d.value,
      label: d.classification,
    }));
  }, [data, timeRange]);

  return (
    <div className="rounded-lg border border-border-default bg-bg-card p-2 sm:p-3">
      <div className="mb-1.5 px-1 text-[9px] uppercase tracking-[0.15em] text-text-muted sm:mb-2 sm:text-[10px] sm:tracking-[0.2em]">
        Fear &amp; Greed Index
      </div>
      <div className="h-[140px] sm:h-[180px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="fgGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00ff87" stopOpacity={0.3} />
              <stop offset="50%" stopColor="#eab308" stopOpacity={0.1} />
              <stop offset="100%" stopColor="#ff3b5c" stopOpacity={0.3} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 9, fill: '#4a5568' }}
            tickLine={false}
            axisLine={{ stroke: '#1a1f2e' }}
            interval={Math.floor(chartData.length / 5)}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 9, fill: '#4a5568' }}
            tickLine={false}
            axisLine={false}
            width={30}
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
          />
          <ReferenceLine y={25} stroke="#ff3b5c33" strokeDasharray="3 3" />
          <ReferenceLine y={75} stroke="#00ff8733" strokeDasharray="3 3" />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#eab308"
            strokeWidth={1.5}
            fill="url(#fgGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
}
