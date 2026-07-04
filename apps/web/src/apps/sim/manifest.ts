import type { AppManifest } from '@/types';

export const simManifest: AppManifest = {
  id: 'com.gulfos.sim',
  bundleId: 'com.gulfos.sim',
  name: 'SIM',
  version: '1.0.0',
  description: 'GULF SIM Manager — dual SIM, carrier, network',
  icon: '📶',
  category: 'system',
  permissions: ['network', 'phone'],
  minOSVersion: '1.0.0',
  isSystemApp: true,
  route: '/sim',
};
