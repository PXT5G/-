'use client';

import { useCallback, useRef } from 'react';
import { useHapticStore } from '@/stores/hapticStore';

interface GestureHandlers {
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onLongPress?: () => void;
  onPinch?: (scale: number) => void;
}

const SWIPE_THRESHOLD = 50;
const LONG_PRESS_DURATION = 500;

export function useGestures(handlers: GestureHandlers) {
  const haptic = useHapticStore((s) => s.trigger);
  const startPos = useRef({ x: 0, y: 0 });
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      startPos.current = { x: touch.clientX, y: touch.clientY };

      if (handlers.onLongPress) {
        longPressTimer.current = setTimeout(() => {
          haptic('medium');
          handlers.onLongPress?.();
        }, LONG_PRESS_DURATION);
      }
    },
    [handlers, haptic]
  );

  const onTouchMove = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const processGestureEnd = useCallback(
    (clientX: number, clientY: number) => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }

      const deltaX = clientX - startPos.current.x;
      const deltaY = clientY - startPos.current.y;

      if (Math.abs(deltaX) < SWIPE_THRESHOLD && Math.abs(deltaY) < SWIPE_THRESHOLD) {
        return;
      }

      haptic('light');

      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        if (deltaY < -SWIPE_THRESHOLD) handlers.onSwipeUp?.();
        else if (deltaY > SWIPE_THRESHOLD) handlers.onSwipeDown?.();
      } else {
        if (deltaX < -SWIPE_THRESHOLD) handlers.onSwipeLeft?.();
        else if (deltaX > SWIPE_THRESHOLD) handlers.onSwipeRight?.();
      }
    },
    [handlers, haptic]
  );

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      startPos.current = { x: e.clientX, y: e.clientY };
      if (handlers.onLongPress) {
        longPressTimer.current = setTimeout(() => {
          haptic('medium');
          handlers.onLongPress?.();
        }, LONG_PRESS_DURATION);
      }
    },
    [handlers, haptic]
  );

  const onMouseUp = useCallback(
    (e: React.MouseEvent) => {
      processGestureEnd(e.clientX, e.clientY);
    },
    [processGestureEnd]
  );

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.changedTouches[0];
      processGestureEnd(touch.clientX, touch.clientY);
    },
    [processGestureEnd]
  );

  return { onTouchStart, onTouchEnd, onTouchMove, onMouseDown, onMouseUp };
}
