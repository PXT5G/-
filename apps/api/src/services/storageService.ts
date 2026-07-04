import fs from 'fs/promises';
import path from 'path';
import { Types } from 'mongoose';
import { AppStorage } from '../database/models/AppStorage';
import { InstalledApp } from '../database/models/InstalledApp';

const STORAGE_ROOT = path.join(process.cwd(), 'data', 'app-storage');

export async function ensureAppStorageDir(userId: string, bundleId: string): Promise<string> {
  const dir = path.join(STORAGE_ROOT, userId, bundleId);
  await fs.mkdir(path.join(dir, 'cache'), { recursive: true });
  await fs.mkdir(path.join(dir, 'documents'), { recursive: true });
  await fs.mkdir(path.join(dir, 'media'), { recursive: true });
  return dir;
}

async function dirSize(dirPath: string): Promise<number> {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    let total = 0;
    for (const entry of entries) {
      const full = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        total += await dirSize(full);
      } else {
        const stat = await fs.stat(full);
        total += stat.size;
      }
    }
    return total;
  } catch {
    return 0;
  }
}

export async function initAppStorage(
  userId: string,
  bundleId: string,
  appSize: number
): Promise<void> {
  await ensureAppStorageDir(userId, bundleId);
  await AppStorage.findOneAndUpdate(
    { userId, bundleId },
    {
      userId: new Types.ObjectId(userId),
      bundleId,
      appSize,
      cacheSize: Math.floor(appSize * 0.1),
      documentsSize: 0,
      mediaSize: 0,
      totalSize: appSize + Math.floor(appSize * 0.1),
    },
    { upsert: true }
  );
}

export async function getAppStorage(userId: string, bundleId: string) {
  const storage = await AppStorage.findOne({ userId, bundleId });
  if (!storage) {
    return { appSize: 0, cacheSize: 0, documentsSize: 0, mediaSize: 0, totalSize: 0 };
  }
  return {
    appSize: storage.appSize,
    cacheSize: storage.cacheSize,
    documentsSize: storage.documentsSize,
    mediaSize: storage.mediaSize,
    totalSize: storage.totalSize,
  };
}

export async function getTotalStorage(userId: string) {
  const items = await AppStorage.find({ userId });
  return items.reduce(
    (acc, s) => ({
      appSize: acc.appSize + s.appSize,
      cacheSize: acc.cacheSize + s.cacheSize,
      documentsSize: acc.documentsSize + s.documentsSize,
      mediaSize: acc.mediaSize + s.mediaSize,
      totalSize: acc.totalSize + s.totalSize,
    }),
    { appSize: 0, cacheSize: 0, documentsSize: 0, mediaSize: 0, totalSize: 0 }
  );
}

export async function clearAppCache(userId: string, bundleId: string) {
  await clearCache(userId, bundleId);
  return getAppStorage(userId, bundleId);
}

export async function clearAppData(userId: string, bundleId: string) {
  await clearData(userId, bundleId);
  return getAppStorage(userId, bundleId);
}

export async function clearCache(userId: string, bundleId: string): Promise<void> {
  const dir = path.join(STORAGE_ROOT, userId, bundleId, 'cache');
  await fs.rm(dir, { recursive: true, force: true });
  await fs.mkdir(dir, { recursive: true });
  await AppStorage.findOneAndUpdate({ userId, bundleId }, { cacheSize: 0 });
  await recalcTotal(userId, bundleId);
}

export async function clearData(userId: string, bundleId: string): Promise<void> {
  const dir = path.join(STORAGE_ROOT, userId, bundleId);
  await fs.rm(dir, { recursive: true, force: true });
  await AppStorage.findOneAndUpdate(
    { userId, bundleId },
    { cacheSize: 0, documentsSize: 0, mediaSize: 0, totalSize: 0 }
  );
}

export async function removeAppStorage(userId: string, bundleId: string, keepData: boolean): Promise<void> {
  if (!keepData) {
    const dir = path.join(STORAGE_ROOT, userId, bundleId);
    await fs.rm(dir, { recursive: true, force: true });
    await AppStorage.deleteOne({ userId, bundleId });
  }
}

async function recalcTotal(userId: string, bundleId: string): Promise<void> {
  const storage = await AppStorage.findOne({ userId, bundleId });
  if (!storage) return;
  storage.totalSize = storage.appSize + storage.cacheSize + storage.documentsSize + storage.mediaSize;
  await storage.save();
  await InstalledApp.findOneAndUpdate({ userId, bundleId }, { storageBytes: storage.totalSize });
}

export async function refreshStorageSizes(userId: string, bundleId: string): Promise<void> {
  const base = path.join(STORAGE_ROOT, userId, bundleId);
  const cacheSize = await dirSize(path.join(base, 'cache'));
  const documentsSize = await dirSize(path.join(base, 'documents'));
  const mediaSize = await dirSize(path.join(base, 'media'));
  const storage = await AppStorage.findOne({ userId, bundleId });
  if (storage) {
    storage.cacheSize = cacheSize;
    storage.documentsSize = documentsSize;
    storage.mediaSize = mediaSize;
    storage.totalSize = storage.appSize + cacheSize + documentsSize + mediaSize;
    await storage.save();
  }
}
