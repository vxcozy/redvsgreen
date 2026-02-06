'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { BINANCE_SYMBOLS, TIME_RANGE_DAYS } from '@/lib/constants';

interface Props {
  candles: OHLCV[];
  asset?: string;
  timeRange?: string;
}

interface VolumeEntry {
  date: string;
  volume: number;
  open: number;
  close: number;
}

function formatVolume(v: number): string {
  if (v >= 1e9) return (v / 1e9).toFixed(1) + 'B';
  if (v >= 1e6) return (v / 1e6).toFixed(1) + 'M';
  if (v >= 1e3) return (v / 1e3).toFixed(1) + 'K';
  return v.toFixed(0);
}

export default function VolumeChart({ candles, asset, timeRange }: Props) {
  const [volumeData, setVolumeData] = useState<VolumeEntry[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  // Check if candles from main source already have volume
  const candlesHaveVolume = useMemo(
    () => candles.some((c) => c.quoteVolume > 0 || c.volume > 0),
    [candles],
  );

  // Fetch volume from dedicated CoinGecko API when candles lack volume
  useEffect(() => {
    if (candlesHaveVolume) {
      setVolumeData(null);
      return;
    }
    if (!asset || !timeRange) return;

    let cancelled = false;
    setLoading(true);
    setFetchError(false);

    const symbol = BINANCE_SYMBOLS[asset] || 'BTCUSDT';
    const days = TIME_RANGE_DAYS[timeRange] || 365;

    fetch(`/api/volume?symbol=${symbol}&days=${days}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: VolumeEntry[]) => {
        if (cancelled) return;
        if (!Array.isArray(data) || data.length === 0) {
          setFetchError(true);
        } else {
          setVolumeData(data);
        }
      })
      .catch(() => {
        if (!cancelled) setFetchError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [candlesHaveVolume, asset, timeRange]);

  // Build chart data from either source
  const chartData = useMemo(() => {
    if (candlesHaveVolume) {
      const step = Math.max(1, Math.floor(candles.length / 120));
      return candles
        .filter((_, i) => i % step === 0)
        .map((c) => ({
          date: c.date,
          volume: c.quoteVolume > 0 ? c.quoteVolume : c.volume,
          isGreen: c.close >= c.open,
        }));
    }

    if (volumeData && volumeData.length > 0) {
      const step = Math.max(1, Math.floor(volumeData.length / 120));
      return volumeData
        .filter((_, i) => i % step === 0)
        .map((v) => ({
          date: v.date,
          volume: v.volume,
          isGreen: v.close >= v.open,
        }));
    }

    return [];
  }, [candlesHaveVolume, candles, volumeData]);

  if (loading) {
    return (
      <div className="rounded-lg border border-border-default bg-bg-card p-2 sm:p-3">
        <div className="mb-1.5 px-1 text-[9px] uppercase tracking-[0.15em] text-text-muted sm:mb-2 sm:text-[10px] sm:tracking-[0.2em]">
          Volume
        </div>
        <div className="flex h-[140px] items-center justify-center text-[10px] text-text-muted/60 sm:h-[180px] sm:text-[11px]">
          Loading volume data…
        </div>
      </div>
    );
  }

  if (chartData.length === 0 || fetchError) {
    return (
      <div className="rounded-lg border border-border-default bg-bg-card p-2 sm:p-3">
        <div className="mb-1.5 px-1 text-[9px] uppercase tracking-[0.15em] text-text-muted sm:mb-2 sm:text-[10px] sm:tracking-[0.2em]">
          Volume
        </div>
        <div className="flex h-[140px] items-center justify-center text-[10px] text-text-muted/60 sm:h-[180px] sm:text-[11px]">
          Volume data unavailable
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
          <BarChart data={chartData} barGap={0} barCategoryGap={0}>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 9, fill: '#4a5568' }}
              tickLine={false}
              axisLine={{ stroke: '#1a1f2e' }}
              interval={Math.floor(chartData.length / 5)}
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
              {chartData.map((entry, i) => (
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
