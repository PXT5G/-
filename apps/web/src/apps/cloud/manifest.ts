import type { AppManifest } from '@/types';

export const cloudManifest: AppManifest = {
  id: 'com.gulfos.cloud',
  bundleId: 'com.gulfos.cloud',
  name: 'GULF Cloud',
  version: '1.0.0',
  description: 'Cloud backup, restore, and sync',
  icon: '☁️',
  category: 'system',
  permissions: ['storage', 'notifications'],
  minOSVersion: '1.0.0',
  isSystemApp: true,
  route: '/cloud',
};
