import type { AppManifest } from '@/types';

export const phoneManifest: AppManifest = {
  id: 'com.bananaos.phone',
  bundleId: 'com.bananaos.phone',
  name: 'Phone',
  version: '1.0.0',
  description: 'Premium BananaOS dialer with realtime calls, voicemail, and emergency support',
  icon: '📞',
  category: 'communication',
  permissions: ['microphone', 'contacts', 'notifications'],
  minOSVersion: '1.0.0',
  isSystemApp: false,
  route: '/phone',
};
