'use client';

import { useSettingsStore } from '@/stores/settingsStore';
import { usePremiumExperienceStore } from '@/stores/premiumExperienceStore';
import { GULF_MOTION, GULF_SPRING } from '@/design/tokens';

/** Respects reduce-motion settings for consistent animation behavior. */
export function useMotionPreference() {
  const reduceMotion = useSettingsStore((s) => s.reduceMotion);
  const profileOverride = usePremiumExperienceStore((s) => s.profile?.reduceMotionOverride);

  const shouldReduceMotion = reduceMotion || profileOverride === true;

  return {
    shouldReduceMotion,
    duration: (base: number) => (shouldReduceMotion ? 0.01 : base),
    spring: shouldReduceMotion
      ? { type: 'tween' as const, duration: 0.01 }
      : GULF_SPRING.default,
    smoothSpring: shouldReduceMotion
      ? { type: 'tween' as const, duration: 0.01 }
      : GULF_SPRING.smooth,
    unlockDuration: shouldReduceMotion ? 0.01 : GULF_MOTION.unlock,
  };
}
