import type { UserSettings } from '@/types';
import { isRTL } from '@gulfos/shared';
import { useThemeStore } from '@/stores/themeStore';
import { useSoundStore } from '@/stores/soundStore';
import { useHapticStore } from '@/stores/hapticStore';
import { useI18nStore } from '@/stores/i18nStore';
import { useSettingsStore } from '@/stores/settingsStore';

const FONT_SIZE_SCALE: Record<UserSettings['fontSize'], string> = {
  small: '14px',
  medium: '16px',
  large: '18px',
};

const DISPLAY_ZOOM_SCALE: Record<UserSettings['displayZoom'], number> = {
  default: 1,
  large: 1.1,
  larger: 1.2,
};

export function applySettingsToOS(settings: Partial<UserSettings>) {
  if (settings.theme !== undefined) {
    useThemeStore.getState().setMode(settings.theme);
  }
  if (settings.accentColor !== undefined) {
    useThemeStore.getState().setAccentColor(settings.accentColor);
  }
  if (settings.soundsEnabled !== undefined) {
    useSoundStore.getState().setEnabled(settings.soundsEnabled);
  }
  if (settings.volume !== undefined || settings.mediaVolume !== undefined) {
    const vol = settings.mediaVolume ?? settings.volume ?? 70;
    useSoundStore.getState().setVolume(vol / 100);
  }
  if (settings.hapticsEnabled !== undefined) {
    useHapticStore.getState().setEnabled(settings.hapticsEnabled);
  }
  if (settings.vibrationEnabled !== undefined) {
    useHapticStore.getState().setEnabled(settings.vibrationEnabled && (settings.hapticsEnabled ?? true));
  }
  if (settings.language !== undefined) {
    useI18nStore.getState().setLanguage(settings.language);
  }

  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    const current = getCurrentSettingsSnapshot();

    if (settings.language !== undefined) {
      root.setAttribute('lang', settings.language);
      root.setAttribute('dir', isRTL(settings.language) ? 'rtl' : 'ltr');
    }

    const fontSize = settings.fontSize ?? current.fontSize;
    if (fontSize) {
      root.style.setProperty('--os-font-size', FONT_SIZE_SCALE[fontSize]);
      root.classList.toggle('large-text', settings.largeText ?? current.largeText ?? false);
      root.classList.toggle('bold-text', settings.boldText ?? current.boldText ?? false);
    }

    const displayZoom = settings.displayZoom ?? current.displayZoom;
    if (displayZoom) {
      root.style.setProperty('--os-display-zoom', String(DISPLAY_ZOOM_SCALE[displayZoom]));
    }

    const reduceMotion = settings.reduceMotion ?? current.reduceMotion;
    if (reduceMotion !== undefined) {
      root.classList.toggle('reduce-motion', reduceMotion);
    }

    const animationsEnabled = settings.animationsEnabled ?? current.animationsEnabled;
    if (animationsEnabled !== undefined) {
      root.classList.toggle('no-animations', !animationsEnabled);
    }

    const highContrast = settings.highContrast ?? current.highContrast;
    if (highContrast !== undefined) {
      root.classList.toggle('high-contrast', highContrast);
    }

    const colorFilters = settings.colorFilters ?? current.colorFilters;
    if (colorFilters !== undefined) {
      root.classList.toggle('color-filters', colorFilters);
    }

    const touchAssistance = settings.touchAssistance ?? current.touchAssistance;
    if (touchAssistance !== undefined) {
      root.classList.toggle('touch-assistance', touchAssistance);
    }
  }
}

function getCurrentSettingsSnapshot(): Partial<UserSettings> {
  const state = useSettingsStore.getState();
  const {
    hydrated: _h,
    updateSettings: _u,
    setWallpaper: _w,
    hydrateFromServer: _hs,
    resetSettings: _r,
    setHydrated: _sh,
    ...rest
  } = state;
  return rest;
}
