export type AppStatus = 'full' | 'partial' | 'failed' | 'skipped' | 'untested';

export interface AppEntry {
  bundleId: string;
  name: string;
  category: string;
}

/** All apps registered in registerSystemApps.ts */
export const GULFOS_APPS: AppEntry[] = [
  { bundleId: 'com.gulfos.settings', name: 'Settings', category: 'system' },
  { bundleId: 'com.gulfos.store', name: 'GULF Store', category: 'system' },
  { bundleId: 'com.gulfos.maps', name: 'GULF Maps', category: 'utilities' },
  { bundleId: 'com.gulfos.camera', name: 'Camera', category: 'media' },
  { bundleId: 'com.gulfos.gallery', name: 'Gallery', category: 'media' },
  { bundleId: 'com.gulfos.files', name: 'Files', category: 'utilities' },
  { bundleId: 'com.gulfos.calendar', name: 'Calendar', category: 'productivity' },
  { bundleId: 'com.gulfos.clock', name: 'Clock', category: 'utilities' },
  { bundleId: 'com.gulfos.calculator', name: 'Calculator', category: 'utilities' },
  { bundleId: 'com.gulfos.notes', name: 'Notes', category: 'productivity' },
  { bundleId: 'com.gulfos.recorder', name: 'GULF Recorder', category: 'media' },
  { bundleId: 'com.gulfos.weather', name: 'Weather', category: 'utilities' },
  { bundleId: 'com.gulfos.police', name: 'GULF Police', category: 'government' },
  { bundleId: 'com.gulfos.poetry', name: 'GULF Poetry', category: 'social' },
  { bundleId: 'com.gulfos.browser', name: 'GULF Browser', category: 'utilities' },
  { bundleId: 'com.gulfos.chat', name: 'GULF Chat', category: 'communication' },
  { bundleId: 'com.gulfos.justice', name: 'GULF Justice', category: 'government' },
  { bundleId: 'com.gulfos.ems', name: 'GULF EMS', category: 'government' },
  { bundleId: 'com.gulfos.business', name: 'GULF Business', category: 'finance' },
  { bundleId: 'com.gulfos.real-estate', name: 'GULF Real Estate', category: 'finance' },
  { bundleId: 'com.gulfos.vehicles', name: 'GULF Auto', category: 'finance' },
  { bundleId: 'com.gulfos.aviation', name: 'GULF Aviation', category: 'finance' },
  { bundleId: 'com.gulfos.marine', name: 'GULF Marine', category: 'finance' },
  { bundleId: 'com.gulfos.exchange', name: 'GULF Exchange', category: 'finance' },
  { bundleId: 'com.gulfos.phone', name: 'Phone', category: 'communication' },
  { bundleId: 'com.gulfos.contacts', name: 'Contacts', category: 'communication' },
  { bundleId: 'com.gulfos.messages', name: 'Messages', category: 'communication' },
  { bundleId: 'com.gulfos.mail', name: 'Mail', category: 'communication' },
  { bundleId: 'com.gulfos.sim', name: 'SIM', category: 'communication' },
  { bundleId: 'com.gulfos.bank', name: 'GULF Bank', category: 'finance' },
  { bundleId: 'com.gulfos.identity', name: 'Identity', category: 'utilities' },
  { bundleId: 'com.gulfos.assistant', name: 'Assistant', category: 'productivity' },
  { bundleId: 'com.gulfos.automation', name: 'Automation', category: 'productivity' },
  { bundleId: 'com.gulfos.shortcuts', name: 'Shortcuts', category: 'productivity' },
  { bundleId: 'com.gulfos.focus', name: 'Focus', category: 'productivity' },
  { bundleId: 'com.gulfos.intelligence', name: 'Intelligence', category: 'productivity' },
  { bundleId: 'com.gulfos.personalization', name: 'Personalization', category: 'system' },
  { bundleId: 'com.gulfos.security', name: 'Security', category: 'system' },
  { bundleId: 'com.gulfos.privacy', name: 'Privacy', category: 'system' },
  { bundleId: 'com.gulfos.cloud', name: 'GULF Cloud', category: 'system' },
  { bundleId: 'com.gulfos.find-my', name: 'Find My', category: 'system' },
  { bundleId: 'com.gulfos.developer', name: 'Developer', category: 'system' },
  { bundleId: 'com.gulfos.analytics', name: 'Analytics', category: 'system' },
  { bundleId: 'com.gulfos.diagnostics', name: 'Diagnostics', category: 'system' },
  { bundleId: 'com.gulfos.enterprise', name: 'Enterprise', category: 'system' },
  { bundleId: 'com.gulfos.performance', name: 'Performance', category: 'system' },
  { bundleId: 'com.gulfos.updates', name: 'Updates', category: 'system' },
];

export const DEMO_CREDENTIALS = {
  email: 'demo@gulfos.app',
  password: 'Demo1234!',
  username: 'demouser',
};
