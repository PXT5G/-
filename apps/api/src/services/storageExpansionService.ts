import crypto from 'crypto';
import { Types } from 'mongoose';
import { buildStorageBreakdown } from './deviceStorageService';
import { getTrash, emptyTrash } from './mediaStorageService';
import { clearAppCache } from './storageService';
import { InstalledApp } from '../database/models/InstalledApp';
import { AppStorage } from '../database/models/AppStorage';
import { FileNode } from '../database/models/FileNode';
import { logDeviceEcosystemAudit } from './deviceEcosystemAuditService';
import { emitToUser } from './socketService';

export async function getExpandedStorageBreakdown(userId: string) {
  const base = await buildStorageBreakdown(userId);
  const trash = await getTrash(userId);
  const trashBytes = trash.totalSize;

  const appStorages = await AppStorage.find({ userId });
  const cacheBytes = appStorages.reduce((sum, a) => sum + (a.cacheSize ?? 0) + (a.tempSize ?? 0), 0);
  const appDataBytes = appStorages.reduce((sum, a) => sum + (a.userDataSize ?? 0) + (a.documentsSize ?? 0), 0);
  const mediaBytes = appStorages.reduce((sum, a) => sum + (a.mediaSize ?? 0), 0);

  return {
    ...base,
    expanded: {
      downloads: base.downloads,
      trash: trashBytes,
      cache: cacheBytes,
      applicationData: appDataBytes,
      mediaLibrary: mediaBytes + base.photosVideos,
      system: base.system,
    },
    trashItemCount: trash.count,
  };
}

export async function detectDuplicates(userId: string) {
  const files = await FileNode.find({ userId, type: 'file', deletedAt: null });
  const hashMap = new Map<string, typeof files>();
  for (const f of files) {
    const key = `${f.name}:${f.size}`;
    const group = hashMap.get(key) ?? [];
    group.push(f);
    hashMap.set(key, group);
  }

  const duplicates = Array.from(hashMap.values())
    .filter((g) => g.length > 1)
    .map((group) => ({
      name: group[0].name,
      size: group[0].size,
      count: group.length,
      fileIds: group.map((f) => f._id.toString()),
      wastedBytes: (group[0].size ?? 0) * (group.length - 1),
    }));

  const totalWasted = duplicates.reduce((sum, d) => sum + d.wastedBytes, 0);
  return { duplicates, totalWasted, duplicateGroups: duplicates.length };
}

export async function systemCleanup(userId: string, actorId: string) {
  const apps = await InstalledApp.find({ userId, deletedAt: null });
  let bytesFreed = 0;
  for (const app of apps) {
    const before = await AppStorage.findOne({ userId, bundleId: app.bundleId });
    await clearAppCache(userId, app.bundleId);
    const after = await AppStorage.findOne({ userId, bundleId: app.bundleId });
    if (before && after) bytesFreed += Math.max(0, (before.cacheSize ?? 0) - (after.cacheSize ?? 0));
  }

  const { recalculateDeviceStorage } = await import('./deviceStorageService');
  await recalculateDeviceStorage(userId);

  await logDeviceEcosystemAudit({ userId, actorId, action: 'system_cleanup', subsystem: 'storage', metadata: { bytesFreed } });
  emitToUser(userId, 'device:storage:updated', { bytesFreed, action: 'system_cleanup' });
  return { bytesFreed, appsProcessed: apps.length };
}

export async function emptyTrashWithAudit(userId: string, actorId: string) {
  const bytesFreed = await emptyTrash(userId);
  const result = { bytesFreed };
  await logDeviceEcosystemAudit({ userId, actorId, action: 'empty_trash', subsystem: 'storage', metadata: result });
  emitToUser(userId, 'device:storage:updated', { action: 'empty_trash' });
  return result;
}
