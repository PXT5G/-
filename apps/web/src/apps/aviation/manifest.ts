import type { AppManifest } from '@/types';

export const aviationManifest: AppManifest = {
  id: 'com.gulfos.aviation',
  bundleId: 'com.gulfos.aviation',
  name: 'GULF Aviation',
  version: '1.0.0',
  description: 'Official aviation marketplace and fleet management platform',
  icon: '✈️',
  category: 'utilities',
  permissions: ['location', 'network', 'notifications', 'storage', 'camera'],
  minOSVersion: '1.0.0',
  isSystemApp: false,
  route: '/aviation',
};
