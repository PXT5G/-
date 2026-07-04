import type { AppManifest } from '@/types';

export const controlPanelManifest: AppManifest = {
  id: 'com.bananaos.control-panel',
  bundleId: 'com.bananaos.control-panel',
  name: 'System Control',
  version: '1.0.0',
  description: 'BananaOS internal admin control center',
  icon: '🎛️',
  category: 'system',
  permissions: [],
  minOSVersion: '1.0.0',
  isSystemApp: true,
  route: '/control-panel',
};
