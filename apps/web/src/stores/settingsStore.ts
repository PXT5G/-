import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserSettings, WallpaperConfig } from '@/types';

const defaultSettings: UserSettings = {
  theme: 'dark',
  accentColor: 'gold',
  wallpaper: {
    id: 'banana-gradient',
    type: 'animated',
    animatedClass: 'wallpaper-banana',
    dark: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
    light: 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 50%, #d4d4d4 100%)',
  },
  language: 'en',
  reduceMotion: false,
  highContrast: false,
  fontSize: 'medium',
  hapticsEnabled: true,
  soundsEnabled: true,
  brightness: 80,
  volume: 70,
  wifiEnabled: true,
  bluetoothEnabled: false,
  silentMode: false,
  rotationLock: false,
  flashlightEnabled: false,
};

interface SettingsState extends UserSettings {
  updateSettings: (partial: Partial<UserSettings>) => void;
  setWallpaper: (wallpaper: WallpaperConfig) => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,
      updateSettings: (partial) => set((s) => ({ ...s, ...partial })),
      setWallpaper: (wallpaper) => set({ wallpaper }),
      resetSettings: () => set(defaultSettings),
    }),
    { name: 'bananaos-settings' }
  )
);
