import type { AppManifest } from '@/types';

export const cameraManifest: AppManifest = {
  id: 'com.bananaos.camera',
  bundleId: 'com.bananaos.camera',
  name: 'Camera',
  version: '1.0.0',
  description: 'Professional camera with photo and video',
  icon: '📷',
  category: 'media',
  permissions: ['camera', 'microphone', 'storage'],
  minOSVersion: '1.0.0',
  isSystemApp: true,
  route: '/camera',
};
