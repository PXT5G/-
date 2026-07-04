import type { AppManifest } from '@/types';

export const realEstateManifest: AppManifest = {
  id: 'com.gulfos.real-estate',
  bundleId: 'com.gulfos.real-estate',
  name: 'GULF Real Estate',
  version: '1.0.0',
  description: 'Official real estate management platform',
  icon: '🏠',
  category: 'utilities',
  permissions: ['location', 'network', 'notifications', 'storage', 'camera'],
  minOSVersion: '1.0.0',
  isSystemApp: false,
  route: '/real-estate',
};
