import type { AppManifest } from '@/types';

export const calendarManifest: AppManifest = {
  id: 'com.gulfos.calendar',
  bundleId: 'com.gulfos.calendar',
  name: 'Calendar',
  version: '1.0.0',
  description: 'Events, reminders, and schedules',
  icon: '📅',
  category: 'productivity',
  permissions: ['notifications', 'contacts'],
  minOSVersion: '1.0.0',
  isSystemApp: true,
  route: '/calendar',
};
