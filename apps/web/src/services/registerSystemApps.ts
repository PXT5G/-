'use client';

import { registerApp } from '@/services/appRouter';
import { SettingsApp } from '@/components/settings/SettingsApp';
import { BananaApp } from '@/apps/banana-app';
import { bananaAppManifest } from '@/apps/banana-app/manifest';
import { IdentityApp } from '@/apps/identity';
import { identityManifest } from '@/apps/identity/manifest';
import { BankApp } from '@/apps/bank';
import { bankManifest } from '@/apps/bank/manifest';
import { SimApp } from '@/apps/sim';
import { simManifest } from '@/apps/sim/manifest';
import { ContactsApp } from '@/apps/contacts';
import { contactsManifest } from '@/apps/contacts/manifest';
import { PoliceApp } from '@/apps/police';
import { policeManifest } from '@/apps/police/manifest';

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
registerApp(bankManifest, BankApp);
registerApp(simManifest, SimApp);
registerApp(contactsManifest, ContactsApp);
registerApp(policeManifest, PoliceApp);
