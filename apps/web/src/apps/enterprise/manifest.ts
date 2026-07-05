import type { AppManifest } from '@/types';

export const enterpriseManifest: AppManifest = {
  id: 'com.gulfos.enterprise',
  bundleId: 'com.gulfos.enterprise',
  name: 'Enterprise',
  version: '1.0.0',
  description: 'Enterprise organization management',
  icon: '🏢',
  category: 'system',
  permissions: ['notifications'],
  minOSVersion: '1.0.0',
  isSystemApp: true,
  route: '/enterprise',
};
