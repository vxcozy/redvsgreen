'use client';

import { StreakStats } from '@/lib/types';

interface Props {
  btcStats: StreakStats | null;
  ethStats: StreakStats | null;
}

export default function ComparisonChart({ btcStats, ethStats }: Props) {
  if (!btcStats || !ethStats) return null;

  const rows = [
    {
      label: 'Current Streak',
      btc: `${btcStats.currentStreak.length}d ${btcStats.currentStreak.type}`,
      eth: `${ethStats.currentStreak.length}d ${ethStats.currentStreak.type}`,
      btcColor: btcStats.currentStreak.type === 'green' ? '#00ff87' : '#ff3b5c',
      ethColor: ethStats.currentStreak.type === 'green' ? '#00ff87' : '#ff3b5c',
    },
    {
      label: 'Longest Green',
      btc: `${btcStats.longestGreen.length}d`,
      eth: `${ethStats.longestGreen.length}d`,
      btcColor: '#00ff87',
      ethColor: '#00ff87',
    },
    {
      label: 'Longest Red',
      btc: `${btcStats.longestRed.length}d`,
      eth: `${ethStats.longestRed.length}d`,
      btcColor: '#ff3b5c',
      ethColor: '#ff3b5c',
    },
    {
      label: 'Avg Green',
      btc: `${btcStats.avgGreenLength.toFixed(1)}d`,
      eth: `${ethStats.avgGreenLength.toFixed(1)}d`,
      btcColor: '#00ff87',
      ethColor: '#00ff87',
    },
    {
      label: 'Avg Red',
      btc: `${btcStats.avgRedLength.toFixed(1)}d`,
      eth: `${ethStats.avgRedLength.toFixed(1)}d`,
      btcColor: '#ff3b5c',
      ethColor: '#ff3b5c',
    },
    {
      label: 'Green Days',
      btc: `${btcStats.totalGreenDays}`,
      eth: `${ethStats.totalGreenDays}`,
      btcColor: '#e8ecf4',
      ethColor: '#e8ecf4',
    },
    {
      label: 'Red Days',
      btc: `${btcStats.totalRedDays}`,
      eth: `${ethStats.totalRedDays}`,
      btcColor: '#e8ecf4',
      ethColor: '#e8ecf4',
    },
  ];

  return (
    <div className="rounded-lg border border-border-default bg-bg-card p-2 sm:p-4">
      <div className="mb-2 text-[9px] uppercase tracking-[0.15em] text-text-muted sm:mb-3 sm:text-[10px] sm:tracking-[0.2em]">
        BTC vs ETH Comparison
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[9px] sm:text-[11px]">
          <thead>
            <tr className="border-b border-border-default">
              <th className="pb-2 text-left font-normal text-text-muted" />
              <th className="pb-2 text-right font-semibold" style={{ color: '#f7931a' }}>BTC</th>
              <th className="pb-2 text-right font-semibold" style={{ color: '#627eea' }}>ETH</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-border-default/50">
                <td className="py-2 text-text-muted">{row.label}</td>
                <td className="py-2 text-right font-medium" style={{ color: row.btcColor }}>
                  {row.btc}
                </td>
                <td className="py-2 text-right font-medium" style={{ color: row.ethColor }}>
                  {row.eth}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
