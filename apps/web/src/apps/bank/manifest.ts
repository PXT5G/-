import type { AppManifest } from '@/types';

export const bankManifest: AppManifest = {
  id: 'com.bananaos.bank',
  bundleId: 'com.bananaos.bank',
  name: 'Banana Bank',
  version: '2.1.0',
  description: 'Premium digital banking for BananaOS',
  icon: '🏦',
  category: 'finance',
  permissions: ['network', 'notifications', 'biometrics', 'storage'],
  minOSVersion: '1.0.0',
  isSystemApp: false,
  route: '/bank',
};
