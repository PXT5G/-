/** BananaOS System Settings — Phase 3.7 constants */

export const DEVICE_INFO = {
  defaultDeviceName: 'Gulf Phone V1',
  developer: 'Abu Sharaf',
  manufacturer: 'Banana Technologies',
  operatingSystem: 'BananaOS',
  kernel: 'Banana Core',
  hardwareVersion: '1.0',
  model: 'Gulf Phone V1',
  buildNumber: '3.7.0',
  osVersion: '1.0.0',
} as const;

export const SUPPORTED_LANGUAGES = [
  { code: 'ar', name: 'العربية', nativeName: 'Arabic', rtl: true },
  { code: 'en', name: 'English', nativeName: 'English', rtl: false },
  { code: 'fr', name: 'Français', nativeName: 'French', rtl: false },
  { code: 'de', name: 'Deutsch', nativeName: 'German', rtl: false },
  { code: 'es', name: 'Español', nativeName: 'Spanish', rtl: false },
  { code: 'it', name: 'Italiano', nativeName: 'Italian', rtl: false },
  { code: 'pt', name: 'Português', nativeName: 'Portuguese', rtl: false },
  { code: 'tr', name: 'Türkçe', nativeName: 'Turkish', rtl: false },
  { code: 'ru', name: 'Русский', nativeName: 'Russian', rtl: false },
  { code: 'ja', name: '日本語', nativeName: 'Japanese', rtl: false },
  { code: 'zh', name: '中文', nativeName: 'Chinese', rtl: false },
  { code: 'ko', name: '한국어', nativeName: 'Korean', rtl: false },
  { code: 'hi', name: 'हिन्दी', nativeName: 'Hindi', rtl: false },
  { code: 'ur', name: 'اردو', nativeName: 'Urdu', rtl: true },
  { code: 'fa', name: 'فارسی', nativeName: 'Persian', rtl: true },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]['code'];

export const RTL_LANGUAGES = SUPPORTED_LANGUAGES.filter((l) => l.rtl).map((l) => l.code);

export const DATE_FORMATS = ['mdy', 'dmy', 'ymd'] as const;
export const TIME_FORMATS = ['12h', '24h'] as const;
export const TEMPERATURE_UNITS = ['celsius', 'fahrenheit'] as const;
export const DISTANCE_UNITS = ['km', 'mi'] as const;
export const CURRENCIES = ['USD', 'EUR', 'GBP', 'SAR', 'AED', 'JPY', 'CNY'] as const;
export const KEYBOARD_LAYOUTS = ['qwerty', 'azerty', 'qwertz', 'arabic'] as const;
export const DISPLAY_ZOOM_LEVELS = ['default', 'large', 'larger'] as const;
export const REFRESH_RATES = [60, 90, 120] as const;
export const SCREEN_TIMEOUTS = [30, 60, 120, 300, 600] as const;

export const DEFAULT_USER_SETTINGS = {
  theme: 'dark' as const,
  accentColor: 'gold' as const,
  language: 'en',
  region: 'US',
  timezone: 'America/Los_Angeles',
  dateFormat: 'mdy' as const,
  timeFormat: '24h' as const,
  temperatureUnit: 'celsius' as const,
  distanceUnit: 'km' as const,
  currency: 'USD',
  keyboardLayout: 'qwerty' as const,
  autoTheme: true,
  displayZoom: 'default' as const,
  animationsEnabled: true,
  autoBrightness: false,
  refreshRate: 60 as const,
  screenTimeout: 60,
  alwaysOnDisplay: false,
  mediaVolume: 70,
  callVolume: 80,
  notificationVolume: 70,
  alarmVolume: 90,
  vibrationEnabled: true,
  ringtone: 'default',
  notificationSound: 'default',
  keyboardSound: true,
  mobileDataEnabled: true,
  hotspotEnabled: false,
  airplaneMode: false,
  powerSavingMode: false,
  voiceOverEnabled: false,
  largeText: false,
  boldText: false,
  colorFilters: false,
  monoAudio: false,
  touchAssistance: false,
  developerModeEnabled: false,
  twoFactorEnabled: false,
  appLockEnabled: false,
};
