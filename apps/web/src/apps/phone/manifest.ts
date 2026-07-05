import type { AppManifest } from '@/types';

export const phoneManifest: AppManifest = {
  id: 'com.gulfos.phone',
  bundleId: 'com.gulfos.phone',
  name: 'Phone',
  version: '1.0.0',
  description: 'GULF Phone — calls, favorites, voicemail, emergency',
  icon: '📞',
  category: 'communication',
  permissions: ['phone', 'contacts', 'notifications', 'microphone'],
  minOSVersion: '1.0.0',
  isSystemApp: true,
  route: '/phone',
};
