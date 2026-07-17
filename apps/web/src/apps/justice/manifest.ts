import type { AppManifest } from '@/types';

export const justiceManifest: AppManifest = {
  id: 'com.gulfos.justice',
  bundleId: 'com.gulfos.justice',
  name: 'GULF Justice',
  version: '1.0.0',
  description: 'Official court and judicial system MDT',
  icon: '⚖️',
  category: 'utilities',
  permissions: ['location', 'network', 'notifications', 'storage'],
  minOSVersion: '1.0.0',
  isSystemApp: false,
  route: '/justice',
};
