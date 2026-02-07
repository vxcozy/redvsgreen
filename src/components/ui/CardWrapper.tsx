'use client';

import { useState, useCallback, ReactNode } from 'react';
import { useDragControls } from 'framer-motion';
import FullscreenOverlay from './FullscreenOverlay';
import type { CardSize } from '@/lib/constants';

interface Props {
  children: ReactNode;
  size: CardSize;
  onSizeChange: (size: CardSize) => void;
  dragControls: ReturnType<typeof useDragControls>;
  /** If true, hide the drag handle (for non-draggable context like fullscreen) */
  hideDragHandle?: boolean;
  /** Move card up in order */
  onMoveUp?: () => void;
  /** Move card down in order */
  onMoveDown?: () => void;
  /** Is this the first card in the list? */
  isFirst?: boolean;
  /** Is this the last card in the list? */
  isLast?: boolean;
}

const SIZE_LABELS: CardSize[] = ['S', 'M', 'L'];

export function getCardHeightClass(size: CardSize): string {
  switch (size) {
    case 'S':
      return '[&_.chart-container]:min-h-[180px] [&_.chart-container]:sm:min-h-[220px]';
    case 'M':
      return '[&_.chart-container]:min-h-[320px] [&_.chart-container]:sm:min-h-[400px]';
    case 'L':
      return '[&_.chart-container]:min-h-[450px] [&_.chart-container]:sm:min-h-[560px]';
    default:
      return '';
  }
}

export default function CardWrapper({
  children,
  size,
  onSizeChange,
  dragControls,
  hideDragHandle,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: Props) {
  const [fullscreen, setFullscreen] = useState(false);

  const openFullscreen = useCallback(() => setFullscreen(true), []);
  const closeFullscreen = useCallback(() => setFullscreen(false), []);

  return (
    <>
      <div className={`group relative h-full ${getCardHeightClass(size)}`}>
        {/* Toolbar — visible on hover */}
        <div className="absolute -top-0 right-0 z-10 flex items-center gap-0.5 rounded-bl-md rounded-tr-lg bg-bg-tertiary/90 px-1.5 py-0.5 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
          {/* Move up */}
          {onMoveUp && !isFirst && (
            <button
              onClick={onMoveUp}
              className="p-1 text-text-muted hover:text-text-primary"
              aria-label="Move card up"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 8L6 4L10 8" />
              </svg>
            </button>
          )}

          {/* Move down */}
          {onMoveDown && !isLast && (
            <button
              onClick={onMoveDown}
              className="p-1 text-text-muted hover:text-text-primary"
              aria-label="Move card down"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 4L6 8L10 4" />
              </svg>
            </button>
          )}

          {/* Drag handle */}
          {!hideDragHandle && (
            <button
              className="cursor-grab touch-none p-1 text-text-muted hover:text-text-primary active:cursor-grabbing"
              onPointerDown={(e) => dragControls.start(e)}
              aria-label="Drag to reorder"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                <circle cx="3" cy="2" r="1" />
                <circle cx="3" cy="6" r="1" />
                <circle cx="3" cy="10" r="1" />
                <circle cx="9" cy="2" r="1" />
                <circle cx="9" cy="6" r="1" />
                <circle cx="9" cy="10" r="1" />
              </svg>
            </button>
          )}

          {/* Size presets */}
          <div className="flex items-center gap-px rounded border border-border-default/50 bg-bg-card/50">
            {SIZE_LABELS.map((s) => (
              <button
                key={s}
                onClick={() => onSizeChange(s)}
                className={`px-1.5 py-0.5 text-[8px] font-medium transition-colors ${
                  size === s
                    ? 'bg-accent/15 text-accent'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Fullscreen toggle */}
          <button
            onClick={openFullscreen}
            className="p-1 text-text-muted hover:text-text-primary"
            aria-label="Fullscreen"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2">
              <path d="M1 4V1h3M8 1h3v3M11 8v3H8M4 11H1V8" />
            </svg>
          </button>
        </div>

        {/* Card content */}
        <div className="h-full" onPointerDownCapture={(e) => {
          // Prevent drag from starting inside chart content
          const target = e.target as HTMLElement;
          if (target.closest('canvas') || target.closest('.recharts-wrapper') || target.closest('.chart-container')) {
            e.stopPropagation();
          }
        }}>
          {children}
        </div>
      </div>

      {/* Fullscreen portal */}
      <FullscreenOverlay open={fullscreen} onClose={closeFullscreen}>
        <div className="[&_.chart-container]:min-h-[70vh]">
          {children}
        </div>
      </FullscreenOverlay>
    </>
  );
}
