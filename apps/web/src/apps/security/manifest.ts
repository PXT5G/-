import type { AppManifest } from '@/types';

export const securityManifest: AppManifest = {
  id: 'com.gulfos.security',
  bundleId: 'com.gulfos.security',
  name: 'Security',
  version: '1.0.0',
  description: 'Security Center — threat monitoring, recommendations, events',
  icon: '🛡️',
  category: 'system',
  permissions: ['notifications', 'biometrics'],
  minOSVersion: '1.0.0',
  isSystemApp: true,
  route: '/security',
};
