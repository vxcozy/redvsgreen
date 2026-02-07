import { NextRequest, NextResponse } from 'next/server';

// ─── Simple in-memory rate limiter ───────────────────────────
// Vercel serverless can restart at any time, so this isn't persistent,
// but it protects against burst abuse within a single instance.
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 60;  // 60 requests per minute per IP

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  entry.count++;
  return entry.count > MAX_REQUESTS;
}

// Periodically clean stale entries (every 5 minutes worth of calls)
let cleanupCounter = 0;
function maybeCleanup() {
  cleanupCounter++;
  if (cleanupCounter < 300) return;
  cleanupCounter = 0;
  const now = Date.now();
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(key);
  }
}

export function middleware(request: NextRequest) {
  // Only rate-limit API routes (skip auth routes — OAuth callbacks need free flow)
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }
  // Only exempt OAuth callback routes from rate limiting (they need free flow).
  // Other auth routes (signin, csrf, session) still get rate-limited.
  if (request.nextUrl.pathname.startsWith('/api/auth/callback')) {
    return NextResponse.next();
  }

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  maybeCleanup();

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': '60' } },
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
