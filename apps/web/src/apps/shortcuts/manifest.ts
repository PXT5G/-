import type { AppManifest } from '@/types';

export const shortcutsManifest: AppManifest = {
  id: 'com.gulfos.shortcuts',
  bundleId: 'com.gulfos.shortcuts',
  name: 'Shortcuts',
  version: '1.0.0',
  description: 'Automation shortcuts — actions, variables, workflows',
  icon: '⚡',
  category: 'productivity',
  permissions: ['notifications', 'storage'],
  minOSVersion: '1.0.0',
  isSystemApp: true,
  route: '/shortcuts',
};
