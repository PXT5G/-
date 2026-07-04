import { Types } from 'mongoose';
import { DeviceProfile, ISystemStorageBreakdown } from '../database/models/DeviceProfile';
import { StorageReservation } from '../database/models/StorageReservation';
import { AppStorage } from '../database/models/AppStorage';
import { InstalledApp } from '../database/models/InstalledApp';
import { StoreDownload } from '../database/models/StoreDownload';
import {
  DEFAULT_CAPACITY,
  STORAGE_CAPACITY_TIERS,
  formatCapacityLabel,
  type StorageCapacityTier,
} from '../constants/appSizes';
import { emitToUser } from './socketService';
import { evaluateLowStorage } from './lowStorageService';
import { recordStorageWrite, recordStorageRead } from './storageWearService';
import { TrashItem } from '../database/models/TrashItem';

const RESERVATION_TTL_MS = 30 * 60 * 1000;

export interface StorageCategoryBreakdown {
  total: number;
  used: number;
  free: number;
  system: number;
  apps: number;
  cache: number;
  photosVideos: number;
  documents: number;
  downloads: number;
  messages: number;
  audio: number;
  other: number;
  reserved: number;
  trash: number;
  freeRatio: number;
  lowStorageLevel: string;
  systemBreakdown: ISystemStorageBreakdown;
}

function computeReservedSpace(totalCapacity: number): number {
  return Math.floor(totalCapacity * 0.05);
}

function initSystemStorage(totalCapacity: number): ISystemStorageBreakdown {
  return {
    operatingSystem: 8_500_000_000,
    systemFiles: 2_100_000_000,
    logs: 250_000_000,
    updates: 0,
    recovery: 1_200_000_000,
    reservedSpace: computeReservedSpace(totalCapacity),
  };
}

function sumSystemStorage(sys: ISystemStorageBreakdown): number {
  return (
    sys.operatingSystem +
    sys.systemFiles +
    sys.logs +
    sys.updates +
    sys.recovery +
    sys.reservedSpace
  );
}

export async function ensureDeviceProfile(
  userId: string,
  capacity: StorageCapacityTier = DEFAULT_CAPACITY
): Promise<InstanceType<typeof DeviceProfile>> {
  const tier = formatCapacityLabel(capacity);
  const profile = await DeviceProfile.findOneAndUpdate(
    { userId },
    {
      userId: new Types.ObjectId(userId),
      totalCapacity: capacity,
      capacityTier: tier,
      $setOnInsert: { systemStorage: initSystemStorage(capacity) },
    },
    { upsert: true, new: true }
  );

  const { ensureHardwareProfile } = await import('./hardwareService');
  await ensureHardwareProfile(userId, profile.deviceName);

  return profile;
}

export async function setDeviceCapacity(
  userId: string,
  capacity: StorageCapacityTier
): Promise<InstanceType<typeof DeviceProfile>> {
  const profile = await ensureDeviceProfile(userId, capacity);
  profile.totalCapacity = capacity;
  profile.capacityTier = formatCapacityLabel(capacity);
  profile.systemStorage.reservedSpace = computeReservedSpace(capacity);
  await profile.save();
  await recalculateDeviceStorage(userId);
  return profile;
}

async function getActiveReservations(userId: string): Promise<number> {
  const reservations = await StorageReservation.find({ userId, status: 'active' });
  return reservations.reduce((sum, r) => sum + r.bytes, 0);
}

export async function buildStorageBreakdown(userId: string): Promise<StorageCategoryBreakdown> {
  const profile = await ensureDeviceProfile(userId);
  const appStorages = await AppStorage.find({ userId });

  let apps = 0;
  let cache = 0;
  let photosVideos = 0;
  let documents = 0;
  let downloads = 0;
  let messages = 0;
  let audio = 0;
  let other = 0;

  for (const s of appStorages) {
    apps += s.appSize + s.userDataSize;
    cache += s.cacheSize + s.tempSize;
    documents += s.documentsSize;
    downloads += s.downloadsSize;
    other += s.logsSize;

    if (s.bundleId.includes('messages')) {
      messages += s.userDataSize + s.documentsSize;
    } else if (s.bundleId.includes('camera') || s.bundleId.includes('gallery') || s.bundleId.includes('photos')) {
      photosVideos += s.mediaSize + s.userDataSize;
    } else if (s.bundleId.includes('music') || s.bundleId.includes('audio')) {
      audio += s.mediaSize + s.userDataSize;
    } else {
      photosVideos += s.mediaSize;
    }
  }

  const trashItems = await TrashItem.find({ userId });
  const trash = trashItems.reduce((sum, t) => sum + t.sizeBytes, 0);

  const system = sumSystemStorage(profile.systemStorage);
  const reserved = await getActiveReservations(userId);
  const used = system + apps + cache + photosVideos + documents + downloads + messages + audio + other + reserved + trash;
  const free = Math.max(0, profile.totalCapacity - used);
  const freeRatio = profile.totalCapacity > 0 ? free / profile.totalCapacity : 1;

  profile.lastStorageRecalc = new Date();
  await profile.save();

  await recordStorageRead(userId, Math.floor(used * 0.001));

  return {
    total: profile.totalCapacity,
    used,
    free,
    system,
    apps,
    cache,
    photosVideos,
    documents,
    downloads,
    messages,
    audio,
    other,
    reserved,
    trash,
    freeRatio,
    lowStorageLevel: profile.lowStorageLevel,
    systemBreakdown: profile.systemStorage,
  };
}

export async function recalculateDeviceStorage(userId: string): Promise<StorageCategoryBreakdown> {
  const breakdown = await buildStorageBreakdown(userId);
  const lowStatus = await evaluateLowStorage(userId, breakdown);

  const result: StorageCategoryBreakdown = {
    ...breakdown,
    lowStorageLevel: lowStatus.level,
  };

  emitToUser(userId, 'device:storage:updated' as never, {
    ...result,
    timestamp: new Date().toISOString(),
  });

  return result;
}

export async function getDeviceStorage(userId: string): Promise<StorageCategoryBreakdown> {
  return recalculateDeviceStorage(userId);
}

export async function checkAvailableStorage(userId: string, requiredBytes: number): Promise<{
  available: boolean;
  free: number;
  required: number;
  breakdown: StorageCategoryBreakdown;
}> {
  const breakdown = await recalculateDeviceStorage(userId);
  return {
    available: breakdown.free >= requiredBytes,
    free: breakdown.free,
    required: requiredBytes,
    breakdown,
  };
}

export async function reserveStorage(
  userId: string,
  bundleId: string,
  bytes: number,
  downloadId?: string
): Promise<{ reservationId: string }> {
  const { canInstall } = await import('./lowStorageService');
  const allowed = await canInstall(userId, bytes);
  if (!allowed) throw new Error('INSUFFICIENT_STORAGE');

  const check = await checkAvailableStorage(userId, bytes);
  if (!check.available) {
    throw new Error('INSUFFICIENT_STORAGE');
  }

  const reservation = await StorageReservation.create({
    userId: new Types.ObjectId(userId),
    bundleId,
    downloadId: downloadId ? new Types.ObjectId(downloadId) : undefined,
    bytes,
    status: 'active',
    expiresAt: new Date(Date.now() + RESERVATION_TTL_MS),
  });

  await recalculateDeviceStorage(userId);
  await recordStorageWrite(userId, bytes);
  return { reservationId: reservation._id.toString() };
}

export async function commitReservation(userId: string, bundleId: string): Promise<void> {
  await StorageReservation.updateMany(
    { userId, bundleId, status: 'active' },
    { status: 'committed' }
  );
  await recalculateDeviceStorage(userId);
}

export async function releaseReservation(userId: string, bundleId: string): Promise<void> {
  await StorageReservation.updateMany(
    { userId, bundleId, status: 'active' },
    { status: 'released' }
  );
  await recalculateDeviceStorage(userId);
}

export async function releaseReservationByDownload(userId: string, downloadId: string): Promise<void> {
  await StorageReservation.updateMany(
    { userId, downloadId, status: 'active' },
    { status: 'released' }
  );
  await recalculateDeviceStorage(userId);
}

export async function addSystemUpdateSize(userId: string, updateBytes: number): Promise<void> {
  const profile = await ensureDeviceProfile(userId);
  profile.systemStorage.updates += updateBytes;
  await profile.save();
  await recalculateDeviceStorage(userId);
}

export async function freeStorageOnUninstall(
  userId: string,
  bundleId: string,
  freedBytes: number
): Promise<void> {
  await releaseReservation(userId, bundleId);
  void freedBytes;
  await recalculateDeviceStorage(userId);
}

export async function getLargestApps(userId: string, limit = 20) {
  const installed = await InstalledApp.find({ userId }).sort({ storageBytes: -1 }).limit(limit);
  return installed.map((app) => ({
    bundleId: app.bundleId,
    installedVersion: app.installedVersion,
    storageBytes: app.storageBytes,
    installedAt: app.installedAt.toISOString(),
  }));
}

export async function getDownloadStorage(userId: string) {
  const downloads = await StoreDownload.find({
    userId,
    status: { $in: ['queued', 'downloading', 'paused', 'installing'] },
  });
  return downloads.reduce((sum, d) => sum + (d.size - (d.downloadedBytes ?? 0)), 0);
}

export { STORAGE_CAPACITY_TIERS, DEFAULT_CAPACITY, formatCapacityLabel };
