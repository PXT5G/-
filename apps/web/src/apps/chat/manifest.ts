import type { AppManifest } from '@/types';

export const chatManifest: AppManifest = {
  id: 'com.gulfos.chat',
  bundleId: 'com.gulfos.chat',
  name: 'GULF Chat',
  version: '1.0.0',
  description: 'Official GULFOS instant messaging — private, groups, channels, calls',
  icon: '💬',
  category: 'communication',
  permissions: ['network', 'contacts', 'storage', 'notifications', 'microphone', 'camera', 'photos', 'biometrics'],
  minOSVersion: '1.0.0',
  isSystemApp: false,
  route: '/chat',
};
