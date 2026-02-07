'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import SectionHeader from '@/components/ui/SectionHeader';

interface Props {
  greenDistribution: Record<number, number>;
  redDistribution: Record<number, number>;
}

export default function StreakHistogram({ greenDistribution, redDistribution }: Props) {
  const allLengths = new Set([
    ...Object.keys(greenDistribution).map(Number),
    ...Object.keys(redDistribution).map(Number),
  ]);

  const data = Array.from(allLengths)
    .sort((a, b) => a - b)
    .map((len) => ({
      length: `${len}d`,
      green: greenDistribution[len] || 0,
      red: redDistribution[len] || 0,
    }));

  return (
    <div className="rounded-lg border border-border-default bg-bg-card p-2 sm:p-3">
      <SectionHeader title="Streak Length Distribution" />
      <div className="h-[160px] sm:h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={2}>
          <XAxis
            dataKey="length"
            tick={{ fontSize: 9, fill: '#4a5568' }}
            tickLine={false}
            axisLine={{ stroke: '#1a1f2e' }}
          />
          <YAxis
            tick={{ fontSize: 9, fill: '#4a5568' }}
            tickLine={false}
            axisLine={false}
            width={30}
            allowDecimals={false}
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
          <Legend
            wrapperStyle={{ fontSize: '10px', fontFamily: "'JetBrains Mono', monospace" }}
          />
          <Bar dataKey="green" fill="#00ff8766" stroke="#00ff87" strokeWidth={0.5} radius={[2, 2, 0, 0]} />
          <Bar dataKey="red" fill="#ff3b5c66" stroke="#ff3b5c" strokeWidth={0.5} radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
}
