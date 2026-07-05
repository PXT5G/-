import type { AppManifest } from '@/types';

export const diagnosticsManifest: AppManifest = {
  id: 'com.gulfos.diagnostics',
  bundleId: 'com.gulfos.diagnostics',
  name: 'Diagnostics',
  version: '1.0.0',
  description: 'System diagnostics and performance reports',
  icon: '🩺',
  category: 'utilities',
  permissions: ['notifications'],
  minOSVersion: '1.0.0',
  isSystemApp: true,
  route: '/diagnostics',
};
