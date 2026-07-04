import type { AppManifest } from '@/types';

export const businessManifest: AppManifest = {
  id: 'com.gulfos.business',
  bundleId: 'com.gulfos.business',
  name: 'GULF Business',
  version: '1.0.0',
  description: 'Enterprise business management platform',
  icon: '🏢',
  category: 'utilities',
  permissions: ['location', 'network', 'notifications', 'storage'],
  minOSVersion: '1.0.0',
  isSystemApp: false,
  route: '/business',
};
