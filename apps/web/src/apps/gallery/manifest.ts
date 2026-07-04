import type { AppManifest } from '@/types';

export const galleryManifest: AppManifest = {
  id: 'com.gulfos.gallery',
  bundleId: 'com.gulfos.gallery',
  name: 'Gallery',
  version: '1.0.0',
  description: 'Photos, videos, albums, and memories',
  icon: '🖼️',
  category: 'media',
  permissions: ['photos', 'storage'],
  minOSVersion: '1.0.0',
  isSystemApp: true,
  route: '/gallery',
};
