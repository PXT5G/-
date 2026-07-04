import { SYSTEM_APP_BUNDLES } from '../constants/systemApps';
import { ensureDefaultAlbums } from './galleryService';
import { ensureSystemFolders } from './filesAppService';
import { emitToUser } from './socketService';

export async function initializeSystemApps(userId: string) {
  await Promise.all([
    ensureDefaultAlbums(userId),
    ensureSystemFolders(userId),
  ]);

  emitToUser(userId, 'system-apps:ready', {
    apps: Object.values(SYSTEM_APP_BUNDLES),
    timestamp: new Date().toISOString(),
  });

  return { ready: true, apps: Object.values(SYSTEM_APP_BUNDLES) };
}
