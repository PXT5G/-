import type { AppManifest } from '@/types';

export const contactsManifest: AppManifest = {
  id: 'com.bananaos.contacts',
  bundleId: 'com.bananaos.contacts',
  name: 'Contacts',
  version: '1.0.0',
  description: 'Central contact management for BananaOS',
  icon: '👤',
  category: 'communication',
  permissions: ['contacts', 'storage'],
  minOSVersion: '1.0.0',
  isSystemApp: false,
  route: '/contacts',
};
