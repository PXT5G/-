import type { AppManifest } from '@/types';

export const emsManifest: AppManifest = {
  id: 'com.gulfos.ems',
  bundleId: 'com.gulfos.ems',
  name: 'GULF EMS',
  version: '1.0.0',
  description: 'Official Emergency Medical Services MDT',
  icon: '🚑',
  category: 'utilities',
  permissions: ['location', 'network', 'notifications', 'camera'],
  minOSVersion: '1.0.0',
  isSystemApp: false,
  route: '/ems',
};
