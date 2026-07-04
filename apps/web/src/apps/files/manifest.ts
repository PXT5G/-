import type { AppManifest } from '@/types';

export const filesManifest: AppManifest = {
  id: 'com.bananaos.files',
  bundleId: 'com.bananaos.files',
  name: 'Files',
  version: '1.0.0',
  description: 'Browse and manage device storage',
  icon: '📁',
  category: 'utilities',
  permissions: ['storage', 'files'],
  minOSVersion: '1.0.0',
  isSystemApp: true,
  route: '/files',
};
