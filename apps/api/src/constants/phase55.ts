/** GULF Security, Cloud & Phase 5.5 constants */

export const SECURITY_APP_BUNDLE = 'com.gulfos.security' as const;
export const PRIVACY_APP_BUNDLE = 'com.gulfos.privacy' as const;
export const CLOUD_APP_BUNDLE = 'com.gulfos.cloud' as const;
export const FIND_MY_APP_BUNDLE = 'com.gulfos.find-my' as const;
export const DEVELOPER_APP_BUNDLE = 'com.gulfos.developer' as const;
export const PERFORMANCE_APP_BUNDLE = 'com.gulfos.performance' as const;
export const DIAGNOSTICS_APP_BUNDLE = 'com.gulfos.diagnostics' as const;
export const ANALYTICS_APP_BUNDLE = 'com.gulfos.analytics' as const;
export const ENTERPRISE_APP_BUNDLE = 'com.gulfos.enterprise' as const;

export const SECURITY_LEVELS = ['low', 'medium', 'high', 'critical'] as const;
export const BACKUP_TYPES = ['automatic', 'manual', 'incremental', 'encrypted'] as const;
export const UPDATE_CHANNELS = ['stable', 'beta', 'developer', 'nightly'] as const;
export const DEVICE_TRUST_LEVELS = ['untrusted', 'pending', 'trusted', 'verified'] as const;

export const PHASE55_SOCKET_EVENTS = [
  'security:update', 'security:alert', 'privacy:update',
  'cloud:backup', 'cloud:restore', 'cloud:sync',
  'device:found', 'device:lost', 'package:update',
  'update:available', 'update:installed',
  'developer:update', 'diagnostics:update', 'analytics:update', 'enterprise:update',
] as const;
