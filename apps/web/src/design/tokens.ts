/** GULFOS Design System tokens */

export const GULF_MOTION = {
  instant: 0.1,
  fast: 0.2,
  normal: 0.3,
  slow: 0.5,
  unlock: 0.5,
  boot: 0.8,
} as const;

export const GULF_SPRING = {
  default: { type: 'spring' as const, stiffness: 400, damping: 30, mass: 0.8 },
  smooth: { type: 'spring' as const, stiffness: 300, damping: 35 },
  bounce: { type: 'spring' as const, stiffness: 500, damping: 15 },
  gentle: { type: 'spring' as const, stiffness: 200, damping: 25 },
};

/** iOS system-grouped background (dark) */
export const APP_GRADIENT = 'bg-[#000000]';
