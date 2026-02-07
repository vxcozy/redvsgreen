import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getPusher } from '@/lib/pusher';

// ─── Per-user rate limiting (1 message per 2 seconds) ────────────
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_MS = 2_000;

const MAX_MESSAGE_LENGTH = 500;

// Sanitize: strip control chars and trim.
// No HTML encoding needed — React JSX escapes all text content automatically.
// Belt-and-suspenders: strip anything that looks like an HTML tag.
function sanitize(text: string): string {
  return text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // strip control chars
    .replace(/<[^>]*>?/g, '')                             // strip HTML tags (including unclosed)
    .trim();
}

export async function POST(request: NextRequest) {
  // 1. CSRF check — verify request originates from our own domain
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (!origin || !host || new URL(origin).host !== host) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 2. Auth check
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 3. Rate limit per user
  const now = Date.now();
  const lastSent = rateLimitMap.get(session.user.id);
  if (lastSent && now - lastSent < RATE_LIMIT_MS) {
    return NextResponse.json(
      { error: 'Slow down! You can send 1 message every 2 seconds.' },
      { status: 429, headers: { 'Retry-After': '2' } },
    );
  }

  // 4. Parse and validate body
  let body: { content?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const rawContent = body.content;
  if (!rawContent || typeof rawContent !== 'string') {
    return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
  }

  const content = sanitize(rawContent);
  if (content.length === 0) {
    return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
  }
  if (content.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { error: `Message too long (max ${MAX_MESSAGE_LENGTH} characters)` },
      { status: 400 },
    );
  }

  // 5. Store in DB (rate limit updated AFTER success to avoid penalizing failed writes)
  const userName = (session.user.name || 'Anon').slice(0, 100); // M3: bound userName length
  const message = await prisma.message.create({
    data: {
      content,
      userId: session.user.id,
      userName,
      userImage: session.user.image || null,
    },
  });

  // 6. Update rate limit timestamp only after successful DB write
  rateLimitMap.set(session.user.id, now);

  // 7. Broadcast via Pusher
  const event = {
    id: message.id,
    content: message.content,
    userId: message.userId,
    userName: message.userName,
    userImage: message.userImage,
    createdAt: message.createdAt.toISOString(),
  };

  try {
    await getPusher().trigger('trollbox', 'new-message', event);
  } catch {
    // Pusher failure shouldn't break the response — message is already saved
  }

  return NextResponse.json(event, { status: 201 });
}
