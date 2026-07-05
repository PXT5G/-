'use client';

import { motion } from 'framer-motion';
import { useWindowManagerStore } from '@/stores/windowManagerStore';
import { usePhoneOsStore } from '@/stores/phoneOsStore';
import { usePremiumExperienceStore } from '@/stores/premiumExperienceStore';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { phoneOsService } from '@/services/phoneOsService';
import { useHaptic } from '@/hooks/useSound';
import { cn } from '@/utils/cn';

interface MultitaskingViewProps {
  onClose: () => void;
}

export function MultitaskingView({ onClose }: MultitaskingViewProps) {
  const { windows, focusWindow, closeWindow } = useWindowManagerStore();
  const performance = usePhoneOsStore((s) => s.performance);
  const profile = usePremiumExperienceStore((s) => s.profile);
  const { tap } = useHaptic();
  const openWindows = windows.filter((w) => !w.isMinimized);
  const mode = profile?.multitaskingMode ?? 'cards';
  const pinnedApps = new Set(profile?.pinnedApps ?? []);
  const lockedApps = new Set(profile?.lockedApps ?? []);

  const backgroundApps = performance?.backgroundApps ?? [];

  const handleForceClose = async (bundleId: string, windowId: string) => {
    tap();
    try {
      await phoneOsService.freezeBackgroundApp(bundleId);
    } catch { /* offline */ }
    closeWindow(windowId);
  };

  const layoutClass =
    mode === 'grid'
      ? 'grid grid-cols-2 gap-4'
      : mode === 'horizontal'
        ? 'flex gap-4 overflow-x-auto pb-2'
        : 'grid grid-cols-2 gap-4';

  return (
    <motion.div
      className="absolute inset-0 z-[48] bg-black/80 backdrop-blur-xl p-4 pt-14"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 35 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white">Recent Apps</h2>
        <button onClick={onClose} className="text-sm text-gulf-gold">Done</button>
      </div>

      {performance && (
        <div className="mb-4 grid grid-cols-4 gap-2 text-xs text-white/50">
          <span>CPU {performance.cpuUsagePercent}%</span>
          <span>GPU {performance.gpuUsagePercent}%</span>
          <span>RAM {Math.round(performance.memoryPressure * 100)}%</span>
          <span className="capitalize">{performance.thermalState}</span>
        </div>
      )}

      <div className={layoutClass}>
        {openWindows.map((window, i) => {
          const bgApp = backgroundApps.find((a) => a.bundleId === window.appId);
          const isPinned = pinnedApps.has(window.appId) || bgApp?.pinned;
          const isLocked = lockedApps.has(window.appId);

          return (
            <motion.div
              key={window.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={mode === 'horizontal' ? 'shrink-0 w-40' : undefined}
            >
              <GlassPanel
                className={cn(
                  'p-2 cursor-pointer relative',
                  mode === 'horizontal' ? 'aspect-[9/14]' : 'aspect-[9/16]'
                )}
                onClick={() => { focusWindow(window.id); onClose(); }}
              >
                {isPinned && (
                  <span className="absolute top-2 right-2 text-[10px] bg-gulf-gold/80 text-black px-1.5 py-0.5 rounded z-10">
                    Pinned
                  </span>
                )}
                {isLocked && (
                  <span className="absolute top-2 left-2 text-[10px] bg-purple-500/80 text-white px-1.5 py-0.5 rounded z-10">
                    Locked
                  </span>
                )}
                {bgApp?.frozen && (
                  <span className="absolute top-8 left-2 text-[10px] bg-blue-500/80 text-white px-1.5 py-0.5 rounded z-10">
                    Frozen
                  </span>
                )}
                <div className="h-full rounded-xl bg-gradient-to-b from-gray-800/90 to-gray-900/90 backdrop-blur flex flex-col items-center justify-center">
                  <span className="text-3xl mb-2">📱</span>
                  <p className="text-xs text-white font-medium px-2 text-center truncate w-full">{window.title}</p>
                  {bgApp && (
                    <p className="text-[10px] text-white/40 mt-1">{bgApp.memoryMb} MB</p>
                  )}
                </div>
              </GlassPanel>
              {!isLocked && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleForceClose(window.appId, window.id);
                  }}
                  className="w-full mt-1 text-[10px] text-red-400 text-center"
                >
                  Force Close
                </button>
              )}
            </motion.div>
          );
        })}
      </div>

      {openWindows.length > 0 && (
        <button
          onClick={() => { tap(); openWindows.forEach((w) => closeWindow(w.id)); }}
          className="w-full mt-6 py-3 text-center text-red-400 text-sm font-medium"
        >
          Close All Apps
        </button>
      )}
    </motion.div>
  );
}
