import { NextRequest, NextResponse } from 'next/server';

// ── Binance Global (primary) ─────────────────────────────────────
// Binance.com works from Vercel's non-US servers. If geo-blocked
// (HTTP 451 from US IPs during local dev) we fall through to
// DeFiLlama as the fallback. Binance US is removed entirely due
// to persistent bad-wick data.
const BINANCE_GLOBAL = 'https://api.binance.com/api/v3/klines';
const MAX_LIMIT = 1000;

// ── DeFiLlama (fallback) ─────────────────────────────────────────
// Returns daily close prices. We synthesise OHLC from consecutive
// closes: open = prev close, high/low = max/min(open,close).
// Paginated in chunks of 500 to avoid 504 timeouts.
const DEFILLAMA_BASE = 'https://coins.llama.fi/chart';
const DEFILLAMA_IDS: Record<string, string> = {
  BTCUSDT: 'coingecko:bitcoin',
  ETHUSDT: 'coingecko:ethereum',
};
const DEFILLAMA_SPAN = 500; // safe chunk size

// ── Helpers ──────────────────────────────────────────────────────

async function fetchBinanceGlobal(
  symbol: string,
  interval: string,
  startTime: number,
  now: number,
): Promise<unknown[] | null> {
  // Quick probe
  try {
    const probe = await fetch(
      `${BINANCE_GLOBAL}?symbol=${symbol}&interval=${interval}&limit=1`,
      { signal: AbortSignal.timeout(5000) },
    );
    if (!probe.ok) return null;
  } catch {
    return null;
  }

  const allKlines: unknown[] = [];
  let currentStart = startTime;
  let pages = 0;

  while (currentStart < now && pages < MAX_PAGES) {
    pages++;
    const url = new URL(BINANCE_GLOBAL);
    url.searchParams.set('symbol', symbol);
    url.searchParams.set('interval', interval);
    url.searchParams.set('startTime', String(currentStart));
    url.searchParams.set('limit', String(MAX_LIMIT));

    const res = await fetch(url.toString(), {
      next: { revalidate: 300 },
    });

    if (!res.ok) return null; // bail to fallback

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) break;

    allKlines.push(...data);

    const lastCloseTime = data[data.length - 1][6] as number;
    currentStart = lastCloseTime + 1;

    if (data.length < MAX_LIMIT) break;
  }

  return allKlines;
}

interface DefiLlamaPrice {
  timestamp: number;
  price: number;
}

async function fetchDeFiLlama(
  symbol: string,
  startTime: number,
  now: number,
): Promise<unknown[] | null> {
  const coinId = DEFILLAMA_IDS[symbol];
  if (!coinId) return null;

  const startSec = Math.floor(startTime / 1000);
  let currentStart = startSec;
  const endSec = Math.floor(now / 1000);
  const allPrices: DefiLlamaPrice[] = [];
  let pages = 0;

  // Paginate in chunks
  while (currentStart < endSec && pages < MAX_PAGES) {
    pages++;
    const url = `${DEFILLAMA_BASE}/${coinId}?start=${currentStart}&span=${DEFILLAMA_SPAN}&period=1d&searchWidth=600`;

    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) return null;

      const json = await res.json();
      const coins = json?.coins;
      if (!coins) return null;

      const coinData = coins[coinId];
      if (!coinData?.prices || coinData.prices.length === 0) break;

      const prices: DefiLlamaPrice[] = coinData.prices;
      allPrices.push(...prices);

      // Next page starts after the last timestamp
      const lastTs = prices[prices.length - 1].timestamp;
      if (lastTs <= currentStart) break; // no progress, stop
      currentStart = lastTs + 86400; // +1 day

      // DeFiLlama returns fewer results than span requested (e.g. 398 for span=500).
      // Only stop if we got very few results, indicating we've truly reached the end.
      if (prices.length < 10) break;
    } catch {
      return null;
    }
  }

  if (allPrices.length === 0) return null;

  // Deduplicate by date (keep first occurrence per day)
  const seen = new Set<string>();
  const unique: DefiLlamaPrice[] = [];
  for (const p of allPrices) {
    const d = new Date(p.timestamp * 1000);
    const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(p);
    }
  }

  // Sort chronologically
  unique.sort((a, b) => a.timestamp - b.timestamp);

  // Synthesise Binance-compatible kline arrays from daily closes.
  // Format: [openTime, open, high, low, close, volume, closeTime,
  //          quoteVol, trades, takerBuyBase, takerBuyQuote, ignore]
  const klines: unknown[] = [];
  for (let i = 0; i < unique.length; i++) {
    const close = unique[i].price;
    const openTime = unique[i].timestamp * 1000;
    const closeTime = openTime + 86400000 - 1;
    const open = i > 0 ? unique[i - 1].price : close;
    const high = Math.max(open, close);
    const low = Math.min(open, close);

    klines.push([
      openTime,           // [0] Open time
      String(open),       // [1] Open
      String(high),       // [2] High
      String(low),        // [3] Low
      String(close),      // [4] Close
      '0',                // [5] Volume (not available)
      closeTime,          // [6] Close time
      '0',                // [7] Quote volume
      0,                  // [8] Trades
      '0',                // [9] Taker buy base
      '0',                // [10] Taker buy quote
      '0',                // [11] Ignore
    ]);
  }

  return klines;
}

// ── Input validation ────────────────────────────────────────────
const ALLOWED_SYMBOLS = new Set(['BTCUSDT', 'ETHUSDT']);
const ALLOWED_INTERVALS = new Set(['1d', '1h', '4h', '1w']);
const MAX_PAGES = 15; // Cap pagination loops to prevent amplification

// ── Route handler ────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const symbol = searchParams.get('symbol') || 'BTCUSDT';
  const interval = searchParams.get('interval') || '1d';
  const days = parseInt(searchParams.get('days') || '365', 10);

  if (!ALLOWED_SYMBOLS.has(symbol)) {
    return NextResponse.json({ error: 'Invalid symbol' }, { status: 400 });
  }
  if (!ALLOWED_INTERVALS.has(interval)) {
    return NextResponse.json({ error: 'Invalid interval' }, { status: 400 });
  }

  try {
    const now = Date.now();
    const msPerDay = 86400000;
    const startTime =
      days >= 9999
        ? new Date('2017-08-17').getTime()
        : now - days * msPerDay;

    // 1. Try Binance Global (best quality OHLCV data)
    const binanceData = await fetchBinanceGlobal(symbol, interval, startTime, now);
    if (binanceData && binanceData.length > 0) {
      return NextResponse.json(binanceData, {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      });
    }

    // 2. Fallback: DeFiLlama (daily close prices, synthesised OHLC)
    const llamaData = await fetchDeFiLlama(symbol, startTime, now);
    if (llamaData && llamaData.length > 0) {
      return NextResponse.json(llamaData, {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      });
    }

    return NextResponse.json(
      { error: 'All data sources unavailable (Binance Global + DeFiLlama)' },
      { status: 503 },
    );
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to fetch kline data' },
      { status: 500 },
    );
  }
}
