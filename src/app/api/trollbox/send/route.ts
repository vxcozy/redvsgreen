import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getPusher } from '@/lib/pusher';

// ─── Per-user rate limiting (1 message per 2 seconds) ────────────
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_MS = 2_000;

const MAX_MESSAGE_LENGTH = 500;

// Strip HTML tags to prevent XSS (messages rendered as plain text anyway)
function sanitize(text: string): string {
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .trim();
}

export async function POST(request: NextRequest) {
  // 1. Auth check
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Rate limit per user
  const now = Date.now();
  const lastSent = rateLimitMap.get(session.user.id);
  if (lastSent && now - lastSent < RATE_LIMIT_MS) {
    return NextResponse.json(
      { error: 'Slow down! You can send 1 message every 2 seconds.' },
      { status: 429, headers: { 'Retry-After': '2' } },
    );
  }

  // 3. Parse and validate body
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

  // 4. Update rate limit timestamp
  rateLimitMap.set(session.user.id, now);

  // 5. Store in DB
  const message = await prisma.message.create({
    data: {
      content,
      userId: session.user.id,
      userName: session.user.name || 'Anon',
      userImage: session.user.image || null,
    },
  });

  // 6. Broadcast via Pusher
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
