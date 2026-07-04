'use client';

import { motion } from 'framer-motion';
import { useWindowManagerStore } from '@/stores/windowManagerStore';
import { GlassPanel } from '@/components/ui/GlassPanel';

interface MultitaskingViewProps {
  onClose: () => void;
}

export function MultitaskingView({ onClose }: MultitaskingViewProps) {
  const { windows, focusWindow, closeWindow } = useWindowManagerStore();
  const openWindows = windows.filter((w) => !w.isMinimized);

  return (
    <motion.div
      className="absolute inset-0 z-[48] bg-black/80 backdrop-blur-xl p-4 pt-14"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white">Recent Apps</h2>
        <button onClick={onClose} className="text-sm text-banana-gold">Done</button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {openWindows.map((window) => (
          <GlassPanel
            key={window.id}
            className="aspect-[9/16] p-2 cursor-pointer"
            onClick={() => { focusWindow(window.id); onClose(); }}
          >
            <div className="h-full rounded-xl bg-gradient-to-b from-gray-800 to-gray-900 flex flex-col items-center justify-center">
              <span className="text-3xl mb-2">📱</span>
              <p className="text-xs text-white font-medium">{window.title}</p>
            </div>
          </GlassPanel>
        ))}
      </div>

      {openWindows.length > 0 && (
        <button
          onClick={() => openWindows.forEach((w) => closeWindow(w.id))}
          className="w-full mt-6 py-3 text-center text-red-400 text-sm font-medium"
        >
          Close All Apps
        </button>
      )}
    </motion.div>
  );
}
