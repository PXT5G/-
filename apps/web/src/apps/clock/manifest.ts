import type { AppManifest } from '@/types';

export const clockManifest: AppManifest = {
  id: 'com.bananaos.clock',
  bundleId: 'com.bananaos.clock',
  name: 'Clock',
  version: '1.0.0',
  description: 'Alarms, stopwatch, timer, world clock',
  icon: '⏰',
  category: 'utilities',
  permissions: ['notifications'],
  minOSVersion: '1.0.0',
  isSystemApp: true,
  route: '/clock',
};
