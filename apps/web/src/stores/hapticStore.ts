import { create } from 'zustand';
import type { HapticPattern } from '@/types';

interface HapticState {
  enabled: boolean;
  trigger: (pattern: HapticPattern['type']) => void;
  setEnabled: (enabled: boolean) => void;
}

const hapticPatterns: Record<HapticPattern['type'], number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [10, 50, 10],
  warning: [25, 25, 25],
  error: [50, 100, 50],
};

export const useHapticStore = create<HapticState>((set, get) => ({
  enabled: true,

  setEnabled: (enabled) => set({ enabled }),

  trigger: (type) => {
    const { enabled } = get();
    if (!enabled || typeof window === 'undefined') return;

    if ('vibrate' in navigator) {
      const pattern = hapticPatterns[type];
      navigator.vibrate(pattern);
    }
  },
}));
