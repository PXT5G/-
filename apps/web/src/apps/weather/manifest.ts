import type { AppManifest } from '@/types';

export const weatherManifest: AppManifest = {
  id: 'com.bananaos.weather',
  bundleId: 'com.bananaos.weather',
  name: 'Weather',
  version: '1.0.0',
  description: 'Current, hourly, and weekly forecasts',
  icon: '🌤️',
  category: 'utilities',
  permissions: ['location', 'network'],
  minOSVersion: '1.0.0',
  isSystemApp: true,
  route: '/weather',
};
