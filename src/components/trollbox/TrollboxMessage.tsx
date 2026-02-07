'use client';

import UserAvatar from '@/components/ui/UserAvatar';
import type { TrollboxMessage as MessageType } from '@/hooks/usePusher';

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export default function TrollboxMessage({
  message,
  isOwn,
}: {
  message: MessageType;
  isOwn: boolean;
}) {
  return (
    <div className={`flex gap-2 px-3 py-1.5 ${isOwn ? 'bg-bg-tertiary/30' : ''}`}>
      <UserAvatar
        src={message.userImage}
        name={message.userName}
        size={20}
        className="mt-0.5 shrink-0"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1.5">
          <span className="truncate text-[10px] font-semibold text-accent">
            {message.userName}
          </span>
          <span className="shrink-0 text-[9px] text-text-muted">
            {timeAgo(message.createdAt)}
          </span>
        </div>
        <p className="break-words text-[11px] leading-relaxed text-text-secondary">
          {message.content}
        </p>
      </div>
    </div>
  );
}
