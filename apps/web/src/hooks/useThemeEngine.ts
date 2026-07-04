'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/stores/themeStore';
import { useSettingsStore } from '@/stores/settingsStore';

export function useThemeEngine() {
  const { mode, setResolvedMode } = useThemeStore();
  const reduceMotion = useSettingsStore((s) => s.reduceMotion);
  const autoTheme = useSettingsStore((s) => s.autoTheme);
  const theme = useSettingsStore((s) => s.theme);
  const fontSize = useSettingsStore((s) => s.fontSize);
  const largeText = useSettingsStore((s) => s.largeText);
  const boldText = useSettingsStore((s) => s.boldText);
  const highContrast = useSettingsStore((s) => s.highContrast);
  const animationsEnabled = useSettingsStore((s) => s.animationsEnabled);

  const effectiveMode = autoTheme ? 'system' : theme;

  useEffect(() => {
    const resolveTheme = () => {
      if (effectiveMode === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setResolvedMode(prefersDark ? 'dark' : 'light');
      } else {
        setResolvedMode(effectiveMode === 'dark' ? 'dark' : 'light');
      }
    };

    resolveTheme();

    if (effectiveMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => resolveTheme();
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [effectiveMode, setResolvedMode]);

  useEffect(() => {
    const resolvedMode = useThemeStore.getState().resolvedMode;
    const root = document.documentElement;
    root.setAttribute('data-theme', resolvedMode);
    root.classList.toggle('dark', resolvedMode === 'dark');
    root.classList.toggle('reduce-motion', reduceMotion);
    root.classList.toggle('no-animations', !animationsEnabled);
    root.classList.toggle('high-contrast', highContrast);
    root.classList.toggle('large-text', largeText);
    root.classList.toggle('bold-text', boldText);

    const fontScale = { small: '14px', medium: '16px', large: '18px' } as const;
    root.style.setProperty('--os-font-size', fontScale[fontSize]);
  }, [reduceMotion, animationsEnabled, highContrast, largeText, boldText, fontSize]);

  return useThemeStore();
}
