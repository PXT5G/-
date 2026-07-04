import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ThemeMode, AccentColor } from '@/types';

interface ThemeState {
  mode: ThemeMode;
  accentColor: AccentColor;
  resolvedMode: 'light' | 'dark';
  setMode: (mode: ThemeMode) => void;
  setAccentColor: (color: AccentColor) => void;
  setResolvedMode: (mode: 'light' | 'dark') => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'dark',
      accentColor: 'gold',
      resolvedMode: 'dark',
      setMode: (mode) => set({ mode }),
      setAccentColor: (accentColor) => set({ accentColor }),
      setResolvedMode: (resolvedMode) => set({ resolvedMode }),
    }),
    { name: 'bananaos-theme' }
  )
);

export const accentColors: Record<AccentColor, { primary: string; glow: string }> = {
  gold: { primary: '#D4AF37', glow: 'rgba(212, 175, 55, 0.4)' },
  white: { primary: '#FFFFFF', glow: 'rgba(255, 255, 255, 0.3)' },
  black: { primary: '#1A1A1A', glow: 'rgba(0, 0, 0, 0.3)' },
};
