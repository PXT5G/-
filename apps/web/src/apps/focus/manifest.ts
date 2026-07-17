import type { AppManifest } from '@/types';

export const focusManifest: AppManifest = {
  id: 'com.gulfos.focus',
  bundleId: 'com.gulfos.focus',
  name: 'Focus',
  version: '1.0.0',
  description: 'Focus modes — work, sleep, driving, and custom profiles',
  icon: '🎯',
  category: 'utilities',
  permissions: ['notifications'],
  minOSVersion: '1.0.0',
  isSystemApp: true,
  route: '/focus',
};
