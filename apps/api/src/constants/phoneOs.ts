/** GULFOS Phone OS Core — Phase 5.0 constants */

export const BOOT_PHASES = ['off', 'booting', 'splash', 'locked', 'home', 'recovery', 'safe'] as const;
export type BootPhase = (typeof BOOT_PHASES)[number];

export const POWER_ACTIONS = ['power_on', 'power_off', 'restart', 'emergency_restart'] as const;
export type PowerAction = (typeof POWER_ACTIONS)[number];

export const PERFORMANCE_MODES = ['normal', 'balanced', 'performance', 'power_saving', 'ultra_power_saving'] as const;
export type PerformanceMode = (typeof PERFORMANCE_MODES)[number];

export const THERMAL_STATES = ['nominal', 'fair', 'serious', 'critical'] as const;
export type ThermalState = (typeof THERMAL_STATES)[number];

export const CLOCK_STYLES = ['digital', 'analog', 'minimal', 'bold'] as const;
export type ClockStyle = (typeof CLOCK_STYLES)[number];

export const LIVE_ACTIVITY_TYPES = [
  'incoming_call',
  'navigation',
  'music',
  'download',
  'upload',
  'timer',
  'stopwatch',
  'ems_dispatch',
  'police_dispatch',
  'flight',
  'vehicle_delivery',
  'property_sale',
  'stock_alert',
  'custom',
] as const;
export type LiveActivityType = (typeof LIVE_ACTIVITY_TYPES)[number];

export const LIVE_ACTIVITY_STATES = ['active', 'paused', 'ended', 'dismissed'] as const;
export type LiveActivityState = (typeof LIVE_ACTIVITY_STATES)[number];

export const NOTIFICATION_GROUP_MODES = ['automatic', 'by_app', 'off'] as const;
export type NotificationGroupMode = (typeof NOTIFICATION_GROUP_MODES)[number];

export const SEARCH_CATEGORIES = [
  'apps',
  'contacts',
  'files',
  'photos',
  'messages',
  'settings',
  'businesses',
  'properties',
  'vehicles',
  'aircraft',
  'marine',
  'stocks',
  'bank_accounts',
  'identity',
  'notes',
  'calendar',
  'weather',
  'police',
  'justice',
  'ems',
  'browser_history',
  'downloads',
  'calls',
  'mail',
  'assistant',
  'shortcuts',
] as const;
export type SearchCategory = (typeof SEARCH_CATEGORIES)[number];

export const EXTENDED_PERMISSIONS = [
  'camera',
  'microphone',
  'location',
  'photos',
  'videos',
  'files',
  'bluetooth',
  'notifications',
  'calendar',
  'contacts',
  'phone',
  'sms',
  'background_refresh',
  'motion',
  'storage',
  'clipboard',
  'nearby_devices',
  'media_library',
  'network',
  'vpn',
  'health',
  'biometrics',
] as const;
export type ExtendedPermission = (typeof EXTENDED_PERMISSIONS)[number];

export const SIM_STATUSES = ['active', 'inactive', 'no_sim', 'locked', 'roaming'] as const;
export type SimStatus = (typeof SIM_STATUSES)[number];

export const DEFAULT_CONTROL_CENTER_TILES = [
  'wifi',
  'bluetooth',
  'airplane',
  'cellular',
  'flashlight',
  'rotation',
  'silent',
  'focus',
  'screen_record',
  'camera',
  'calculator',
  'timer',
  'music',
  'accessibility',
  'screen_mirror',
  'low_power',
  'vpn',
  'airdrop',
] as const;

export const DEFAULT_STATUS_BAR_ICONS = [
  'battery',
  'signal',
  'carrier',
  'wifi',
  'bluetooth',
  'vpn',
  'airplane',
  'silent',
  'alarm',
  'gps',
  'location',
  'microphone',
  'camera',
  'recording',
  'upload',
  'download',
  'dnd',
  'hotspot',
  'emergency',
] as const;

export const BATTERY_TEMP_WARNING_C = 42;
export const BATTERY_TEMP_CRITICAL_C = 48;
export const BACKGROUND_APP_MEMORY_LIMIT_MB = 512;
export const CPU_THROTTLE_THRESHOLD = 0.85;
export const GPU_THROTTLE_THRESHOLD = 0.9;
