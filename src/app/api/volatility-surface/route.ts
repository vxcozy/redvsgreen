import { NextRequest, NextResponse } from 'next/server';

interface DeribitInstrument {
  instrument_name: string;
  mark_iv: number;
  underlying_price: number;
  bid_price: number;
  ask_price: number;
  mid_price: number;
  volume: number;
}

interface DeribitResponse {
  result: DeribitInstrument[];
}

interface VolSurfacePoint {
  strike: number;
  moneyness: number;
  daysToExpiry: number;
  expiryLabel: string;
  iv: number;
}

export interface VolSurfaceData {
  points: VolSurfacePoint[];
  strikes: number[];
  expiries: string[];
  spotPrice: number;
  currency: string;
}

function parseExpiry(instrumentName: string): Date | null {
  // e.g. BTC-27JUN25-100000-C
  const parts = instrumentName.split('-');
  if (parts.length < 4) return null;
  const dateStr = parts[1]; // e.g. "27JUN25"

  const dayStr = dateStr.slice(0, dateStr.length - 5);
  const monStr = dateStr.slice(dateStr.length - 5, dateStr.length - 2);
  const yrStr = dateStr.slice(dateStr.length - 2);

  const months: Record<string, number> = {
    JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
    JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
  };

  const month = months[monStr];
  if (month === undefined) return null;

  const year = 2000 + parseInt(yrStr, 10);
  const day = parseInt(dayStr, 10);

  return new Date(year, month, day);
}

function parseStrike(instrumentName: string): number | null {
  const parts = instrumentName.split('-');
  if (parts.length < 4) return null;
  return parseFloat(parts[2]);
}

export async function GET(req: NextRequest) {
  const currency = req.nextUrl.searchParams.get('currency') || 'BTC';

  try {
    const url = `https://www.deribit.com/api/v2/public/get_book_summary_by_currency?currency=${currency}&kind=option`;
    const resp = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 300 }, // cache 5 minutes
    });

    if (!resp.ok) {
      return NextResponse.json(
        { error: `Deribit API error: ${resp.status}` },
        { status: resp.status },
      );
    }

    const json: DeribitResponse = await resp.json();
    const instruments = json.result;

    if (!instruments || instruments.length === 0) {
      return NextResponse.json(
        { error: 'No options data available' },
        { status: 404 },
      );
    }

    // Get spot price from first instrument
    const spotPrice = instruments[0]?.underlying_price || 0;
    const now = new Date();

    const points: VolSurfacePoint[] = [];
    const strikeSet = new Set<number>();
    const expirySet = new Set<string>();

    for (const inst of instruments) {
      // Only use calls to avoid double-counting
      if (!inst.instrument_name.endsWith('-C')) continue;
      if (inst.mark_iv <= 0 || inst.mark_iv > 500) continue;
      if (inst.volume <= 0 && inst.mid_price <= 0) continue;

      const expiry = parseExpiry(inst.instrument_name);
      const strike = parseStrike(inst.instrument_name);

      if (!expiry || !strike) continue;

      const daysToExpiry = Math.max(
        1,
        Math.round((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      );

      // Filter: only include reasonable moneyness range (50% to 200% of spot)
      const moneyness = strike / spotPrice;
      if (moneyness < 0.5 || moneyness > 2.0) continue;

      // Only include expirations within ~1 year
      if (daysToExpiry > 365) continue;

      const expiryLabel = `${expiry.getDate()}${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][expiry.getMonth()]}${String(expiry.getFullYear()).slice(2)}`;

      strikeSet.add(strike);
      expirySet.add(expiryLabel);

      points.push({
        strike,
        moneyness: parseFloat(moneyness.toFixed(3)),
        daysToExpiry,
        expiryLabel,
        iv: parseFloat(inst.mark_iv.toFixed(2)),
      });
    }

    // Sort
    const sortedStrikes = Array.from(strikeSet).sort((a, b) => a - b);
    const sortedExpiries = Array.from(expirySet);

    const data: VolSurfaceData = {
      points,
      strikes: sortedStrikes,
      expiries: sortedExpiries,
      spotPrice,
      currency,
    };

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (err) {
    console.error('Volatility surface error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch options data' },
      { status: 500 },
    );
  }
}
