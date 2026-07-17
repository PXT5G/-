'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useDynamicIslandStore } from '@/stores/dynamicIslandStore';
import { usePhoneOsStore } from '@/stores/phoneOsStore';
import { usePremiumExperienceStore } from '@/stores/premiumExperienceStore';
import { islandExpand } from '@/animations/transitions';
import { useMotionPreference } from '@/hooks/useMotionPreference';
import { cn } from '@/utils/cn';

export function DynamicIsland() {
  const { mode, title, subtitle, icon, progress } = useDynamicIslandStore();
  const liveActivities = usePhoneOsStore((s) => s.liveActivities);
  const profile = usePremiumExperienceStore((s) => s.profile);
  const maxActivities = profile?.dynamicIslandMaxActivities ?? 3;
  const [activeIndex, setActiveIndex] = useState(0);
  const { spring } = useMotionPreference();

  const activeLive = liveActivities.filter(
    (a) => a.state === 'active' && a.dynamicIsland
  ).slice(0, maxActivities);

  const hasStoreActivity = mode !== 'idle';
  const hasLiveActivities = activeLive.length > 0;
  const displayMode = hasStoreActivity ? mode : hasLiveActivities ? 'compact' : 'idle';

  const currentLive = activeLive[activeIndex];
  const displayTitle = hasStoreActivity ? title : currentLive?.title;
  const displaySubtitle = hasStoreActivity ? subtitle : currentLive?.subtitle;
  const displayIcon = hasStoreActivity ? icon : currentLive?.icon;
  const displayProgress = hasStoreActivity ? progress : currentLive?.progress;

  const dimensions = islandExpand[displayMode];

  return (
    <div className="absolute top-[11px] left-1/2 -translate-x-1/2 z-[60]">
      <AnimatePresence mode="wait">
        <motion.div
          key={`${displayMode}-${activeIndex}`}
          className={cn(
            'bg-black flex items-center justify-center overflow-hidden',
            displayMode !== 'idle' && 'shadow-[0_8px_28px_rgba(0,0,0,0.6)]',
            displayMode === 'idle' && 'cursor-pointer'
          )}
          style={{ borderRadius: 20 }}
          initial={false}
          animate={dimensions}
          transition={spring}
          onClick={() => {
            if (displayMode === 'compact') {
              if (hasLiveActivities && activeLive.length > 1) {
                setActiveIndex((i) => (i + 1) % activeLive.length);
              } else {
                useDynamicIslandStore.getState().expand();
              }
            } else if (displayMode === 'expanded') {
              useDynamicIslandStore.getState().collapse();
            }
          }}
          role="status"
          aria-label={displayTitle ?? 'Dynamic Island'}
          aria-live="polite"
        >
          {displayMode === 'idle' && (
            <div className="flex items-center justify-end w-full h-full pr-[14px]">
              {/* TrueDepth camera lens */}
              <div className="w-[11px] h-[11px] rounded-full bg-[#0d0d10] ring-1 ring-[#1a1a20]" />
            </div>
          )}

          {displayMode === 'compact' && (
            <div className="flex items-center gap-2 px-4 w-full">
              {displayIcon && <span className="text-sm">{displayIcon}</span>}
              <span className="text-xs text-white font-medium truncate">{displayTitle}</span>
              {activeLive.length > 1 && (
                <span className="text-[9px] text-white/40">{activeIndex + 1}/{activeLive.length}</span>
              )}
            </div>
          )}

          {displayMode === 'activity' && (
            <div className="flex items-center gap-2 px-4 w-full">
              {displayIcon && <span className="text-sm">{displayIcon}</span>}
              <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gulf-gold rounded-full"
                  animate={{ width: `${displayProgress ?? 0}%` }}
                />
              </div>
            </div>
          )}

          {displayMode === 'expanded' && (
            <div className="p-4 w-full">
              {activeLive.length > 1 && !hasStoreActivity ? (
                <div className="space-y-2">
                  {activeLive.map((activity, i) => (
                    <div
                      key={activity.id}
                      className={cn(
                        'flex items-center gap-2 p-2 rounded-lg',
                        i === activeIndex ? 'bg-white/10' : 'opacity-60'
                      )}
                      onClick={(e) => { e.stopPropagation(); setActiveIndex(i); }}
                    >
                      <span>{activity.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{activity.title}</p>
                        {activity.subtitle && (
                          <p className="text-[10px] text-white/60 truncate">{activity.subtitle}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-2">
                    {displayIcon && <span className="text-2xl">{displayIcon}</span>}
                    <div>
                      <p className="text-sm font-semibold text-white">{displayTitle}</p>
                      {displaySubtitle && <p className="text-xs text-white/60">{displaySubtitle}</p>}
                    </div>
                  </div>
                  {displayProgress !== undefined && (
                    <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gulf-gold rounded-full"
                        animate={{ width: `${displayProgress}%` }}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
