import type { AppManifest } from '@/types';

export const analyticsManifest: AppManifest = {
  id: 'com.gulfos.analytics',
  bundleId: 'com.gulfos.analytics',
  name: 'Analytics',
  version: '1.0.0',
  description: 'System analytics and health metrics',
  icon: '📊',
  category: 'utilities',
  permissions: ['notifications'],
  minOSVersion: '1.0.0',
  isSystemApp: true,
  route: '/analytics',
};
