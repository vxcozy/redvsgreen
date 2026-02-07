'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useMemo } from 'react';
import { IndicatorPoint } from '@/lib/types';
import { COLORS } from '@/lib/constants';
import SectionHeader from '@/components/ui/SectionHeader';

interface Props {
  data: IndicatorPoint[];
}

export default function VolatilityChart({ data }: Props) {
  const chartData = useMemo(
    () =>
      data.map((d) => ({
        date: d.time,
        value: d.value,
      })),
    [data],
  );

  if (chartData.length === 0) return null;

  return (
    <div className="rounded-lg border border-border-default bg-bg-card p-2 sm:p-3">
      <SectionHeader title="Historical Volatility (30d)">
        <span className="flex items-center gap-1 text-[8px] text-text-muted sm:text-[9px]">
          <span
            className="inline-block h-[2px] w-2.5 rounded sm:w-3"
            style={{ backgroundColor: COLORS.overlay.volatility }}
          />
          Annualised %
        </span>
      </SectionHeader>
      <div className="h-[140px] sm:h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="volGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.overlay.volatility} stopOpacity={0.3} />
                <stop offset="100%" stopColor={COLORS.overlay.volatility} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 9, fill: COLORS.text.muted }}
              tickLine={false}
              axisLine={{ stroke: COLORS.border.default }}
              interval={Math.floor(chartData.length / 5)}
            />
            <YAxis
              tick={{ fontSize: 9, fill: COLORS.text.muted }}
              tickLine={false}
              axisLine={false}
              width={38}
              tickFormatter={(v: number) => `${v}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: COLORS.bg.tertiary,
                border: `1px solid ${COLORS.border.default}`,
                borderRadius: '6px',
                fontSize: '11px',
                fontFamily: "'JetBrains Mono', monospace",
              }}
              labelStyle={{ color: COLORS.text.secondary }}
              formatter={(value: number | undefined) => [
                value != null ? `${value.toFixed(1)}%` : '—',
                'Volatility',
              ]}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={COLORS.overlay.volatility}
              strokeWidth={1.5}
              fill="url(#volGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
