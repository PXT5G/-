'use client';

import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useWindowManagerStore } from '@/stores/windowManagerStore';
import { AppWindow } from './AppWindow';
import { MultitaskingView } from './MultitaskingView';

export function WindowManager() {
  const windows = useWindowManagerStore((s) => s.windows);
  const activeWindowId = useWindowManagerStore((s) => s.activeWindowId);
  const [showMultitasking, setShowMultitasking] = useState(false);

  const openWindows = windows.filter((w) => !w.isMinimized);

  return (
    <>
      <AnimatePresence>
        {openWindows.map((window) => (
          <AppWindow
            key={window.id}
            window={window}
            isActive={window.id === activeWindowId}
          />
        ))}
      </AnimatePresence>

      {showMultitasking && (
        <MultitaskingView onClose={() => setShowMultitasking(false)} />
      )}
    </>
  );
}
