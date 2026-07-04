/** GULFOS Essential System Applications — Phase 3.6 */

export const SYSTEM_APP_BUNDLES = {
  maps: 'com.gulfos.maps',
  camera: 'com.gulfos.camera',
  gallery: 'com.gulfos.gallery',
  files: 'com.gulfos.files',
  calendar: 'com.gulfos.calendar',
  clock: 'com.gulfos.clock',
  calculator: 'com.gulfos.calculator',
  notes: 'com.gulfos.notes',
  voiceRecorder: 'com.gulfos.recorder',
  weather: 'com.gulfos.weather',
} as const;

export const CAMERA_MODES = ['photo', 'portrait', 'video', 'slow_motion', 'time_lapse', 'night'] as const;
export type CameraMode = (typeof CAMERA_MODES)[number];

export const FLASH_MODES = ['off', 'on', 'auto'] as const;
export type FlashMode = (typeof FLASH_MODES)[number];

export const GALLERY_ALBUM_TYPES = ['photos', 'videos', 'favorites', 'hidden', 'trash', 'ai_category'] as const;

export const CALENDAR_EVENT_TYPES = [
  'event', 'reminder', 'birthday', 'government', 'police_shift',
  'justice_hearing', 'bank_payment', 'invitation',
] as const;
export type CalendarEventType = (typeof CALENDAR_EVENT_TYPES)[number];

export const RECURRENCE_TYPES = ['none', 'daily', 'weekly', 'monthly', 'yearly'] as const;

export const NOTE_CONTENT_TYPES = ['text', 'checklist', 'image', 'voice'] as const;

export const FILE_CATEGORIES = ['documents', 'images', 'videos', 'audio', 'downloads', 'archives'] as const;

export const WEATHER_CONDITIONS = ['clear', 'clouds', 'fog', 'rain', 'thunderstorm', 'smog'] as const;

export const MAPS_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
