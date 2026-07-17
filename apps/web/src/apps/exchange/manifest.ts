import type { AppManifest } from '@/types';

export const exchangeManifest: AppManifest = {
  id: 'com.gulfos.exchange',
  bundleId: 'com.gulfos.exchange',
  name: 'GULF Exchange',
  version: '1.0.0',
  description: 'Official stock exchange and investment platform',
  icon: '📈',
  category: 'finance',
  permissions: ['location', 'network', 'notifications', 'storage'],
  minOSVersion: '1.0.0',
  isSystemApp: false,
  route: '/exchange',
};
