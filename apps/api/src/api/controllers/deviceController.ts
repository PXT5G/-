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
  const check = await checkAvailableStorage(req.user!.userId, required);
  res.json({
    success: true,
    data: {
      required,
      available: check.available,
      free: check.free,
      breakdown: check.breakdown,
    },
  });
});
