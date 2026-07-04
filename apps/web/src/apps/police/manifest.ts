import type { AppManifest } from '@/types';

export const policeManifest: AppManifest = {
  id: 'com.gulfos.police',
  bundleId: 'com.gulfos.police',
  name: 'GULF Police',
  version: '1.0.0',
  description: 'Professional law enforcement MDT platform',
  icon: '🚔',
  category: 'utilities',
  permissions: ['location', 'camera', 'notifications', 'network'],
  minOSVersion: '1.0.0',
  isSystemApp: false,
  route: '/police',
};
