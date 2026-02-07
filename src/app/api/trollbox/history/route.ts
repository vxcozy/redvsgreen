import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Public endpoint — anyone can read the last 50 messages
const MAX_MESSAGES = 50;

export async function GET() {
  const messages = await prisma.message.findMany({
    orderBy: { createdAt: 'desc' },
    take: MAX_MESSAGES,
    select: {
      id: true,
      content: true,
      userId: true,
      userName: true,
      userImage: true,
      createdAt: true,
    },
  });

  // Return in chronological order (oldest first)
  messages.reverse();

  return NextResponse.json(messages, {
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}
