'use client';

import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { OHLCV, TimeRange } from '@/lib/types';
import { TIME_RANGE_DAYS } from '@/lib/constants';
import SectionHeader from '@/components/ui/SectionHeader';

interface Props {
  candles: OHLCV[];
  timeRange?: TimeRange;
}

interface DayData {
  date: string;
  pctChange: number;
  dayOfWeek: number;
  open: number;
  close: number;
}

interface ModalState {
  day: DayData;
  x: number;
  y: number;
}

function formatPrice(p: number): string {
  if (p >= 1000) return '$' + p.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (p >= 1) return '$' + p.toFixed(2);
  return '$' + p.toFixed(4);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export default function HeatmapChart({ candles, timeRange = 'ALL' }: Props) {
  const [modal, setModal] = useState<ModalState | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const { weeks, maxAbsChange } = useMemo(() => {
    const data: DayData[] = candles.map((c) => {
      const pctChange = c.open > 0 ? ((c.close - c.open) / c.open) * 100 : 0;
      return {
        date: c.date,
        pctChange,
        dayOfWeek: new Date(c.date + 'T00:00:00Z').getUTCDay(),
        open: c.open,
        close: c.close,
      };
    });

    const weeksArr: DayData[][] = [];
    let currentWeek: DayData[] = [];

    data.forEach((d, i) => {
      currentWeek.push(d);
      if (d.dayOfWeek === 0 || i === data.length - 1) {
        weeksArr.push(currentWeek);
        currentWeek = [];
      }
    });

    let maxAbs = 1;
    for (const d of data) {
      const abs = Math.abs(d.pctChange);
      if (abs > maxAbs) maxAbs = abs;
    }

    // Determine number of weeks to show based on timeRange
    const days = TIME_RANGE_DAYS[timeRange] ?? 9999;
    const maxWeeks = days >= 9999 ? weeksArr.length : Math.ceil(days / 7);
    return { weeks: weeksArr.slice(-maxWeeks), maxAbsChange: maxAbs };
  }, [candles, timeRange]);

  function getColor(pct: number): string {
    const intensity = Math.min(Math.abs(pct) / maxAbsChange, 1);
    const alpha = Math.floor(intensity * 200 + 30)
      .toString(16)
      .padStart(2, '0');
    return pct >= 0 ? `#00ff87${alpha}` : `#ff3b5c${alpha}`;
  }

  const handleSquareClick = useCallback((day: DayData, e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Position relative to container
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setModal({ day, x, y });
  }, []);

  // Close modal when clicking outside
  useEffect(() => {
    if (!modal) return;

    function handleClickOutside(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setModal(null);
      }
    }

    // Delay to avoid immediate close from the same click
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 10);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [modal]);

  // Compute modal position clamped within container
  const modalStyle = useMemo(() => {
    if (!modal || !containerRef.current) return {};
    const containerWidth = containerRef.current.offsetWidth;
    const modalWidth = 200;
    const modalHeight = 120;

    let left = modal.x - modalWidth / 2;
    let top = modal.y - modalHeight - 12;

    // Clamp horizontal
    if (left < 4) left = 4;
    if (left + modalWidth > containerWidth - 4) left = containerWidth - modalWidth - 4;

    // If above would go off top, show below
    if (top < 4) top = modal.y + 16;

    return { left, top };
  }, [modal]);

  const isGreen = modal ? modal.day.pctChange >= 0 : false;

  return (
    <div ref={containerRef} className="relative rounded-lg border border-border-default bg-bg-card p-2 sm:p-4">
      <SectionHeader title="Daily Returns Heatmap" />
      <div className="overflow-x-auto">
        <div className="flex justify-center gap-[2px]" style={{ minWidth: weeks.length * 12 }}>
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[2px]">
              {week.map((day) => (
                <div
                  key={day.date}
                  className="h-[10px] w-[10px] cursor-pointer rounded-[1px] transition-all hover:scale-150 hover:z-10"
                  style={{ backgroundColor: getColor(day.pctChange) }}
                  title={`${day.date}: ${day.pctChange >= 0 ? '+' : ''}${day.pctChange.toFixed(2)}%`}
                  onClick={(e) => handleSquareClick(day, e)}
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

      {/* Click modal */}
      {modal && (
        <div
          ref={modalRef}
          className="absolute z-50 rounded-lg border bg-bg-card shadow-lg"
          style={{
            left: modalStyle.left,
            top: modalStyle.top,
            width: 200,
            borderColor: isGreen ? '#00ff8730' : '#ff3b5c30',
            boxShadow: `0 4px 20px ${isGreen ? '#00ff8715' : '#ff3b5c15'}`,
          }}
        >
          <div className="p-2.5">
            <div className="mb-1.5 text-[9px] font-semibold text-text-primary sm:text-[10px]">
              {formatDate(modal.day.date)}
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[8px] uppercase tracking-[0.1em] text-text-muted sm:text-[9px]">Open</span>
                <span className="text-[9px] font-medium text-text-primary sm:text-[10px]">
                  {formatPrice(modal.day.open)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[8px] uppercase tracking-[0.1em] text-text-muted sm:text-[9px]">Close</span>
                <span className="text-[9px] font-medium text-text-primary sm:text-[10px]">
                  {formatPrice(modal.day.close)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-border-default/50 pt-1">
                <span className="text-[8px] uppercase tracking-[0.1em] text-text-muted sm:text-[9px]">Change</span>
                <span
                  className="text-[10px] font-bold sm:text-[11px]"
                  style={{ color: isGreen ? '#00ff87' : '#ff3b5c' }}
                >
                  {modal.day.pctChange >= 0 ? '+' : ''}{modal.day.pctChange.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
