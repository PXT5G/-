import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { OSPhase } from '@/types';

interface OSState {
  phase: OSPhase;
  isBooted: boolean;
  bootProgress: number;
  setPhase: (phase: OSPhase) => void;
  setBootProgress: (progress: number) => void;
  completeBoot: () => void;
  reset: () => void;
}

export const useOSStore = create<OSState>()(
  persist(
    (set) => ({
      phase: 'splash',
      isBooted: false,
      bootProgress: 0,
      setPhase: (phase) => set({ phase }),
      setBootProgress: (bootProgress) => set({ bootProgress }),
      completeBoot: () => set({ phase: 'locked', isBooted: true, bootProgress: 100 }),
      reset: () => set({ phase: 'splash', isBooted: false, bootProgress: 0 }),
    }),
    { name: 'bananaos-os', partialize: (s) => ({ isBooted: s.isBooted }) }
  )
);
