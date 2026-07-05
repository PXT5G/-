/** GULFOS Design System tokens — Phase 5.6 unified polish */

export const GULF_COLORS = {
  gold: '#D4AF37',
  black: '#0A0A0A',
  white: '#FFFFFF',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  info: '#007AFF',
} as const;

export const GULF_SPACING = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

export const GULF_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
} as const;

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

export const APP_GRADIENT = 'bg-gradient-to-b from-[#0a1628] to-[#1a1a2e]';

export const GLASS_CLASSES = {
  low: 'rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md',
  medium: 'rounded-2xl bg-white/10 border border-white/15 backdrop-blur-xl',
  high: 'rounded-2xl bg-white/15 border border-white/20 backdrop-blur-2xl',
} as const;
