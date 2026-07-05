import type { AppManifest } from '@/types';

export const intelligenceManifest: AppManifest = {
  id: 'com.gulfos.intelligence',
  bundleId: 'com.gulfos.intelligence',
  name: 'Intelligence',
  version: '1.0.0',
  description: 'Predictions, suggestions, search index, smart dashboards',
  icon: '🧠',
  category: 'utilities',
  permissions: ['notifications'],
  minOSVersion: '1.0.0',
  isSystemApp: true,
  route: '/intelligence',
};
