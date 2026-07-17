import type { AppManifest } from '@/types';

export const identityManifest: AppManifest = {
  id: 'com.gulfos.identity',
  bundleId: 'com.gulfos.identity',
  name: 'Identity',
  version: '1.0.0',
  description: 'Digital identity — government ID, documents, verification',
  icon: '🪪',
  category: 'utilities',
  permissions: ['identity', 'biometrics', 'notifications'],
  minOSVersion: '1.0.0',
  isSystemApp: false,
  route: '/identity',
};
