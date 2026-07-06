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

/**
 * Fullscreen app container with native iOS chrome:
 * icon-zoom open transition, UINavigationBar, overlaid home indicator.
 */
export function AppWindow({ window, isActive }: AppWindowProps) {
  const { closeWindow, minimizeWindow, focusWindow } = useWindowManagerStore();
  const { backgroundApp, stopApp } = useAppLaunch();
  const { tap } = useHaptic();

  const AppComponent = getAppComponent(window.appId) ?? AppPlaceholder;

  return (
    <motion.div
      className="absolute inset-0 z-[35] flex flex-col bg-black overflow-hidden"
      initial={{ scale: 0.4, opacity: 0, borderRadius: 44 }}
      animate={{ scale: 1, opacity: 1, borderRadius: 0 }}
      exit={{ scale: 0.4, opacity: 0, borderRadius: 44 }}
      transition={{ type: 'spring', stiffness: 380, damping: 34, mass: 0.9 }}
      style={{ zIndex: window.zIndex, transformOrigin: '50% 62%' }}
      onClick={() => !isActive && focusWindow(window.id)}
    >
      {/* UINavigationBar — 54pt safe area + 44pt bar */}
      <div className="ios-material-chrome border-b border-[rgba(84,84,88,0.35)]">
        <div className="h-[54px]" />
        <div className="relative h-[44px] flex items-center px-2">
          <button
            onClick={() => { tap(); backgroundApp(window.appId); minimizeWindow(window.id); }}
            className="flex items-center gap-[2px] text-gulf-gold px-2 h-full active:opacity-50 transition-opacity"
            aria-label="Back"
          >
            <svg width="12" height="20" viewBox="0 0 12 20" fill="none" aria-hidden>
              <path d="M10.5 1.5L2 10l8.5 8.5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[17px] leading-none">Back</span>
          </button>
          <h1 className="absolute left-1/2 -translate-x-1/2 text-[17px] font-semibold text-white font-display max-w-[55%] truncate">
            {window.title}
          </h1>
          <button
            onClick={() => { tap(); stopApp(window.appId); closeWindow(window.id); }}
            className="ml-auto w-[30px] h-[30px] mr-2 rounded-full bg-ios-fill-tertiary flex items-center justify-center text-white/80 active:opacity-50 transition-opacity"
            aria-label="Close app"
          >
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden>
              <path d="M1 1l9 9M10 1l-9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        <AppComponent appId={window.appId} appName={window.title} />
        {/* Home indicator — overlaid, iOS style */}
        <div className="absolute bottom-[9px] left-1/2 -translate-x-1/2 w-[148px] h-[5px] rounded-full bg-white/60 pointer-events-none z-10" />
      </div>
    </motion.div>
  );
}
