import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import {
  getDeviceStorage,
  setDeviceCapacity,
  getLargestApps,
  recalculateDeviceStorage,
  STORAGE_CAPACITY_TIERS,
  ensureDeviceProfile,
} from '../../services/deviceStorageService';
import { listInstalledPackages } from '../../services/installedPackageService';
import { clearAppCache } from '../../services/storageService';
import { App } from '../../database/models/App';
import { InstalledApp } from '../../database/models/InstalledApp';
import { getHardwareProfile, simulateTemperature } from '../../services/hardwareService';
import { getRamUsage, launchApp, backgroundApp, stopApp, forceStopApp, getTaskManager } from '../../services/ramService';
import { getStorageWear } from '../../services/storageWearService';
import { evaluateLowStorage } from '../../services/lowStorageService';
import { getTrash, emptyTrash } from '../../services/mediaStorageService';
import { reserveUpdateSpace, completeSystemUpdate } from '../../services/systemUpdateService';

function param(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

const capacitySchema = z.object({
  capacity: z.number().refine((v) => STORAGE_CAPACITY_TIERS.includes(v as typeof STORAGE_CAPACITY_TIERS[number])),
});

export const getStorage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const breakdown = await getDeviceStorage(req.user!.userId);
  const profile = await ensureDeviceProfile(req.user!.userId);
  res.json({
    success: true,
    data: {
      ...breakdown,
      capacityTier: profile.capacityTier,
      deviceName: profile.deviceName,
      osVersion: profile.osVersion,
      buildNumber: profile.buildNumber,
    },
  });
});

export const recalcStorage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const breakdown = await recalculateDeviceStorage(req.user!.userId);
  res.json({ success: true, data: breakdown });
});

export const setCapacity = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = capacitySchema.parse(req.body);
  const profile = await setDeviceCapacity(req.user!.userId, body.capacity as typeof STORAGE_CAPACITY_TIERS[number]);
  const breakdown = await getDeviceStorage(req.user!.userId);
  res.json({
    success: true,
    data: {
      capacityTier: profile.capacityTier,
      totalCapacity: profile.totalCapacity,
      breakdown,
    },
  });
});

export const getCapacityTiers = asyncHandler(async (_req: AuthRequest, res: Response) => {
  res.json({
    success: true,
    data: STORAGE_CAPACITY_TIERS.map((bytes) => ({
      bytes,
      label: bytes >= 1_000_000_000_000 ? `${bytes / 1_000_000_000_000} TB` : `${bytes / 1_000_000_000} GB`,
    })),
  });
});

export const getLargestAppsHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const apps = await getLargestApps(req.user!.userId);
  const enriched = await Promise.all(
    apps.map(async (a) => {
      const app = await App.findOne({ bundleId: a.bundleId });
      return {
        ...a,
        name: app?.name ?? a.bundleId,
        icon: app?.icon ?? '📦',
      };
    })
  );
  res.json({ success: true, data: enriched });
});

export const getPackages = asyncHandler(async (req: AuthRequest, res: Response) => {
  const packages = await listInstalledPackages(req.user!.userId);
  res.json({ success: true, data: packages });
});

export const clearDeviceCache = asyncHandler(async (req: AuthRequest, res: Response) => {
  const installed = await InstalledApp.find({ userId: req.user!.userId });
  for (const app of installed) {
    await clearAppCache(req.user!.userId, app.bundleId);
  }
  const breakdown = await recalculateDeviceStorage(req.user!.userId);
  res.json({ success: true, data: breakdown });
});

export const clearAppCacheHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const storage = await clearAppCache(req.user!.userId, param(req.params.bundleId));
  const breakdown = await recalculateDeviceStorage(req.user!.userId);
  res.json({ success: true, data: { storage, breakdown } });
});

export const checkStorageForInstall = asyncHandler(async (req: AuthRequest, res: Response) => {
  const bundleId = param(req.params.bundleId);
  const { getStorageRequired } = await import('../../services/packageService');
  const app = await App.findOne({ bundleId });
  if (!app) throw new AppError(404, 'App not found');
  const required = await getStorageRequired(bundleId, app.version);
  const { checkAvailableStorage } = await import('../../services/deviceStorageService');
  const { canInstall } = await import('../../services/lowStorageService');
  const check = await checkAvailableStorage(req.user!.userId, required);
  const lowStorageAllowed = await canInstall(req.user!.userId, required);
  res.json({
    success: true,
    data: {
      required,
      available: check.available && lowStorageAllowed,
      free: check.free,
      breakdown: check.breakdown,
      lowStorageLevel: check.breakdown.lowStorageLevel,
    },
  });
});

export const getHardware = asyncHandler(async (req: AuthRequest, res: Response) => {
  const hardware = await getHardwareProfile(req.user!.userId);
  const wear = await getStorageWear(req.user!.userId);
  const storage = await getDeviceStorage(req.user!.userId);
  const ram = await getRamUsage(req.user!.userId);
  res.json({
    success: true,
    data: {
      ...hardware,
      storageWear: wear,
      storage,
      ram,
    },
  });
});

export const refreshTemperature = asyncHandler(async (req: AuthRequest, res: Response) => {
  const temperature = await simulateTemperature(req.user!.userId);
  res.json({ success: true, data: { temperature } });
});

export const getRam = asyncHandler(async (req: AuthRequest, res: Response) => {
  const ram = await getRamUsage(req.user!.userId);
  res.json({ success: true, data: ram });
});

export const getTaskManagerHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const tasks = await getTaskManager(req.user!.userId);
  res.json({ success: true, data: tasks });
});

export const launchAppHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const bundleId = param(req.params.bundleId);
  const result = await launchApp(req.user!.userId, bundleId);
  if (!result.allowed) {
    throw new AppError(507, result.reason ?? 'Insufficient memory');
  }
  res.json({ success: true, data: result });
});

export const backgroundAppHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  await backgroundApp(req.user!.userId, param(req.params.bundleId));
  res.json({ success: true });
});

export const stopAppHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  await stopApp(req.user!.userId, param(req.params.bundleId));
  res.json({ success: true });
});

export const forceStopAppHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  await forceStopApp(req.user!.userId, param(req.params.bundleId));
  const breakdown = await recalculateDeviceStorage(req.user!.userId);
  res.json({ success: true, data: { breakdown } });
});

export const getLowStorageStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const status = await evaluateLowStorage(req.user!.userId);
  res.json({ success: true, data: status });
});

export const getTrashHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const trash = await getTrash(req.user!.userId);
  res.json({ success: true, data: trash });
});

export const emptyTrashHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const freed = await emptyTrash(req.user!.userId);
  const breakdown = await recalculateDeviceStorage(req.user!.userId);
  res.json({ success: true, data: { freed, breakdown } });
});

const updateSchema = z.object({
  updateBytes: z.number().positive(),
  success: z.boolean(),
});

export const systemUpdateHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = updateSchema.parse(req.body);
  const { pauseUpdates } = await evaluateLowStorage(req.user!.userId);
  if (pauseUpdates && body.success) {
    throw new AppError(507, 'Updates paused due to low storage');
  }
  if (body.success) {
    await reserveUpdateSpace(req.user!.userId, body.updateBytes);
  }
  await completeSystemUpdate(req.user!.userId, body.updateBytes, body.success);
  const hardware = await getHardwareProfile(req.user!.userId);
  res.json({ success: true, data: { osVersion: hardware.osVersion } });
});
