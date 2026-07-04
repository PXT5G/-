import type { AppManifest } from '@/types';

export const assistantManifest: AppManifest = {
  id: 'com.gulfos.assistant',
  bundleId: 'com.gulfos.assistant',
  name: 'Assistant',
  version: '1.0.0',
  description: 'GULF OS Assistant — voice, search, device control',
  icon: '🤖',
  category: 'utilities',
  permissions: ['notifications', 'microphone', 'contacts', 'phone', 'location'],
  minOSVersion: '1.0.0',
  isSystemApp: true,
  route: '/assistant',
};
