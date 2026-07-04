import { DeviceProfile } from '../database/models/DeviceProfile';
import { getLowStorageLevel, LOW_STORAGE_THRESHOLDS } from '../constants/hardwareSpecs';
import { emitToUser } from './socketService';
import { buildStorageBreakdown, type StorageCategoryBreakdown } from './deviceStorageService';
import { clearCache } from './storageService';
import { InstalledApp } from '../database/models/InstalledApp';

export interface LowStorageStatus {
  level: string;
  freeRatio: number;
  freeBytes: number;
  totalBytes: number;
  lowStorageMode: boolean;
  emergencyMode: boolean;
  blockInstall: boolean;
  blockVideoRecording: boolean;
  pauseUpdates: boolean;
  suggestions: string[];
}

export async function evaluateLowStorage(
  userId: string,
  breakdown?: StorageCategoryBreakdown
): Promise<LowStorageStatus> {
  const storage = breakdown ?? await buildStorageBreakdown(userId);
  const freeRatio = storage.freeRatio;
  const level = getLowStorageLevel(freeRatio);

  const profile = await DeviceProfile.findOne({ userId });
  const suggestions: string[] = [];

  if (level === 'warning') {
    suggestions.push('Storage is getting low. Consider removing unused apps.');
  }
  if (level === 'low' || level === 'critical' || level === 'emergency') {
    suggestions.push('Clear app cache', 'Delete large downloads', 'Empty trash', 'Remove unused apps');
  }

  const lowStorageMode = level === 'low' || level === 'critical' || level === 'emergency';
  const emergencyMode = level === 'emergency';
  const blockInstall = level === 'critical' || level === 'emergency';
  const blockVideoRecording = level === 'critical' || level === 'emergency';
  const pauseUpdates = level === 'critical' || level === 'emergency';

  if (profile) {
    const changed =
      profile.lowStorageMode !== lowStorageMode ||
      profile.emergencyMode !== emergencyMode ||
      profile.lowStorageLevel !== level;

    profile.lowStorageMode = lowStorageMode;
    profile.emergencyMode = emergencyMode;
    profile.lowStorageLevel = level;
    await profile.save();

    if (changed) {
      emitToUser(userId, 'device:storage:warning' as never, {
        level,
        freeRatio,
        freeBytes: storage.free,
        lowStorageMode,
        emergencyMode,
        suggestions,
        timestamp: new Date().toISOString(),
      });
    }

    if (lowStorageMode && level === 'low') {
      await autoCleanup(userId);
    }
  }

  return {
    level,
    freeRatio,
    freeBytes: storage.free,
    totalBytes: storage.total,
    lowStorageMode,
    emergencyMode,
    blockInstall,
    blockVideoRecording,
    pauseUpdates,
    suggestions,
  };
}

async function autoCleanup(userId: string): Promise<void> {
  const installed = await InstalledApp.find({ userId });
  for (const app of installed.slice(0, 3)) {
    await clearCache(userId, app.bundleId).catch(() => {});
  }
}

export async function canInstall(userId: string, requiredBytes: number): Promise<boolean> {
  const status = await evaluateLowStorage(userId);
  if (status.emergencyMode) return false;
  if (status.blockInstall) return false;
  if (status.freeBytes < requiredBytes) return false;
  return true;
}

export async function canRecordVideo(userId: string): Promise<boolean> {
  const status = await evaluateLowStorage(userId);
  return !status.blockVideoRecording;
}

export { LOW_STORAGE_THRESHOLDS };
