import type { AppManifest } from '@/types';

export const marineManifest: AppManifest = {
  id: 'com.gulfos.marine',
  bundleId: 'com.gulfos.marine',
  name: 'GULF Marine',
  version: '1.0.0',
  description: 'Official marine marketplace and fleet management platform',
  icon: '⚓',
  category: 'utilities',
  permissions: ['location', 'network', 'notifications', 'storage', 'camera'],
  minOSVersion: '1.0.0',
  isSystemApp: false,
  route: '/marine',
};
