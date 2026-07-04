import { create } from 'zustand';
import type { DynamicIslandState } from '@/types';

interface DynamicIslandStore extends DynamicIslandState {
  show: (state: Omit<DynamicIslandState, 'mode'> & { mode?: DynamicIslandState['mode'] }) => void;
  expand: () => void;
  collapse: () => void;
  hide: () => void;
  setProgress: (progress: number) => void;
}

export const useDynamicIslandStore = create<DynamicIslandStore>((set) => ({
  mode: 'idle',
  title: undefined,
  subtitle: undefined,
  icon: undefined,
  progress: undefined,

  show: (state) =>
    set({
      mode: state.mode ?? 'compact',
      title: state.title,
      subtitle: state.subtitle,
      icon: state.icon,
      progress: state.progress,
    }),

  expand: () => set({ mode: 'expanded' }),

  collapse: () => set({ mode: 'compact' }),

  hide: () =>
    set({
      mode: 'idle',
      title: undefined,
      subtitle: undefined,
      icon: undefined,
      progress: undefined,
    }),

  setProgress: (progress) => set({ progress, mode: 'activity' }),
}));
