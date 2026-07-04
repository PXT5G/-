import type { AppManifest } from '@/types';

export const poetryManifest: AppManifest = {
  id: 'com.gulfos.poetry',
  bundleId: 'com.gulfos.poetry',
  name: 'GULF Poetry',
  version: '1.0.0',
  description: 'Official server poetry platform — Server Poet',
  icon: '📜',
  category: 'social',
  permissions: ['network', 'storage', 'notifications', 'microphone'],
  minOSVersion: '1.0.0',
  isSystemApp: false,
  route: '/poetry',
};
