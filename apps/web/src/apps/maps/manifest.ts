import type { AppManifest } from '@/types';

export const mapsManifest: AppManifest = {
  id: 'com.gulfos.maps',
  bundleId: 'com.gulfos.maps',
  name: 'GULF Maps',
  version: '1.0.0',
  description: 'GTA map navigation with live GPS',
  icon: '🗺️',
  category: 'utilities',
  permissions: ['location', 'network', 'storage'],
  minOSVersion: '1.0.0',
  isSystemApp: true,
  route: '/maps',
};
