'use client';

import { registerApp } from '@/services/appRouter';
import { SettingsApp } from '@/components/settings/SettingsApp';
import { BananaApp } from '@/apps/banana-app';
import { bananaAppManifest } from '@/apps/banana-app/manifest';
import { IdentityApp } from '@/apps/identity';
import { identityManifest } from '@/apps/identity/manifest';

registerApp(
  {
    id: 'com.bananaos.settings',
    bundleId: 'com.bananaos.settings',
    name: 'Settings',
    version: '1.0.0',
    description: 'System settings and preferences',
    icon: '⚙️',
    category: 'system',
    permissions: [],
    minOSVersion: '1.0.0',
    isSystemApp: true,
    route: '/settings',
  },
  SettingsApp
);

registerApp(bananaAppManifest, BananaApp);
registerApp(identityManifest, IdentityApp);
