import fs from 'fs/promises';
import path from 'path';
import { Types } from 'mongoose';
import { AppStorage } from '../database/models/AppStorage';
import { InstalledApp } from '../database/models/InstalledApp';
import { getAppPackageSize } from '../constants/appSizes';
import { recalculateDeviceStorage } from './deviceStorageService';

const STORAGE_ROOT = path.join(process.cwd(), 'data', 'app-storage');

export async function ensureAppStorageDir(userId: string, bundleId: string): Promise<string> {
  const dir = path.join(STORAGE_ROOT, userId, bundleId);
  const subdirs = ['cache', 'documents', 'media', 'downloads', 'temp', 'logs', 'userdata'];
  for (const sub of subdirs) {
    await fs.mkdir(path.join(dir, sub), { recursive: true });
  }
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

function computeTotal(storage: {
  appSize: number;
  userDataSize: number;
  cacheSize: number;
  tempSize: number;
  downloadsSize: number;
  logsSize: number;
  documentsSize: number;
  mediaSize: number;
}): number {
  return (
    storage.appSize +
    storage.userDataSize +
    storage.cacheSize +
    storage.tempSize +
    storage.downloadsSize +
    storage.logsSize +
    storage.documentsSize +
    storage.mediaSize
  );
}

export async function initAppStorage(
  userId: string,
  bundleId: string,
  appSize?: number
): Promise<void> {
  const size = appSize ?? getAppPackageSize(bundleId);
  await ensureAppStorageDir(userId, bundleId);

  const initialCache = Math.floor(size * 0.08);
  const initialLogs = Math.floor(size * 0.02);

  await AppStorage.findOneAndUpdate(
    { userId, bundleId },
    {
      userId: new Types.ObjectId(userId),
      bundleId,
      appSize: size,
      userDataSize: 0,
      cacheSize: initialCache,
      tempSize: 0,
      downloadsSize: 0,
      logsSize: initialLogs,
      documentsSize: 0,
      mediaSize: 0,
      totalSize: size + initialCache + initialLogs,
    },
    { upsert: true }
  );

  await recalculateDeviceStorage(userId);
}

export async function getAppStorage(userId: string, bundleId: string) {
  await refreshStorageSizes(userId, bundleId);
  const storage = await AppStorage.findOne({ userId, bundleId });
  if (!storage) {
    return {
      appSize: 0,
      userDataSize: 0,
      cacheSize: 0,
      tempSize: 0,
      downloadsSize: 0,
      logsSize: 0,
      documentsSize: 0,
      mediaSize: 0,
      totalSize: 0,
    };
  }
  return {
    appSize: storage.appSize,
    userDataSize: storage.userDataSize,
    cacheSize: storage.cacheSize,
    tempSize: storage.tempSize,
    downloadsSize: storage.downloadsSize,
    logsSize: storage.logsSize,
    documentsSize: storage.documentsSize,
    mediaSize: storage.mediaSize,
    totalSize: storage.totalSize,
  };
}

export async function getTotalStorage(userId: string) {
  const items = await AppStorage.find({ userId });
  return items.reduce(
    (acc, s) => ({
      appSize: acc.appSize + s.appSize + s.userDataSize,
      cacheSize: acc.cacheSize + s.cacheSize + s.tempSize,
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
  const base = path.join(STORAGE_ROOT, userId, bundleId);
  for (const sub of ['cache', 'temp']) {
    const dir = path.join(base, sub);
    await fs.rm(dir, { recursive: true, force: true });
    await fs.mkdir(dir, { recursive: true });
  }
  await AppStorage.findOneAndUpdate(
    { userId, bundleId },
    { cacheSize: 0, tempSize: 0 }
  );
  await recalcTotal(userId, bundleId);
  await recalculateDeviceStorage(userId);
}

export async function clearData(userId: string, bundleId: string): Promise<void> {
  const base = path.join(STORAGE_ROOT, userId, bundleId);
  for (const sub of ['userdata', 'documents', 'media', 'downloads', 'logs']) {
    const dir = path.join(base, sub);
    await fs.rm(dir, { recursive: true, force: true });
    await fs.mkdir(dir, { recursive: true });
  }
  const storage = await AppStorage.findOne({ userId, bundleId });
  if (storage) {
    storage.userDataSize = 0;
    storage.documentsSize = 0;
    storage.mediaSize = 0;
    storage.downloadsSize = 0;
    storage.logsSize = 0;
    storage.totalSize = computeTotal(storage);
    await storage.save();
    await InstalledApp.findOneAndUpdate({ userId, bundleId }, { storageBytes: storage.totalSize });
  }
  await recalculateDeviceStorage(userId);
}

export async function removeAppStorage(
  userId: string,
  bundleId: string,
  options: { keepUserData?: boolean; keepSettings?: boolean; keepSession?: boolean }
): Promise<number> {
  const storage = await AppStorage.findOne({ userId, bundleId });
  const freedBytes = storage?.totalSize ?? 0;

  if (options.keepUserData || options.keepSettings || options.keepSession) {
    const base = path.join(STORAGE_ROOT, userId, bundleId);
    await fs.rm(path.join(base, 'cache'), { recursive: true, force: true }).catch(() => {});
    await fs.rm(path.join(base, 'temp'), { recursive: true, force: true }).catch(() => {});
    await fs.mkdir(path.join(base, 'cache'), { recursive: true });
    await fs.mkdir(path.join(base, 'temp'), { recursive: true });
    if (storage) {
      const kept = storage.userDataSize + storage.documentsSize + storage.mediaSize;
      storage.appSize = 0;
      storage.cacheSize = 0;
      storage.tempSize = 0;
      storage.downloadsSize = 0;
      storage.logsSize = 0;
      storage.totalSize = kept;
      await storage.save();
    }
  } else {
    const dir = path.join(STORAGE_ROOT, userId, bundleId);
    await fs.rm(dir, { recursive: true, force: true });
    await AppStorage.deleteOne({ userId, bundleId });
  }

  await recalculateDeviceStorage(userId);
  return options.keepUserData ? (storage?.userDataSize ?? 0) : freedBytes;
}

async function recalcTotal(userId: string, bundleId: string): Promise<void> {
  const storage = await AppStorage.findOne({ userId, bundleId });
  if (!storage) return;
  storage.totalSize = computeTotal(storage);
  await storage.save();
  await InstalledApp.findOneAndUpdate({ userId, bundleId }, { storageBytes: storage.totalSize });
}

export async function refreshStorageSizes(userId: string, bundleId: string): Promise<void> {
  const base = path.join(STORAGE_ROOT, userId, bundleId);
  const storage = await AppStorage.findOne({ userId, bundleId });
  if (!storage) return;

  const cacheSize = await dirSize(path.join(base, 'cache'));
  const tempSize = await dirSize(path.join(base, 'temp'));
  const documentsSize = await dirSize(path.join(base, 'documents'));
  const mediaSize = await dirSize(path.join(base, 'media'));
  const downloadsSize = await dirSize(path.join(base, 'downloads'));
  const logsSize = await dirSize(path.join(base, 'logs'));
  const userDataSize = await dirSize(path.join(base, 'userdata'));

  storage.cacheSize = Math.max(storage.cacheSize, cacheSize);
  storage.tempSize = tempSize;
  storage.documentsSize = documentsSize;
  storage.mediaSize = mediaSize;
  storage.downloadsSize = downloadsSize;
  storage.logsSize = Math.max(storage.logsSize, logsSize);
  storage.userDataSize = userDataSize;
  storage.totalSize = computeTotal(storage);
  await storage.save();
  await InstalledApp.findOneAndUpdate({ userId, bundleId }, { storageBytes: storage.totalSize });
}

export async function growAppCache(userId: string, bundleId: string, bytes: number): Promise<void> {
  const storage = await AppStorage.findOne({ userId, bundleId });
  if (!storage) return;
  storage.cacheSize += bytes;
  storage.totalSize = computeTotal(storage);
  await storage.save();
  await InstalledApp.findOneAndUpdate({ userId, bundleId }, { storageBytes: storage.totalSize });
  await recalculateDeviceStorage(userId);
}
