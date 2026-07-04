import type { AppManifest } from '@/types';

export const bankManifest: AppManifest = {
  id: 'com.gulfos.bank',
  bundleId: 'com.gulfos.bank',
  name: 'GULF Bank',
  version: '1.0.0',
  description: 'Personal banking — accounts, cards, transfers, budget',
  icon: '🏦',
  category: 'finance',
  permissions: ['bank', 'notifications', 'biometrics'],
  minOSVersion: '1.0.0',
  isSystemApp: false,
  route: '/bank',
};
