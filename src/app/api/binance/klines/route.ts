import { NextRequest, NextResponse } from 'next/server';

const BINANCE_ENDPOINTS = [
  'https://api.binance.us/api/v3/klines',
  'https://api.binance.com/api/v3/klines',
];
const MAX_LIMIT = 1000;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const symbol = searchParams.get('symbol') || 'BTCUSDT';
  const interval = searchParams.get('interval') || '1d';
  const days = parseInt(searchParams.get('days') || '365', 10);

  try {
    const now = Date.now();
    const msPerDay = 86400000;
    const startTime = days >= 9999
      ? new Date('2017-08-17').getTime()
      : now - days * msPerDay;

    const allKlines: unknown[] = [];
    let currentStart = startTime;

    // Find a working endpoint
    let baseUrl = '';
    for (const endpoint of BINANCE_ENDPOINTS) {
      try {
        const testUrl = `${endpoint}?symbol=${symbol}&interval=${interval}&limit=1`;
        const testRes = await fetch(testUrl);
        if (testRes.ok) {
          baseUrl = endpoint;
          break;
        }
      } catch {
        continue;
      }
    }

    if (!baseUrl) {
      return NextResponse.json(
        { error: 'All Binance API endpoints unavailable' },
        { status: 503 }
      );
    }

    while (currentStart < now) {
      const url = new URL(baseUrl);
      url.searchParams.set('symbol', symbol);
      url.searchParams.set('interval', interval);
      url.searchParams.set('startTime', String(currentStart));
      url.searchParams.set('limit', String(MAX_LIMIT));

      const res = await fetch(url.toString(), {
        next: { revalidate: 300 },
      });

      if (!res.ok) {
        const errText = await res.text();
        return NextResponse.json(
          { error: `Binance API error: ${res.status}`, details: errText },
          { status: res.status }
        );
      }

      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) break;

      allKlines.push(...data);

      const lastCloseTime = data[data.length - 1][6] as number;
      currentStart = lastCloseTime + 1;

      if (data.length < MAX_LIMIT) break;
    }

    return NextResponse.json(allKlines, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to fetch kline data', details: String(err) },
      { status: 500 }
    );
  }
}
