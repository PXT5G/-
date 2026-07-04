import { AppStorage } from '../database/models/AppStorage';
import { APP_CACHE_GROWTH } from '../constants/hardwareSpecs';
import { growAppCache } from './storageService';
import { recordStorageWrite } from './storageWearService';
import { getLowStorageLevel } from '../constants/hardwareSpecs';
import { getDeviceStorage } from './deviceStorageService';
import { DeviceProfile } from '../database/models/DeviceProfile';

const TICK_INTERVAL_MS = 60 * 60 * 1000; // simulate 1 hour per tick

export async function growCachesForUser(userId: string): Promise<number> {
  const breakdown = await getDeviceStorage(userId);
  const freeRatio = breakdown.free / breakdown.total;
  const level = getLowStorageLevel(freeRatio);

  if (level === 'emergency' || level === 'critical') return 0;

  const profile = await DeviceProfile.findOne({ userId });
  if (profile?.lowStorageMode && level === 'low') return 0;

  const storages = await AppStorage.find({ userId });
  let totalGrown = 0;

  for (const storage of storages) {
    const growth = APP_CACHE_GROWTH[storage.bundleId];
    if (!growth) continue;

    const bytes = Math.floor(growth.bytesPerHour * (0.5 + Math.random()));
    if (breakdown.free < bytes) continue;

    await growAppCache(userId, storage.bundleId, bytes);
    await recordStorageWrite(userId, bytes);
    totalGrown += bytes;
  }

  return totalGrown;
}

export function startCacheGrowthSimulator(): void {
  // Deprecated: use backgroundServiceManager.registerBackgroundTask
}

export async function growCachesForAll(): Promise<number> {
  const { DeviceProfile } = await import('../database/models/DeviceProfile');
  const profiles = await DeviceProfile.find({}).select('userId');
  let total = 0;
  for (const p of profiles) {
    total += await growCachesForUser(p.userId.toString());
  }
  return total;
}
