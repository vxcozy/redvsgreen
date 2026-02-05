'use client';

import { useMemo, useState } from 'react';
import { Streak } from '@/lib/types';

interface Props {
  streaks: Streak[];
}

export default function StreakTimeline({ streaks }: Props) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const totalDays = useMemo(
    () => streaks.reduce((sum, s) => sum + s.length, 0),
    [streaks]
  );

  if (streaks.length === 0) return null;

  return (
    <div className="rounded-lg border border-border-default bg-bg-card p-2 sm:p-4">
      <div className="mb-2 text-[9px] uppercase tracking-[0.15em] text-text-muted sm:mb-3 sm:text-[10px] sm:tracking-[0.2em]">
        Streak Timeline
      </div>
      <div className="relative">
        <div className="flex h-6 w-full overflow-hidden rounded-sm sm:h-8">
          {streaks.map((s, i) => {
            const widthPercent = (s.length / totalDays) * 100;
            const isGreen = s.type === 'green';
            const isHovered = hoveredIndex === i;

            return (
              <div
                key={`${s.startDate}-${i}`}
                className="relative cursor-pointer transition-opacity"
                style={{
                  width: `${Math.max(widthPercent, 0.2)}%`,
                  backgroundColor: isGreen
                    ? isHovered ? '#00ff87' : '#00ff8766'
                    : isHovered ? '#ff3b5c' : '#ff3b5c66',
                  opacity: hoveredIndex !== null && !isHovered ? 0.4 : 1,
                }}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            );
          })}
        </div>

        {hoveredIndex !== null && streaks[hoveredIndex] && (
          <div className="absolute -top-14 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-border-default bg-bg-tertiary px-2 py-1.5 shadow-xl sm:-top-16 sm:px-3 sm:py-2">
            <div className="flex items-center gap-1.5 text-[9px] sm:gap-2 sm:text-[11px]">
              <span
                className="font-bold"
                style={{ color: streaks[hoveredIndex].type === 'green' ? '#00ff87' : '#ff3b5c' }}
              >
                {streaks[hoveredIndex].length}d {streaks[hoveredIndex].type}
              </span>
              <span className="text-text-muted">|</span>
              <span style={{ color: streaks[hoveredIndex].type === 'green' ? '#00ff87' : '#ff3b5c' }}>
                {streaks[hoveredIndex].totalPercentChange >= 0 ? '+' : ''}
                {streaks[hoveredIndex].totalPercentChange.toFixed(2)}%
              </span>
              <span className="text-text-muted">|</span>
              <span className="text-text-muted">
                {streaks[hoveredIndex].startDate}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-0.5 flex justify-between sm:mt-1">
        <span className="text-[8px] text-text-muted sm:text-[9px]">
          {streaks[0]?.startDate}
        </span>
        <span className="text-[8px] text-text-muted sm:text-[9px]">
          {streaks[streaks.length - 1]?.endDate}
        </span>
      </div>
    </div>
  );
}
