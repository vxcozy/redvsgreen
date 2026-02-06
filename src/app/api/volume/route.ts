import { NextRequest, NextResponse } from 'next/server';

// ── CoinGecko free API for volume data ──────────────────────────
// Returns daily total volume in USD. Free tier supports up to 365 days.
// For ranges > 365 days we cap at 365 (shows the most recent year).

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3/coins';
const COINGECKO_IDS: Record<string, string> = {
  BTCUSDT: 'bitcoin',
  ETHUSDT: 'ethereum',
};
const MAX_FREE_DAYS = 365;

interface VolumePoint {
  date: string;
  volume: number;
  timestamp: number;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const symbol = searchParams.get('symbol') || 'BTCUSDT';
  const requestedDays = parseInt(searchParams.get('days') || '365', 10);

  const coinId = COINGECKO_IDS[symbol];
  if (!coinId) {
    return NextResponse.json(
      { error: `Unsupported symbol: ${symbol}` },
      { status: 400 },
    );
  }

  // Cap to free tier limit
  const days = Math.min(requestedDays >= 9999 ? MAX_FREE_DAYS : requestedDays, MAX_FREE_DAYS);

  try {
    const url = `${COINGECKO_BASE}/${coinId}/market_chart?vs_currency=usd&days=${days}`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `CoinGecko returned HTTP ${res.status}` },
        { status: res.status },
      );
    }

    const json = await res.json();
    const volumes: [number, number][] = json?.total_volumes;
    const prices: [number, number][] = json?.prices;

    if (!volumes || volumes.length === 0) {
      return NextResponse.json(
        { error: 'No volume data available' },
        { status: 404 },
      );
    }

    // Build a price lookup by day for open/close coloring
    const priceByDay = new Map<string, number>();
    if (prices) {
      for (const [ts, price] of prices) {
        const d = new Date(ts);
        const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
        priceByDay.set(key, price);
      }
    }

    // Deduplicate by day (keep last per day for most accurate daily close)
    const dayMap = new Map<string, VolumePoint>();
    for (const [ts, vol] of volumes) {
      const d = new Date(ts);
      const date = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
      dayMap.set(date, { date, volume: vol, timestamp: ts });
    }

    // Sort chronologically
    const result = Array.from(dayMap.values()).sort(
      (a, b) => a.timestamp - b.timestamp,
    );

    // Add price data for green/red coloring
    const enriched = result.map((point, i) => {
      const price = priceByDay.get(point.date) || 0;
      const prevPrice = i > 0 ? (priceByDay.get(result[i - 1].date) || price) : price;
      return {
        date: point.date,
        volume: point.volume,
        open: prevPrice,
        close: price,
      };
    });

    return NextResponse.json(enriched, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'X-Data-Source': 'coingecko',
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to fetch volume data', details: String(err) },
      { status: 500 },
    );
  }
}
