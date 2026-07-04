import type { AppManifest } from '@/types';

export const simManifest: AppManifest = {
  id: 'com.bananaos.sim',
  bundleId: 'com.bananaos.sim',
  name: 'Banana SIM',
  version: '1.0.0',
  description: 'SIM profiles, phone numbers and network services',
  icon: '📶',
  category: 'communication',
  permissions: ['network', 'notifications', 'biometrics'],
  minOSVersion: '1.0.0',
  isSystemApp: false,
  route: '/sim',
};
