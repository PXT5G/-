import type { AppManifest } from '@/types';

export const updatesManifest: AppManifest = {
  id: 'com.gulfos.updates',
  bundleId: 'com.gulfos.updates',
  name: 'Updates',
  version: '1.0.0',
  description: 'System and app updates',
  icon: '⬆️',
  category: 'system',
  permissions: ['notifications', 'storage'],
  minOSVersion: '1.0.0',
  isSystemApp: true,
  route: '/updates',
};
