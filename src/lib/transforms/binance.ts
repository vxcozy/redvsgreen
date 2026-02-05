import { BinanceKlineRaw, OHLCV } from '../types';

// Max allowed deviation of high/low from the open-close range.
// Binance US has known bad wicks (e.g. $138k spike on 2023-06-21 when
// BTC was ~$30k). A wick >50% beyond the open/close body is clamped.
const MAX_WICK_RATIO = 1.5;

export function transformKlines(raw: BinanceKlineRaw[]): OHLCV[] {
  return raw.map((k) => {
    const openTime = k[0];
    const date = new Date(openTime);
    const yyyy = date.getUTCFullYear();
    const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(date.getUTCDate()).padStart(2, '0');

    const open = parseFloat(k[1]);
    let high = parseFloat(k[2]);
    let low = parseFloat(k[3]);
    const close = parseFloat(k[4]);

    // Sanity filter: clamp bad wicks from exchange data issues
    const bodyHigh = Math.max(open, close);
    const bodyLow = Math.min(open, close);
    const maxHigh = bodyHigh * MAX_WICK_RATIO;
    const minLow = bodyLow / MAX_WICK_RATIO;

    if (high > maxHigh) high = bodyHigh;
    if (low < minLow) low = bodyLow;

    return {
      time: Math.floor(openTime / 1000),
      date: `${yyyy}-${mm}-${dd}`,
      open,
      high,
      low,
      close,
      volume: parseFloat(k[5]),
      quoteVolume: parseFloat(k[7]),
      trades: k[8],
    };
  });
}
