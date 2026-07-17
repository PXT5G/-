/** GULFOS Premium Experience — Phase 5.1 constants */

export const LOCK_SCREEN_LAYOUTS = ['classic', 'minimal', 'stacked', 'split', 'focus'] as const;
export type LockScreenLayout = (typeof LOCK_SCREEN_LAYOUTS)[number];

export const CLOCK_FONTS = ['system', 'rounded', 'serif', 'mono', 'condensed'] as const;
export type ClockFont = (typeof CLOCK_FONTS)[number];

export const CLOCK_COLORS = ['white', 'gold', 'blue', 'green', 'red', 'gradient'] as const;
export type ClockColor = (typeof CLOCK_COLORS)[number];

export const WALLPAPER_COLLECTIONS = [
  'gulf-default',
  'gulf-gold',
  'midnight',
  'aurora',
  'ocean',
  'desert',
  'city',
  'nature',
  'abstract',
] as const;
export type WallpaperCollection = (typeof WALLPAPER_COLLECTIONS)[number];

export const MULTITASKING_MODES = ['cards', 'grid', 'horizontal'] as const;
export type MultitaskingMode = (typeof MULTITASKING_MODES)[number];

export const CONTROL_CENTER_PAGES = ['connectivity', 'media', 'device', 'shortcuts'] as const;
export type ControlCenterPage = (typeof CONTROL_CENTER_PAGES)[number];

export const APP_LIBRARY_CATEGORIES = [
  'productivity',
  'social',
  'finance',
  'shopping',
  'travel',
  'news',
  'games',
  'utilities',
  'government',
  'business',
  'health',
  'education',
  'other',
] as const;
export type AppLibraryCategory = (typeof APP_LIBRARY_CATEGORIES)[number];

export const WIDGET_TYPES = [
  'weather',
  'calendar',
  'battery',
  'stocks',
  'clock',
  'music',
  'maps',
  'bank',
  'business',
  'ems',
  'police',
  'justice',
  'exchange',
  'realestate',
  'vehicles',
  'marine',
  'aviation',
  'chat',
  'notes',
  'poetry',
  'files',
  'photos',
  'camera',
  'browser',
] as const;
export type WidgetType = (typeof WIDGET_TYPES)[number];

export const WIDGET_SIZES = ['small', 'medium', 'large'] as const;
export type WidgetSize = (typeof WIDGET_SIZES)[number];

export const NOTIFICATION_GROUP_STRATEGIES = ['app', 'priority', 'time', 'category'] as const;
export type NotificationGroupStrategy = (typeof NOTIFICATION_GROUP_STRATEGIES)[number];

export const DYNAMIC_ISLAND_ACTIVITY_TYPES = [
  'call',
  'music',
  'navigation',
  'charging',
  'download',
  'upload',
  'ems',
  'police',
  'justice',
  'bank_transfer',
  'stocks',
  'weather',
  'timer',
  'voice_recorder',
  'live_activity',
] as const;
export type DynamicIslandActivityType = (typeof DYNAMIC_ISLAND_ACTIVITY_TYPES)[number];

export const PREMIUM_SEARCH_CATEGORIES = [
  'apps',
  'contacts',
  'calls',
  'messages',
  'businesses',
  'properties',
  'vehicles',
  'aircraft',
  'marine',
  'stocks',
  'calendar',
  'files',
  'photos',
  'notes',
  'justice',
  'police',
  'ems',
  'browser_history',
  'downloads',
] as const;
export type PremiumSearchCategory = (typeof PREMIUM_SEARCH_CATEGORIES)[number];

export const DEFAULT_CONTROL_CENTER_CONTROLS = [
  'wifi',
  'bluetooth',
  'airplane',
  'cellular',
  'vpn',
  'location',
  'flashlight',
  'camera',
  'rotation',
  'silent',
  'focus',
  'brightness',
  'volume',
  'battery',
  'performance',
  'power_saving',
  'network_speed',
  'cpu',
  'gpu',
  'temperature',
  'ram',
  'storage',
  'screen_record',
  'microphone',
  'qr_scanner',
  'calculator',
  'music',
] as const;
