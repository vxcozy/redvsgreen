import { Streak } from '@/lib/types';

interface Props {
  title: string;
  streaks: Streak[];
  variant: 'green' | 'red';
}

export default function StreakRecordCard({ title, streaks, variant }: Props) {
  const color = variant === 'green' ? '#00ff87' : '#ff3b5c';
  const dimBg = variant === 'green' ? 'bg-green-muted' : 'bg-red-muted';

  return (
    <div className="rounded-lg border border-border-default bg-bg-card p-3 sm:p-5">
      <h3 className="mb-2 text-[9px] uppercase tracking-[0.15em] text-text-muted sm:mb-3 sm:text-[10px] sm:tracking-[0.2em]">
        {title}
      </h3>
      <div className="space-y-1.5 sm:space-y-2">
        {streaks.slice(0, 5).map((s, i) => (
          <div
            key={`${s.startDate}-${s.endDate}`}
            className={`flex items-center justify-between rounded px-2 py-1 sm:px-3 sm:py-1.5 ${dimBg}`}
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-[10px] font-bold font-[var(--font-display)] w-5 text-right sm:text-xs sm:w-6" style={{ color }}>
                {i + 1}.
              </span>
              <span className="text-xs font-bold font-[var(--font-display)] sm:text-sm" style={{ color }}>
                {s.length}d
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-[9px] font-medium sm:text-[11px]" style={{ color }}>
                {s.totalPercentChange >= 0 ? '+' : ''}
                {s.totalPercentChange.toFixed(1)}%
              </span>
              <span className="hidden text-[10px] text-text-muted sm:inline">
                {s.startDate}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
