/** GULF Focus — com.gulfos.focus */

export const FOCUS_APP_BUNDLE = 'com.gulfos.focus' as const;

export const FOCUS_PROFILE_TYPES = [
  'work', 'driving', 'gaming', 'meeting', 'business', 'police', 'justice', 'ems',
  'travel', 'sleep', 'study', 'emergency', 'personal', 'custom',
] as const;
export type FocusProfileType = (typeof FOCUS_PROFILE_TYPES)[number];

export const FOCUS_SOCKET_EVENTS = [
  'focus:enabled', 'focus:disabled', 'focus:updated', 'focus:schedule',
] as const;

export const FOCUS_PERMISSIONS = [
  'platform.access', 'focus.view', 'focus.manage', 'focus.enable', 'focus.schedule',
  'focus.automation', 'analytics.view',
] as const;
