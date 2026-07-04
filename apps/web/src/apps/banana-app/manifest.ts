import type { AppManifest } from '@/types';

export const gulfStoreManifest: AppManifest = {
  id: 'com.gulfos.store',
  bundleId: 'com.gulfos.store',
  name: 'GULF Store',
  version: '1.0.0',
  description: 'Premium application marketplace for GULFOS',
  icon: '🏬',
  category: 'system',
  permissions: ['network', 'storage', 'notifications'],
  minOSVersion: '1.0.0',
  isSystemApp: true,
  route: '/store',
};
