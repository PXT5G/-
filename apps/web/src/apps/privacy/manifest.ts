import type { AppManifest } from '@/types';

export const privacyManifest: AppManifest = {
  id: 'com.gulfos.privacy',
  bundleId: 'com.gulfos.privacy',
  name: 'Privacy',
  version: '1.0.0',
  description: 'Privacy Center — permission grants, tracking protection',
  icon: '🔒',
  category: 'system',
  permissions: ['notifications'],
  minOSVersion: '1.0.0',
  isSystemApp: true,
  route: '/privacy',
};
