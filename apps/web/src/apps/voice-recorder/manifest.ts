import type { AppManifest } from '@/types';

export const voiceRecorderManifest: AppManifest = {
  id: 'com.gulfos.recorder',
  bundleId: 'com.gulfos.recorder',
  name: 'GULF Recorder',
  version: '1.0.0',
  description: 'Record, trim, and share audio',
  icon: '🎙️',
  category: 'media',
  permissions: ['microphone', 'storage'],
  minOSVersion: '1.0.0',
  isSystemApp: true,
  route: '/voice-recorder',
};
