import type { AppManifest } from '@/types';

export const mapsManifest: AppManifest = {
  id: 'com.bananaos.maps',
  bundleId: 'com.bananaos.maps',
  name: 'Banana Maps',
  version: '1.0.0',
  description: 'GTA map navigation with live GPS',
  icon: '🗺️',
  category: 'utilities',
  permissions: ['location', 'network', 'storage'],
  minOSVersion: '1.0.0',
  isSystemApp: true,
  route: '/maps',
};
