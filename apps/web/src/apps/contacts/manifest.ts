import type { AppManifest } from '@/types';

export const contactsManifest: AppManifest = {
  id: 'com.gulfos.contacts',
  bundleId: 'com.gulfos.contacts',
  name: 'Contacts',
  version: '1.0.0',
  description: 'GULF Contacts — personal, business, government',
  icon: '👤',
  category: 'communication',
  permissions: ['contacts', 'notifications'],
  minOSVersion: '1.0.0',
  isSystemApp: true,
  route: '/contacts',
};
