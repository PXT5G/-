import type { AppManifest } from '@/types';

export const vehiclesManifest: AppManifest = {
  id: 'com.gulfos.vehicles',
  bundleId: 'com.gulfos.vehicles',
  name: 'GULF Auto',
  version: '1.0.0',
  description: 'Official vehicle marketplace and dealership platform',
  icon: '🚗',
  category: 'utilities',
  permissions: ['location', 'network', 'notifications', 'storage', 'camera'],
  minOSVersion: '1.0.0',
  isSystemApp: false,
  route: '/vehicles',
};
