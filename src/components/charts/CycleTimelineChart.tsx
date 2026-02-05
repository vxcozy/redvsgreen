'use client';

import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  Scatter,
  CartesianGrid,
} from 'recharts';
import { OHLCV, CycleAnalysis, CyclePoint } from '@/lib/types';

interface Props {
  candles: OHLCV[];
  analysis: CycleAnalysis;
  asset: string;
}

interface ChartDataPoint {
  date: string;
  price: number;
  isPeak?: boolean;
  isTrough?: boolean;
  peakPrice?: number;
  troughPrice?: number;
}

function formatPrice(v: number): string {
  if (v >= 1000) return `$${(v / 1000).toFixed(1)}k`;
  if (v >= 1) return `$${v.toFixed(0)}`;
  return `$${v.toFixed(2)}`;
}

function formatDate(d: string): string {
  const date = new Date(d);
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

function formatDuration(days: number): string {
  if (days >= 365) {
    const y = Math.floor(days / 365);
    const m = Math.floor((days % 365) / 30);
    return m > 0 ? `${y}y ${m}m` : `${y}y`;
  }
  if (days >= 30) {
    return `${Math.round(days / 30)}m`;
  }
  return `${days}d`;
}

export default function CycleTimelineChart({ candles, analysis, asset }: Props) {
  if (!candles.length || !analysis.allPoints.length) return null;

  // Build peak/trough date sets for fast lookup
  const peakDates = new Set(
    analysis.allPoints.filter((p) => p.type === 'peak' && p.index >= 0).map((p) => p.date)
  );
  const troughDates = new Set(
    analysis.allPoints.filter((p) => p.type === 'trough' && p.index >= 0).map((p) => p.date)
  );

  // Downsample candles for chart performance (weekly)
  const step = Math.max(1, Math.floor(candles.length / 500));
  const chartData: ChartDataPoint[] = [];

  for (let i = 0; i < candles.length; i += step) {
    const c = candles[i];
    const isPeak = peakDates.has(c.date);
    const isTrough = troughDates.has(c.date);

    chartData.push({
      date: c.date,
      price: c.close,
      isPeak,
      isTrough,
      peakPrice: isPeak ? c.high : undefined,
      troughPrice: isTrough ? c.low : undefined,
    });
  }

  // Also ensure all peak/trough dates are included even if they fall between steps
  const chartDatesSet = new Set(chartData.map((d) => d.date));
  for (const p of analysis.allPoints) {
    if (p.index >= 0 && p.index < candles.length && !chartDatesSet.has(p.date)) {
      const c = candles[p.index];
      chartData.push({
        date: c.date,
        price: c.close,
        isPeak: p.type === 'peak',
        isTrough: p.type === 'trough',
        peakPrice: p.type === 'peak' ? c.high : undefined,
        troughPrice: p.type === 'trough' ? c.low : undefined,
      });
    }
  }

  // Sort by date
  chartData.sort((a, b) => a.date.localeCompare(b.date));

  // Only show on-chart cycle points (index >= 0)
  const onChartPoints = analysis.allPoints.filter((p) => p.index >= 0);

  return (
    <div className="rounded-lg border border-border-default bg-bg-card p-2 sm:p-4">
      <div className="mb-2 flex items-center justify-between sm:mb-3">
        <div className="text-[9px] uppercase tracking-[0.15em] text-text-muted sm:text-[10px] sm:tracking-[0.2em]">
          {asset} Cycle Timeline
        </div>
        <div className="flex items-center gap-2 text-[8px] text-text-muted/60 sm:gap-3 sm:text-[9px]">
          <span className="flex items-center gap-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full sm:h-2 sm:w-2" style={{ backgroundColor: '#ff3b5c' }} />
            Peak
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full sm:h-2 sm:w-2" style={{ backgroundColor: '#00ff87' }} />
            Trough
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[200px] sm:h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00bbff" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#00bbff" stopOpacity={0.01} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="2 4"
              stroke="#141820"
              vertical={false}
            />

            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fill: '#4a5568', fontSize: 9 }}
              axisLine={{ stroke: '#1a1f2e' }}
              tickLine={false}
              interval={Math.max(0, Math.floor(chartData.length / 8))}
            />

            <YAxis
              scale="log"
              domain={['auto', 'auto']}
              tickFormatter={formatPrice}
              tick={{ fill: '#4a5568', fontSize: 9 }}
              axisLine={{ stroke: '#1a1f2e' }}
              tickLine={false}
              width={55}
            />

            <Tooltip
              contentStyle={{
                backgroundColor: '#0e1119',
                border: '1px solid #1a1f2e',
                borderRadius: 6,
                fontSize: 11,
                fontFamily: "'JetBrains Mono', monospace",
              }}
              labelFormatter={(label) => {
                const d = new Date(label as string);
                return d.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });
              }}
              formatter={(val) => [formatPrice(Number(val)), 'Price']}
            />

            {/* Vertical reference lines for peaks/troughs */}
            {onChartPoints.map((p) => (
              <ReferenceLine
                key={`${p.type}-${p.date}`}
                x={p.date}
                stroke={p.type === 'peak' ? '#ff3b5c' : '#00ff87'}
                strokeDasharray="3 3"
                strokeOpacity={0.4}
              />
            ))}

            {/* Price area */}
            <Area
              type="monotone"
              dataKey="price"
              stroke="#00bbff"
              strokeWidth={1.5}
              fill="url(#priceGradient)"
              dot={false}
              isAnimationActive={false}
            />

            {/* Peak markers */}
            <Scatter
              dataKey="peakPrice"
              fill="#ff3b5c"
              shape="diamond"
              isAnimationActive={false}
            />

            {/* Trough markers */}
            <Scatter
              dataKey="troughPrice"
              fill="#00ff87"
              shape="circle"
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Cycle Breakdown Table */}
      {analysis.cycles.length > 0 && (
        <div className="mt-3 overflow-x-auto sm:mt-4">
          <table className="w-full text-[9px] sm:text-[10px]">
            <thead>
              <tr className="border-b border-border-default">
                <th className="pb-1.5 text-left font-normal text-text-muted sm:pb-2">Phase</th>
                <th className="hidden pb-2 text-left font-normal text-text-muted sm:table-cell">From</th>
                <th className="hidden pb-2 text-left font-normal text-text-muted sm:table-cell">To</th>
                <th className="pb-1.5 text-right font-normal text-text-muted sm:pb-2">Duration</th>
                <th className="pb-1.5 text-right font-normal text-text-muted sm:pb-2">Return</th>
              </tr>
            </thead>
            <tbody>
              {analysis.cycles.map((cycle, i) => {
                const isBull = cycle.direction === 'bull';
                const color = isBull ? '#00ff87' : '#ff3b5c';
                return (
                  <tr key={i} className="border-b border-border-default/30">
                    <td className="py-1 sm:py-1.5">
                      <span
                        className="rounded px-1 py-0.5 text-[8px] font-semibold uppercase sm:px-1.5 sm:text-[9px]"
                        style={{
                          color,
                          backgroundColor: isBull ? '#00ff8712' : '#ff3b5c12',
                        }}
                      >
                        {isBull ? 'Bull' : 'Bear'}
                      </span>
                    </td>
                    <td className="hidden py-1.5 text-text-secondary sm:table-cell">
                      {formatPrice(cycle.from.price)}{' '}
                      <span className="text-text-muted">({cycle.from.date})</span>
                    </td>
                    <td className="hidden py-1.5 text-text-secondary sm:table-cell">
                      {formatPrice(cycle.to.price)}{' '}
                      <span className="text-text-muted">({cycle.to.date})</span>
                    </td>
                    <td className="py-1 text-right font-medium text-text-primary sm:py-1.5">
                      {formatDuration(cycle.durationDays)}
                    </td>
                    <td className="py-1 text-right font-semibold sm:py-1.5" style={{ color }}>
                      {cycle.percentChange >= 0 ? '+' : ''}
                      {cycle.percentChange.toFixed(0)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
