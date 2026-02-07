import { NextResponse } from 'next/server';

const FNG_URL = 'https://api.alternative.me/fng/?limit=0&format=json';

export async function GET() {
  try {
    const res = await fetch(FNG_URL, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Data source temporarily unavailable' },
        { status: 502 }
      );
    }

    const data = await res.json();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch Fear & Greed data' },
      { status: 500 }
    );
  }
}
