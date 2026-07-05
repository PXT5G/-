import type { AppManifest } from '@/types';

export const developerManifest: AppManifest = {
  id: 'com.gulfos.developer',
  bundleId: 'com.gulfos.developer',
  name: 'Developer',
  version: '1.0.0',
  description: 'Developer Mode — background tasks, jobs, diagnostics',
  icon: '🔧',
  category: 'utilities',
  permissions: ['notifications'],
  minOSVersion: '1.0.0',
  isSystemApp: true,
  route: '/developer',
};
