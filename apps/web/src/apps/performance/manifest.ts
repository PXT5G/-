import type { AppManifest } from '@/types';

export const performanceManifest: AppManifest = {
  id: 'com.gulfos.performance',
  bundleId: 'com.gulfos.performance',
  name: 'Performance',
  version: '1.0.0',
  description: 'Performance engine and device metrics',
  icon: '⚡',
  category: 'system',
  permissions: ['notifications'],
  minOSVersion: '1.0.0',
  isSystemApp: true,
  route: '/performance',
};
