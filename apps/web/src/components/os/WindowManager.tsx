'use client';

import { useWindowManagerStore } from '@/stores/windowManagerStore';
import { usePhoneOsStore } from '@/stores/phoneOsStore';
import { AnimatePresence } from 'framer-motion';
import { AppWindow } from './AppWindow';
import { MultitaskingView } from './MultitaskingView';

export function WindowManager() {
  const windows = useWindowManagerStore((s) => s.windows);
  const activeWindowId = useWindowManagerStore((s) => s.activeWindowId);
  const isMultitaskingOpen = usePhoneOsStore((s) => s.isMultitaskingOpen);
  const setMultitaskingOpen = usePhoneOsStore((s) => s.setMultitaskingOpen);

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

      <AnimatePresence>
        {isMultitaskingOpen && (
          <MultitaskingView onClose={() => setMultitaskingOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
