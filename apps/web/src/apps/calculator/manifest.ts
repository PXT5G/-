import type { AppManifest } from '@/types';

export const calculatorManifest: AppManifest = {
  id: 'com.gulfos.calculator',
  bundleId: 'com.gulfos.calculator',
  name: 'Calculator',
  version: '1.0.0',
  description: 'Basic and scientific calculator',
  icon: '🔢',
  category: 'utilities',
  permissions: [],
  minOSVersion: '1.0.0',
  isSystemApp: true,
  route: '/calculator',
};
