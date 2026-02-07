interface Props {
  label: string;
  value: string | number;
  subtext?: string;
  variant?: 'green' | 'red' | 'neutral';
}

export default function StatsCard({ label, value, subtext, variant = 'neutral' }: Props) {
  const colorStyle =
    variant === 'green'
      ? '#00ff87'
      : variant === 'red'
        ? '#ff3b5c'
        : '#e8ecf4';

  return (
    <div className="rounded-lg border border-border-default bg-bg-card p-3 sm:p-5">
      <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-text-secondary sm:mb-1 sm:text-[11px] sm:tracking-[0.2em]">
        {label}
      </div>
      <div className="text-lg font-bold font-[var(--font-display)] sm:text-2xl" style={{ color: colorStyle }}>
        {typeof value === 'number' ? value.toFixed(1) : value}
      </div>
      {subtext && (
        <div className="mt-0.5 text-[9px] text-text-muted sm:mt-1 sm:text-[10px]">{subtext}</div>
      )}
    </div>
  );
}
