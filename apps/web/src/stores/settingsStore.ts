import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserSettings, WallpaperConfig } from '@/types';
import { DEFAULT_SETTINGS } from '@/constants/defaultSettings';

interface SettingsState extends UserSettings {
  hydrated: boolean;
  updateSettings: (partial: Partial<UserSettings>) => void;
  setWallpaper: (wallpaper: WallpaperConfig) => void;
  hydrateFromServer: (settings: UserSettings) => void;
  resetSettings: () => void;
  setHydrated: (hydrated: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      hydrated: false,
      updateSettings: (partial) => set((s) => ({ ...s, ...partial })),
      setWallpaper: (wallpaper) => set({ wallpaper }),
      hydrateFromServer: (settings) => set({ ...settings, hydrated: true }),
      resetSettings: () => set({ ...DEFAULT_SETTINGS, hydrated: true }),
      setHydrated: (hydrated) => set({ hydrated }),
    }),
    {
      name: 'gulfos-settings',
      version: 1,
      migrate: (persisted: unknown, version: number) => {
        if (version === 0 && typeof window !== 'undefined') {
          try {
            const legacy = localStorage.getItem('bananaos-settings');
            if (legacy) return JSON.parse(legacy);
          } catch { /* ignore */ }
        }
        return persisted as SettingsState;
      },
      partialize: (state) => {
        const { hydrated, updateSettings, setWallpaper, hydrateFromServer, resetSettings, setHydrated, ...settings } = state;
        return settings;
      },
    }
  )
);
