/** GULF Personalization & Phase 5.4 constants */

export const PERSONALIZATION_APP_BUNDLE = 'com.gulfos.personalization' as const;

export const THEME_MODES = ['light', 'dark', 'system', 'automatic'] as const;
export type ThemeMode = (typeof THEME_MODES)[number];

export const WALLPAPER_TYPES = ['static', 'gradient', 'animated', 'video', 'live', 'depth', 'weather', 'photo_shuffle'] as const;
export type WallpaperType = (typeof WALLPAPER_TYPES)[number];

export const ICON_SIZES = ['small', 'medium', 'large'] as const;
export type IconSize = (typeof ICON_SIZES)[number];

export const PERSONALIZATION_SOCKET_EVENTS = [
  'theme:update', 'layout:update', 'wallpaper:update', 'personalization:update',
  'dynamicisland:update', 'continuity:update', 'clipboard:update',
  'handoff:start', 'handoff:complete', 'media:update', 'performance:update',
] as const;

export const DEVICE_TYPES = ['phone', 'tablet', 'laptop', 'desktop', 'browser', 'vehicle', 'watch', 'tv'] as const;
export type DeviceType = (typeof DEVICE_TYPES)[number];

export const PERFORMANCE_MODES = ['normal', 'balanced', 'performance', 'power_saving', 'ultra_power_saving'] as const;
export type PerformanceMode = (typeof PERFORMANCE_MODES)[number];
