'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { COLORS } from '@/lib/constants';
import { useIVTermStructure } from '@/hooks/useIVTermStructure';
import SectionHeader from '@/components/ui/SectionHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface Props {
  currency: string;
}

const TERM_COLOR = '#14b8a6';

export default function IVTermStructureChart({ currency }: Props) {
  const { data, loading, error } = useIVTermStructure(currency);

  const chartData = useMemo(() => {
    if (!data?.points) return [];
    return data.points.map((p) => ({
      dte: p.daysToExpiry,
      iv: p.iv,
      label: p.expiryLabel,
      samples: p.sampleCount,
    }));
  }, [data]);

  if (loading) {
    return (
      <div className="chart-container flex h-full flex-col rounded-lg border border-border-default bg-bg-card p-2 sm:p-3">
        <SectionHeader title="IV Term Structure" />
        <LoadingSpinner className="py-16" />
      </div>
    );
  }

  if (error || chartData.length === 0) {
    return (
      <div className="chart-container flex h-full flex-col rounded-lg border border-border-default bg-bg-card p-2 sm:p-3">
        <SectionHeader title="IV Term Structure" />
        <div className="flex min-h-[140px] flex-1 items-center justify-center text-[10px] text-text-muted sm:text-xs">
          {error ? `Error: ${error}` : 'No ATM options data available'}
        </div>
      </div>
    );
  }

  return (
    <div className="chart-container flex h-full flex-col rounded-lg border border-border-default bg-bg-card p-2 sm:p-3">
      <SectionHeader title={`${currency} IV Term Structure`}>
        <span className="flex items-center gap-1 text-[8px] text-text-muted sm:text-[9px]">
          <span
            className="inline-block h-[2px] w-2.5 rounded sm:w-3"
            style={{ backgroundColor: TERM_COLOR }}
          />
          ATM IV %
        </span>
      </SectionHeader>
      <div className="min-h-[140px] flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border.default} opacity={0.4} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 9, fill: COLORS.text.muted }}
              tickLine={false}
              axisLine={{ stroke: COLORS.border.default }}
              interval={chartData.length > 10 ? Math.floor(chartData.length / 6) : 0}
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
                'ATM IV',
              ]}
            />
            <Line
              type="monotone"
              dataKey="iv"
              stroke={TERM_COLOR}
              strokeWidth={2}
              dot={{
                r: 4,
                fill: TERM_COLOR,
                stroke: COLORS.bg.card,
                strokeWidth: 2,
              }}
              activeDot={{ r: 6, fill: TERM_COLOR }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
