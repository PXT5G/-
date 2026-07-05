import type { AppManifest } from '@/types';

export const personalizationManifest: AppManifest = {
  id: 'com.gulfos.personalization',
  bundleId: 'com.gulfos.personalization',
  name: 'Personalization',
  version: '1.0.0',
  description: 'Themes, wallpapers, home layouts, lock screen profiles',
  icon: '🎨',
  category: 'system',
  permissions: ['notifications'],
  minOSVersion: '1.0.0',
  isSystemApp: true,
  route: '/personalization',
};
