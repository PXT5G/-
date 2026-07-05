import type { AppManifest } from '@/types';

export const automationManifest: AppManifest = {
  id: 'com.gulfos.automation',
  bundleId: 'com.gulfos.automation',
  name: 'Automation',
  version: '1.0.0',
  description: 'Workflow automation — triggers, conditions, actions',
  icon: '⚡',
  category: 'productivity',
  permissions: ['notifications', 'network', 'location'],
  minOSVersion: '1.0.0',
  isSystemApp: true,
  route: '/automation',
};
