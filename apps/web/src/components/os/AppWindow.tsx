'use client';

import { motion } from 'framer-motion';
import type { WindowState } from '@/types';
import { useWindowManagerStore } from '@/stores/windowManagerStore';
import { getAppComponent } from '@/services/appRouter';
import { AppPlaceholder } from './AppPlaceholder';
import { useHaptic } from '@/hooks/useSound';
import { useAppLaunch } from '@/hooks/useAppLaunch';

interface AppWindowProps {
  window: WindowState;
  isActive: boolean;
}

export function AppWindow({ window, isActive }: AppWindowProps) {
  const { closeWindow, minimizeWindow, focusWindow } = useWindowManagerStore();
  const { backgroundApp, stopApp } = useAppLaunch();
  const { tap } = useHaptic();

  const AppComponent = getAppComponent(window.appId) ?? AppPlaceholder;

  return (
    <motion.div
      className="absolute inset-0 z-[35] flex flex-col bg-black rounded-none overflow-hidden"
      initial={{ y: '100%', opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: '100%', opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 35 }}
      style={{ zIndex: window.zIndex }}
      onClick={() => !isActive && focusWindow(window.id)}
    >
      <div className="flex items-center justify-between px-4 pt-12 pb-2 bg-black/80 backdrop-blur-xl border-b border-white/5">
        <button
          onClick={() => { tap(); backgroundApp(window.appId); minimizeWindow(window.id); }}
          className="text-gulf-gold text-sm font-medium"
        >
          ‹ Back
        </button>
        <h1 className="text-sm font-semibold text-white">{window.title}</h1>
        <button
          onClick={() => { tap(); stopApp(window.appId); closeWindow(window.id); }}
          className="text-white/50 text-sm"
          aria-label="Close app"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        <AppComponent appId={window.appId} appName={window.title} />
      </div>

      <div className="flex justify-center py-2 bg-black/80">
        <div className="w-32 h-1 rounded-full bg-white/30" />
      </div>
    </motion.div>
  );
}
