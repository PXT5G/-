import type { AppManifest } from '@/types';

export const notesManifest: AppManifest = {
  id: 'com.gulfos.notes',
  bundleId: 'com.gulfos.notes',
  name: 'Notes',
  version: '1.0.0',
  description: 'Rich notes with checklists and voice',
  icon: '📝',
  category: 'productivity',
  permissions: ['storage', 'microphone'],
  minOSVersion: '1.0.0',
  isSystemApp: true,
  route: '/notes',
};
