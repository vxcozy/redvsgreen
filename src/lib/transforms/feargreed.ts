import { FearGreedEntry } from '../types';

interface RawFGEntry {
  value: string;
  value_classification: string;
  timestamp: string;
}

export function transformFearGreed(data: RawFGEntry[]): FearGreedEntry[] {
  return data.map((entry) => {
    const ts = parseInt(entry.timestamp, 10) * 1000;
    const d = new Date(ts);
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');

    return {
      value: parseInt(entry.value, 10),
      classification: entry.value_classification,
      timestamp: ts,
      date: `${yyyy}-${mm}-${dd}`,
    };
  });
}
