import type { AppManifest } from '@/types';

export const browserManifest: AppManifest = {
  id: 'com.gulfos.browser',
  bundleId: 'com.gulfos.browser',
  name: 'GULF Browser',
  version: '1.0.0',
  description: 'Official GULFOS web browser with GULF Search and secure portals',
  icon: '🌐',
  category: 'utilities',
  permissions: ['network', 'storage', 'notifications', 'camera', 'microphone', 'location', 'biometrics'],
  minOSVersion: '1.0.0',
  isSystemApp: false,
  route: '/browser',
};
