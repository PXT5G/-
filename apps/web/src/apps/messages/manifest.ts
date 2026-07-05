import type { AppManifest } from '@/types';

export const messagesManifest: AppManifest = {
  id: 'com.gulfos.messages',
  bundleId: 'com.gulfos.messages',
  name: 'Messages',
  version: '1.0.0',
  description: 'GULF Messages — SMS and MMS',
  icon: '💬',
  category: 'communication',
  permissions: ['phone', 'contacts', 'notifications', 'storage'],
  minOSVersion: '1.0.0',
  isSystemApp: true,
  route: '/messages',
};
