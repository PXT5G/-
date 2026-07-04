'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useDynamicIslandStore } from '@/stores/dynamicIslandStore';
import { islandExpand } from '@/animations/transitions';
import { cn } from '@/utils/cn';

export function DynamicIsland() {
  const { mode, title, subtitle, icon, progress } = useDynamicIslandStore();

  const dimensions = islandExpand[mode === 'idle' ? 'compact' : mode];

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[60]">
      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          className={cn(
            'bg-black rounded-full flex items-center justify-center overflow-hidden',
            'shadow-lg shadow-black/50 border border-white/5',
            mode === 'idle' && 'cursor-pointer'
          )}
          initial={false}
          animate={dimensions}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          onClick={() => {
            if (mode === 'compact') useDynamicIslandStore.getState().expand();
            else if (mode === 'expanded') useDynamicIslandStore.getState().collapse();
          }}
          role="status"
          aria-label={title ?? 'Dynamic Island'}
          aria-live="polite"
        >
          {mode === 'idle' && (
            <div className="w-3 h-3 rounded-full bg-black" />
          )}

          {mode === 'compact' && (
            <div className="flex items-center gap-2 px-4 w-full">
              {icon && <span className="text-sm">{icon}</span>}
              <span className="text-xs text-white font-medium truncate">{title}</span>
            </div>
          )}

          {mode === 'activity' && (
            <div className="flex items-center gap-2 px-4 w-full">
              {icon && <span className="text-sm">{icon}</span>}
              <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-banana-gold rounded-full"
                  animate={{ width: `${progress ?? 0}%` }}
                />
              </div>
            </div>
          )}

          {mode === 'expanded' && (
            <div className="p-4 w-full">
              <div className="flex items-center gap-3 mb-2">
                {icon && <span className="text-2xl">{icon}</span>}
                <div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  {subtitle && <p className="text-xs text-white/60">{subtitle}</p>}
                </div>
              </div>
              {progress !== undefined && (
                <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-banana-gold rounded-full"
                    animate={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
