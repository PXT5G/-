import { Types } from 'mongoose';
import { AppStorage } from '../database/models/AppStorage';
import { TrashItem } from '../database/models/TrashItem';
import { estimatePhotoSize, estimateVideoSize } from '../constants/hardwareSpecs';
import { recalculateDeviceStorage } from './deviceStorageService';
import { recordStorageWrite } from './storageWearService';

const TRASH_RETENTION_DAYS = 30;

export async function addToTrash(
  userId: string,
  bundleId: string,
  name: string,
  sizeBytes: number,
  type: 'photo' | 'video' | 'document' | 'download' | 'other',
  metadata?: Record<string, unknown>
) {
  const expiresAt = new Date(Date.now() + TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  await TrashItem.create({
    userId: new Types.ObjectId(userId),
    bundleId,
    name,
    type,
    sizeBytes,
    expiresAt,
    metadata,
  });
  await recalculateDeviceStorage(userId);
}

export async function addPhoto(
  userId: string,
  bundleId: string,
  megapixels: number
): Promise<number> {
  const size = estimatePhotoSize(megapixels);
  const { growAppCache } = await import('./storageService');
  await growAppCache(userId, bundleId, size);
  await recordStorageWrite(userId, size);

  await AppStorage.findOneAndUpdate(
    { userId, bundleId },
    { $inc: { mediaSize: size } }
  );
  await recalculateDeviceStorage(userId);
  return size;
}

export async function addVideo(
  userId: string,
  bundleId: string,
  width: number,
  height: number,
  fps: number,
  durationSeconds: number,
  codec: 'h264' | 'hevc' = 'hevc'
): Promise<number> {
  const size = estimateVideoSize(width, height, fps, durationSeconds, codec);
  const { growAppCache } = await import('./storageService');
  await growAppCache(userId, bundleId, size);
  await recordStorageWrite(userId, size);

  await AppStorage.findOneAndUpdate(
    { userId, bundleId },
    { $inc: { mediaSize: size } }
  );
  await recalculateDeviceStorage(userId);
  return size;
}

export async function deleteToTrash(
  userId: string,
  bundleId: string,
  name: string,
  sizeBytes: number,
  type: 'photo' | 'video' | 'document' | 'download' | 'other'
) {
  await addToTrash(userId, bundleId, name, sizeBytes, type);
  const storage = await AppStorage.findOne({ userId, bundleId });
  if (storage) {
    storage.mediaSize = Math.max(0, storage.mediaSize - sizeBytes);
    storage.totalSize = Math.max(0, storage.totalSize - sizeBytes);
    await storage.save();
  }
  await recalculateDeviceStorage(userId);
}

export async function getTrash(userId: string) {
  const items = await TrashItem.find({ userId }).sort({ deletedAt: -1 });
  const totalSize = items.reduce((sum, i) => sum + i.sizeBytes, 0);
  return {
    items: items.map((i) => ({
      id: i._id.toString(),
      bundleId: i.bundleId,
      name: i.name,
      type: i.type,
      sizeBytes: i.sizeBytes,
      deletedAt: i.deletedAt.toISOString(),
      expiresAt: i.expiresAt.toISOString(),
    })),
    totalSize,
    count: items.length,
  };
}

export async function emptyTrash(userId: string): Promise<number> {
  const items = await TrashItem.find({ userId });
  const freed = items.reduce((sum, i) => sum + i.sizeBytes, 0);
  await TrashItem.deleteMany({ userId });
  await recalculateDeviceStorage(userId);
  return freed;
}

export async function purgeExpiredTrash(): Promise<number> {
  const now = new Date();
  const expired = await TrashItem.find({ expiresAt: { $lte: now } });
  const count = expired.length;
  await TrashItem.deleteMany({ expiresAt: { $lte: now } });
  return count;
}

export function startTrashCleanupSimulator(): void {
  // Deprecated: use backgroundServiceManager
}
