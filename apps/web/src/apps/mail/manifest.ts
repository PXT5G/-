import type { AppManifest } from '@/types';

export const mailManifest: AppManifest = {
  id: 'com.gulfos.mail',
  bundleId: 'com.gulfos.mail',
  name: 'Mail',
  version: '1.0.0',
  description: 'GULF Mail — email client',
  icon: '📧',
  category: 'communication',
  permissions: ['notifications', 'storage'],
  minOSVersion: '1.0.0',
  isSystemApp: true,
  route: '/mail',
};
