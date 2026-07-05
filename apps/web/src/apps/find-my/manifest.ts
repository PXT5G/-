import type { AppManifest } from '@/types';

export const findMyManifest: AppManifest = {
  id: 'com.gulfos.find-my',
  bundleId: 'com.gulfos.find-my',
  name: 'Find My',
  version: '1.0.0',
  description: 'Locate and secure your devices',
  icon: '📍',
  category: 'utilities',
  permissions: ['location', 'notifications'],
  minOSVersion: '1.0.0',
  isSystemApp: true,
  route: '/find-my',
};
