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

export interface IVTermStructurePoint {
  daysToExpiry: number;
  iv: number;
  expiryLabel: string;
  sampleCount: number;
}

export interface IVTermStructureData {
  points: IVTermStructurePoint[];
  spotPrice: number;
  currency: string;
}

function parseExpiry(instrumentName: string): Date | null {
  const parts = instrumentName.split('-');
  if (parts.length < 4) return null;
  const dateStr = parts[1];

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

const ALLOWED_CURRENCIES = new Set(['BTC', 'ETH']);

export async function GET(req: NextRequest) {
  const currency = req.nextUrl.searchParams.get('currency') || 'BTC';

  if (!ALLOWED_CURRENCIES.has(currency)) {
    return NextResponse.json({ error: 'Invalid currency' }, { status: 400 });
  }

  try {
    const url = `https://www.deribit.com/api/v2/public/get_book_summary_by_currency?currency=${currency}&kind=option`;
    const resp = await fetch(url, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 300 },
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
      return NextResponse.json({ error: 'No options data available' }, { status: 404 });
    }

    const spotPrice = instruments[0]?.underlying_price || 0;
    const now = new Date();

    // Group near-ATM calls by expiry (moneyness 0.9-1.1)
    const expiryMap = new Map<
      string,
      { totalIV: number; count: number; daysToExpiry: number; label: string }
    >();

    for (const inst of instruments) {
      if (!inst.instrument_name.endsWith('-C')) continue;
      if (inst.mark_iv <= 0 || inst.mark_iv > 500) continue;

      const strike = parseStrike(inst.instrument_name);
      const expiry = parseExpiry(inst.instrument_name);
      if (!strike || !expiry) continue;

      const moneyness = strike / spotPrice;
      if (moneyness < 0.9 || moneyness > 1.1) continue;

      const daysToExpiry = Math.max(
        1,
        Math.round((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      );
      if (daysToExpiry > 365) continue;

      const expiryLabel = `${expiry.getDate()}${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][expiry.getMonth()]}${String(expiry.getFullYear()).slice(2)}`;

      const existing = expiryMap.get(expiryLabel);
      if (existing) {
        existing.totalIV += inst.mark_iv;
        existing.count += 1;
      } else {
        expiryMap.set(expiryLabel, {
          totalIV: inst.mark_iv,
          count: 1,
          daysToExpiry,
          label: expiryLabel,
        });
      }
    }

    const points: IVTermStructurePoint[] = Array.from(expiryMap.values())
      .map((e) => ({
        daysToExpiry: e.daysToExpiry,
        iv: parseFloat((e.totalIV / e.count).toFixed(2)),
        expiryLabel: e.label,
        sampleCount: e.count,
      }))
      .sort((a, b) => a.daysToExpiry - b.daysToExpiry);

    const data: IVTermStructureData = { points, spotPrice, currency };

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch IV term structure data' },
      { status: 500 },
    );
  }
}
