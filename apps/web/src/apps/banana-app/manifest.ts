import type { AppManifest } from '@/types';

export const bananaAppManifest: AppManifest = {
  id: 'com.bananaos.store',
  bundleId: 'com.bananaos.store',
  name: 'Banana App',
  version: '1.0.0',
  description: 'Premium application marketplace for BananaOS',
  icon: '🍌',
  category: 'system',
  permissions: ['network', 'storage', 'notifications'],
  minOSVersion: '1.0.0',
  isSystemApp: true,
  route: '/store',
};
