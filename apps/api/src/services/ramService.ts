import { Types } from 'mongoose';
import { AppMemory, type AppMemoryState } from '../database/models/AppMemory';
import { DeviceProfile } from '../database/models/DeviceProfile';
import { App } from '../database/models/App';
import { getAppRamProfile } from '../constants/hardwareSpecs';
import { emitToUser } from './socketService';

const MEMORY_PRESSURE_THRESHOLD = 0.85;

export async function getRamUsage(userId: string) {
  const profile = await DeviceProfile.findOne({ userId });
  const total = profile?.ramTotalBytes ?? 8_000_000_000;
  const entries = await AppMemory.find({ userId, state: { $ne: 'stopped' } });

  const used = entries.reduce((sum, e) => sum + e.currentRam, 0);
  const free = Math.max(0, total - used);
  const pressure = used / total;

  return {
    total,
    used,
    free,
    pressure: Math.round(pressure * 100) / 100,
    memoryPressure: pressure >= MEMORY_PRESSURE_THRESHOLD,
    apps: entries.map((e) => ({
      bundleId: e.bundleId,
      appName: e.appName,
      baseRam: e.baseRam,
      activeRam: e.activeRam,
      backgroundRam: e.backgroundRam,
      cachedRam: e.cachedRam,
      currentRam: e.currentRam,
      state: e.state,
      lastActiveAt: e.lastActiveAt.toISOString(),
    })),
  };
}

export async function launchApp(userId: string, bundleId: string): Promise<{ allowed: boolean; reason?: string }> {
  const profile = await DeviceProfile.findOne({ userId });
  if (!profile) return { allowed: true };

  const ram = await getRamUsage(userId);
  const appProfile = getAppRamProfile(bundleId);
  const app = await App.findOne({ bundleId });

  if (ram.memoryPressure && appProfile.active > 200_000_000) {
    await applyMemoryPressure(userId);
    const after = await getRamUsage(userId);
    if (after.free < appProfile.active) {
      return { allowed: false, reason: 'Insufficient memory. Close other apps to continue.' };
    }
  }

  const entry = await AppMemory.findOneAndUpdate(
    { userId, bundleId },
    {
      userId: new Types.ObjectId(userId),
      bundleId,
      appName: app?.name ?? bundleId,
      baseRam: appProfile.base,
      activeRam: appProfile.active,
      backgroundRam: appProfile.background,
      cachedRam: appProfile.cached,
      currentRam: appProfile.active,
      state: 'active' as AppMemoryState,
      lastActiveAt: new Date(),
    },
    { upsert: true, new: true }
  );

  emitToUser(userId, 'device:ram:updated' as never, {
    bundleId,
    state: entry.state,
    currentRam: entry.currentRam,
    timestamp: new Date().toISOString(),
  });

  return { allowed: true };
}

export async function backgroundApp(userId: string, bundleId: string): Promise<void> {
  const appProfile = getAppRamProfile(bundleId);
  await AppMemory.findOneAndUpdate(
    { userId, bundleId },
    {
      currentRam: appProfile.background,
      state: 'background',
      lastActiveAt: new Date(),
    }
  );
  emitRamUpdate(userId);
}

export async function stopApp(userId: string, bundleId: string): Promise<void> {
  await AppMemory.findOneAndUpdate(
    { userId, bundleId },
    { currentRam: 0, state: 'stopped' }
  );
  emitRamUpdate(userId);
}

export async function forceStopApp(userId: string, bundleId: string): Promise<void> {
  await stopApp(userId, bundleId);
  const { clearCache } = await import('./storageService');
  await clearCache(userId, bundleId).catch(() => {});
}

export async function applyMemoryPressure(userId: string): Promise<void> {
  const background = await AppMemory.find({ userId, state: 'background' }).sort({ lastActiveAt: 1 });
  for (const entry of background) {
    const profile = getAppRamProfile(entry.bundleId);
    entry.state = 'frozen';
    entry.currentRam = Math.floor(profile.background * 0.3);
    await entry.save();
  }

  const cached = await AppMemory.find({ userId, state: 'frozen' });
  for (const entry of cached) {
    entry.state = 'cached';
    entry.currentRam = getAppRamProfile(entry.bundleId).cached;
    await entry.save();
  }

  emitToUser(userId, 'device:memory:pressure' as never, {
    message: 'Memory pressure applied. Background apps frozen.',
    timestamp: new Date().toISOString(),
  });
  emitRamUpdate(userId);
}

function emitRamUpdate(userId: string): void {
  getRamUsage(userId).then((usage) => {
    emitToUser(userId, 'device:ram:updated' as never, { ...usage, timestamp: new Date().toISOString() });
  });
}

export async function getTaskManager(userId: string) {
  const ram = await getRamUsage(userId);
  return {
    ...ram,
    tasks: ram.apps.sort((a, b) => b.currentRam - a.currentRam),
  };
}
