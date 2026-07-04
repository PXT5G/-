'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/stores/themeStore';
import { useSettingsStore } from '@/stores/settingsStore';

export function useThemeEngine() {
  const { mode, setResolvedMode } = useThemeStore();
  const reduceMotion = useSettingsStore((s) => s.reduceMotion);

  useEffect(() => {
    const resolveTheme = () => {
      if (mode === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setResolvedMode(prefersDark ? 'dark' : 'light');
      } else {
        setResolvedMode(mode);
      }
    };

    resolveTheme();

    if (mode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => resolveTheme();
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [mode, setResolvedMode]);

  useEffect(() => {
    const resolvedMode = useThemeStore.getState().resolvedMode;
    document.documentElement.setAttribute('data-theme', resolvedMode);
    document.documentElement.classList.toggle('dark', resolvedMode === 'dark');
    document.documentElement.classList.toggle('reduce-motion', reduceMotion);
  }, [reduceMotion]);

  return useThemeStore();
}
