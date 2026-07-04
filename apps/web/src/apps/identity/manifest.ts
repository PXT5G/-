import type { AppManifest } from '@/types';

export const identityManifest: AppManifest = {
  id: 'com.bananaos.identity',
  bundleId: 'com.bananaos.identity',
  name: 'Identity',
  version: '1.0.0',
  description: 'Official digital identity for BananaOS',
  icon: '🪪',
  category: 'utilities',
  permissions: ['storage', 'camera', 'biometrics', 'notifications'],
  minOSVersion: '1.0.0',
  isSystemApp: true,
  route: '/identity',
};
