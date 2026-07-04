import type { AppManifest } from '@/types';

export const voiceRecorderManifest: AppManifest = {
  id: 'com.bananaos.voicerecorder',
  bundleId: 'com.bananaos.voicerecorder',
  name: 'Voice Recorder',
  version: '1.0.0',
  description: 'Record, trim, and share audio',
  icon: '🎙️',
  category: 'media',
  permissions: ['microphone', 'storage'],
  minOSVersion: '1.0.0',
  isSystemApp: true,
  route: '/voice-recorder',
};
