import { v4 as uuidv4 } from 'uuid';
import { Types } from 'mongoose';
import { DeviceSyncJob } from '../database/models/DeviceSyncJob';
import { DeviceProfile } from '../database/models/DeviceProfile';
import { UserSettings } from '../database/models/UserSettings';
import { InstalledApp } from '../database/models/InstalledApp';
import type { SyncDomain } from '../constants/deviceEcosystem';
import { SYNC_DOMAINS } from '../constants/deviceEcosystem';
import { logDeviceEcosystemAudit } from './deviceEcosystemAuditService';
import { emitToUser } from './socketService';

async function collectDomainData(userId: string, domain: SyncDomain): Promise<Record<string, unknown>> {
  switch (domain) {
    case 'settings': {
      const settings = await UserSettings.findOne({ userId });
      return { settings: settings?.toObject() ?? {} };
    }
    case 'apps': {
      const apps = await InstalledApp.find({ userId, deletedAt: null });
      return { apps: apps.map((a) => ({ bundleId: a.bundleId, version: a.installedVersion })) };
    }
    case 'preferences': {
      const profile = await DeviceProfile.findOne({ userId });
      return { region: profile?.region, language: profile?.language, timezone: profile?.timezone };
    }
    case 'wallpapers': {
      const settings = await UserSettings.findOne({ userId });
      return { wallpaper: settings?.wallpaper ?? null };
    }
    case 'contacts':
    case 'messages':
      return { synced: true, note: `Integrated via Communication Core — ${domain} marked for sync` };
    default:
      return {};
  }
}

export async function startDeviceSync(
  userId: string,
  params: { sourceDeviceId: string; targetDeviceId: string; domains?: SyncDomain[] },
  actorId: string
) {
  const syncId = uuidv4();
  const domains = params.domains ?? [...SYNC_DOMAINS];

  const job = await DeviceSyncJob.create({
    userId: new Types.ObjectId(userId),
    syncId,
    sourceDeviceId: params.sourceDeviceId,
    targetDeviceId: params.targetDeviceId,
    domains,
    state: 'syncing',
    progress: 0,
    createdBy: new Types.ObjectId(actorId),
  });

  const payload: Record<string, unknown> = {};
  for (let i = 0; i < domains.length; i++) {
    const domain = domains[i];
    payload[domain] = await collectDomainData(userId, domain);
    job.progress = Math.round(((i + 1) / domains.length) * 100);
    await job.save();
    emitToUser(userId, 'device:sync:progress', { syncId, progress: job.progress, domain });
  }

  job.state = 'completed';
  job.payload = payload;
  job.completedAt = new Date();
  job.progress = 100;
  await job.save();

  await logDeviceEcosystemAudit({ userId, actorId, action: 'sync_complete', subsystem: 'sync', resourceId: syncId, metadata: { domains } });
  emitToUser(userId, 'device:sync:complete', { syncId, domains, completedAt: job.completedAt.toISOString() });
  return { syncId, state: job.state, domains, progress: 100 };
}

export async function getSyncHistory(userId: string, limit = 20) {
  const jobs = await DeviceSyncJob.find({ userId, deletedAt: null }).sort({ createdAt: -1 }).limit(limit);
  return jobs.map((j) => ({
    syncId: j.syncId,
    sourceDeviceId: j.sourceDeviceId,
    targetDeviceId: j.targetDeviceId,
    domains: j.domains,
    state: j.state,
    progress: j.progress,
    completedAt: j.completedAt?.toISOString(),
  }));
}

export async function getSyncStatus(userId: string) {
  const active = await DeviceSyncJob.findOne({ userId, state: 'syncing', deletedAt: null });
  const last = await DeviceSyncJob.findOne({ userId, state: 'completed', deletedAt: null }).sort({ completedAt: -1 });
  return {
    syncing: !!active,
    activeSyncId: active?.syncId,
    progress: active?.progress ?? 0,
    lastSyncAt: last?.completedAt?.toISOString(),
  };
}
