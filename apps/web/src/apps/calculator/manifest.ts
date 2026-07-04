import type { AppManifest } from '@/types';

export const calculatorManifest: AppManifest = {
  id: 'com.bananaos.calculator',
  bundleId: 'com.bananaos.calculator',
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
