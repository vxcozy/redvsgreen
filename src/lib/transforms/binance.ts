import { BinanceKlineRaw, OHLCV } from '../types';

export function transformKlines(raw: BinanceKlineRaw[]): OHLCV[] {
  return raw.map((k) => {
    const openTime = k[0];
    const date = new Date(openTime);
    const yyyy = date.getUTCFullYear();
    const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(date.getUTCDate()).padStart(2, '0');

    return {
      time: Math.floor(openTime / 1000),
      date: `${yyyy}-${mm}-${dd}`,
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5]),
      quoteVolume: parseFloat(k[7]),
      trades: k[8],
    };
  });
}
