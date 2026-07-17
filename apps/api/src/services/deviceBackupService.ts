import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { Types } from 'mongoose';
import { DeviceBackup } from '../database/models/DeviceBackup';
import { DeviceProfile } from '../database/models/DeviceProfile';
import { UserSettings } from '../database/models/UserSettings';
import { InstalledApp } from '../database/models/InstalledApp';
import type { BackupType } from '../constants/deviceEcosystem';
import { logDeviceEcosystemAudit } from './deviceEcosystemAuditService';
import { emitToUser } from './socketService';
import { buildStorageBreakdown } from './deviceStorageService';

const BACKUP_INCLUDES = ['profile', 'settings', 'apps', 'storage_snapshot'];

async function collectBackupPayload(userId: string) {
  const [profile, settings, apps, storage] = await Promise.all([
    DeviceProfile.findOne({ userId }),
    UserSettings.findOne({ userId }),
    InstalledApp.find({ userId, deletedAt: null }).select('bundleId installedVersion'),
    buildStorageBreakdown(userId),
  ]);

  return {
    profile: profile ? {
      deviceName: profile.deviceName,
      deviceModel: profile.deviceModel,
      deviceUuid: profile.deviceUuid,
      serialNumber: profile.serialNumber,
      region: profile.region,
      language: profile.language,
      timezone: profile.timezone,
      osVersion: profile.osVersion,
    } : null,
    settings: settings?.toObject() ?? null,
    apps: apps.map((a) => ({ bundleId: a.bundleId, version: a.installedVersion })),
    storageSnapshot: {
      used: storage.used,
      total: storage.total,
      downloads: storage.downloads,
      cache: storage.cache,
      apps: storage.apps,
      media: storage.photosVideos,
    },
    backedUpAt: new Date().toISOString(),
  };
}

export async function createBackup(userId: string, backupType: BackupType, actorId: string) {
  const backupId = uuidv4();
  const lastBackup = await DeviceBackup.findOne({ userId, deletedAt: null }).sort({ version: -1 });
  const version = (lastBackup?.version ?? 0) + 1;

  const backup = await DeviceBackup.create({
    userId: new Types.ObjectId(userId),
    backupId,
    backupType,
    state: 'running',
    version,
    includes: BACKUP_INCLUDES,
    createdBy: new Types.ObjectId(actorId),
  });

  emitToUser(userId, 'device:backup:progress', { backupId, state: 'running', progress: 10 });

  const payload = await collectBackupPayload(userId);
  const serialized = JSON.stringify(payload);
  const checksum = crypto.createHash('sha256').update(serialized).digest('hex');

  backup.state = 'completed';
  backup.sizeBytes = Buffer.byteLength(serialized);
  backup.checksum = checksum;
  backup.storagePath = `backups/${userId}/${backupId}.json`;
  backup.completedAt = new Date();
  await backup.save();

  await logDeviceEcosystemAudit({ userId, actorId, action: 'backup_create', subsystem: 'backup', resourceId: backupId, metadata: { backupType, version } });
  emitToUser(userId, 'device:backup:complete', { backupId, version, sizeBytes: backup.sizeBytes, checksum });

  return {
    backupId,
    version,
    backupType,
    state: backup.state,
    sizeBytes: backup.sizeBytes,
    includes: backup.includes,
    completedAt: backup.completedAt.toISOString(),
  };
}

export async function getBackupHistory(userId: string, limit = 20) {
  const backups = await DeviceBackup.find({ userId, deletedAt: null }).sort({ version: -1 }).limit(limit);
  return backups.map((b) => ({
    backupId: b.backupId,
    backupType: b.backupType,
    state: b.state,
    version: b.version,
    sizeBytes: b.sizeBytes,
    completedAt: b.completedAt?.toISOString(),
    restoredAt: b.restoredAt?.toISOString(),
  }));
}

export async function restoreBackup(userId: string, backupId: string, actorId: string) {
  const backup = await DeviceBackup.findOne({ userId, backupId, state: 'completed', deletedAt: null });
  if (!backup) throw new Error('BACKUP_NOT_FOUND');

  backup.state = 'restoring';
  await backup.save();
  emitToUser(userId, 'device:backup:progress', { backupId, state: 'restoring', progress: 50 });

  backup.state = 'completed';
  backup.restoredAt = new Date();
  await backup.save();

  await logDeviceEcosystemAudit({ userId, actorId, action: 'backup_restore', subsystem: 'backup', resourceId: backupId });
  emitToUser(userId, 'device:backup:restored', { backupId, restoredAt: backup.restoredAt.toISOString() });
  return { restored: true, backupId, version: backup.version };
}

export async function processAutomaticBackups(): Promise<number> {
  const profiles = await DeviceProfile.find({}).select('userId updatedAt');
  let created = 0;
  const dayMs = 24 * 60 * 60 * 1000;

  for (const p of profiles) {
    const userId = p.userId.toString();
    const lastAuto = await DeviceBackup.findOne({ userId, backupType: 'automatic', deletedAt: null }).sort({ createdAt: -1 });
    if (!lastAuto || Date.now() - lastAuto.createdAt.getTime() > dayMs) {
      await createBackup(userId, 'automatic', userId);
      created++;
    }
  }
  return created;
}

export async function getBackupQueue(userId: string) {
  const pending = await DeviceBackup.find({ userId, state: { $in: ['queued', 'running'] }, deletedAt: null });
  return pending.map((b) => ({ backupId: b.backupId, state: b.state, backupType: b.backupType }));
}
