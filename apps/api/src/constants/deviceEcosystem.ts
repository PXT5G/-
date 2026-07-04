/** GULFOS Device Ecosystem — Phase 3.5 constants */

export const UNLOCK_METHODS = ['face', 'fingerprint', 'pin', 'password', 'none'] as const;
export type UnlockMethodType = (typeof UNLOCK_METHODS)[number];

export const POWER_MODES = ['normal', 'low_power', 'critical', 'emergency_shutdown'] as const;
export type PowerMode = (typeof POWER_MODES)[number];

export const CHARGING_TYPES = ['none', 'wired', 'fast', 'wireless'] as const;
export type ChargingType = (typeof CHARGING_TYPES)[number];

export const BACKUP_TYPES = ['automatic', 'manual'] as const;
export type BackupType = (typeof BACKUP_TYPES)[number];

export const BACKUP_STATES = ['queued', 'running', 'completed', 'failed', 'restoring'] as const;
export type BackupState = (typeof BACKUP_STATES)[number];

export const SYNC_DOMAINS = ['settings', 'contacts', 'messages', 'apps', 'wallpapers', 'preferences'] as const;
export type SyncDomain = (typeof SYNC_DOMAINS)[number];

export const RECOVERY_MODES = ['normal', 'safe', 'recovery'] as const;
export type RecoveryMode = (typeof RECOVERY_MODES)[number];

export const MAINTENANCE_ACTIONS = [
  'optimize_storage',
  'clear_cache',
  'repair_database',
  'rebuild_search_index',
  'reset_network',
  'reset_settings',
  'duplicate_detection',
  'system_cleanup',
] as const;
export type MaintenanceAction = (typeof MAINTENANCE_ACTIONS)[number];

export const MAX_FAILED_UNLOCK_ATTEMPTS = 5;
export const TEMP_LOCK_DURATION_MS = 30_000;
export const BATTERY_DEGRADATION_PER_CYCLE = 0.002;
export const WARRANTY_DEFAULT_MONTHS = 24;

export const STORAGE_CATEGORIES = [
  'downloads',
  'trash',
  'cache',
  'application_data',
  'media_library',
  'system',
] as const;
