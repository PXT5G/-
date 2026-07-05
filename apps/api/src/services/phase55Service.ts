import { v4 as uuidv4 } from 'uuid';
import { Types } from 'mongoose';
import {
  SecurityProfile, SecurityEvent, CloudBackup, FindMyDevice,
  UpdateChannel, EnterpriseOrganization,
} from '../database/models/Phase55';
import {
  SECURITY_APP_BUNDLE, CLOUD_APP_BUNDLE, FIND_MY_APP_BUNDLE,
  PRIVACY_APP_BUNDLE, DEVELOPER_APP_BUNDLE, ANALYTICS_APP_BUNDLE, ENTERPRISE_APP_BUNDLE,
} from '../constants/phase55';
import { checkPermission } from './permissionBrokerService';
import { emitToUser } from './socketService';
import { logAudit } from './auditService';
import { collectDiagnostics } from './diagnosticsService';
import { getDeviceState } from './deviceStateService';

function id(prefix: string) { return `${prefix}-${uuidv4().slice(0, 8).toUpperCase()}`; }

async function assertSecurity(userId: string) {
  const allowed = await checkPermission(userId, SECURITY_APP_BUNDLE, 'notifications');
  if (!allowed) throw new Error('SECURITY_PERMISSION_DENIED');
}

export async function initializeSecurity(userId: string, actorId: string) {
  await assertSecurity(userId);
  const oid = new Types.ObjectId(userId);
  let profile = await SecurityProfile.findOne({ userId: oid });
  if (!profile) {
    profile = await SecurityProfile.create({
      profileId: id('SEC'), userId: oid,
      securityScore: 75, threatLevel: 'low',
      recommendations: [
        { id: 'rec-1', title: 'Enable two-factor authentication', severity: 'medium', resolved: false },
        { id: 'rec-2', title: 'Review app permissions', severity: 'low', resolved: false },
      ],
    });
  }
  return { initialized: true, securityScore: profile.securityScore };
}

export async function getSecurityDashboard(userId: string) {
  await assertSecurity(userId);
  const profile = await SecurityProfile.findOne({ userId: new Types.ObjectId(userId) });
  const events = await SecurityEvent.find({ userId: new Types.ObjectId(userId) })
    .sort({ createdAt: -1 }).limit(20);
  return {
    securityScore: profile?.securityScore ?? 70,
    threatLevel: profile?.threatLevel ?? 'low',
    twoFactorEnabled: profile?.twoFactorEnabled ?? false,
    biometricEnabled: profile?.biometricEnabled ?? true,
    recommendations: profile?.recommendations ?? [],
    recentEvents: events.map((e) => ({
      eventId: e.eventId, type: e.type, severity: e.severity, title: e.title, createdAt: e.createdAt,
    })),
  };
}

export async function logSecurityEvent(userId: string, type: string, title: string, severity: string, description?: string) {
  const event = await SecurityEvent.create({
    eventId: id('EVT'),
    userId: new Types.ObjectId(userId),
    type, title, severity, description,
  });
  emitToUser(userId, 'security:alert', { eventId: event.eventId, type, severity });
  return event;
}

export async function getPrivacyDashboard(userId: string) {
  const { getPermissions } = await import('./permissionBrokerService');
  const permissions = await getPermissions(userId);
  const byApp: Record<string, string[]> = {};
  for (const p of permissions) {
    if (!byApp[p.appId]) byApp[p.appId] = [];
    byApp[p.appId].push(p.permission);
  }
  return {
    appCount: Object.keys(byApp).length,
    permissionGrants: permissions.length,
    apps: Object.entries(byApp).map(([appId, perms]) => ({ appId, permissions: perms })),
    trackingProtection: true,
    privateDns: false,
  };
}

export async function createBackup(userId: string, backupType: string, actorId: string) {
  const allowed = await checkPermission(userId, CLOUD_APP_BUNDLE, 'storage');
  if (!allowed) throw new Error('CLOUD_PERMISSION_DENIED');
  const backup = await CloudBackup.create({
    backupId: id('BKP'),
    userId: new Types.ObjectId(userId),
    backupType,
    state: 'processing',
    encrypted: true,
  });
  emitToUser(userId, 'cloud:backup', { backupId: backup.backupId, state: 'processing' });
  const { InstalledPackage } = await import('../database/models/InstalledPackage');
  const appCount = await InstalledPackage.countDocuments({ userId: new Types.ObjectId(userId) });
  backup.state = 'completed';
  backup.sizeBytes = 50_000_000 + appCount * 12_000_000;
  backup.completedAt = new Date();
  await backup.save();
  emitToUser(userId, 'cloud:backup', { backupId: backup.backupId, state: 'completed' });
  await logAudit({ userId, actorId, action: 'cloud_backup', resource: 'cloud', resourceId: backup.backupId });
  return { backupId: backup.backupId, state: 'completed', sizeBytes: backup.sizeBytes };
}

export async function listBackups(userId: string) {
  const backups = await CloudBackup.find({ userId: new Types.ObjectId(userId) }).sort({ createdAt: -1 }).limit(20);
  return backups.map((b) => ({
    backupId: b.backupId, backupType: b.backupType, state: b.state,
    sizeBytes: b.sizeBytes, completedAt: b.completedAt, createdAt: b.createdAt,
  }));
}

export async function restoreBackup(userId: string, backupId: string, actorId: string) {
  const allowed = await checkPermission(userId, CLOUD_APP_BUNDLE, 'storage');
  if (!allowed) throw new Error('CLOUD_PERMISSION_DENIED');
  const backup = await CloudBackup.findOne({ backupId, userId: new Types.ObjectId(userId), state: 'completed' });
  if (!backup) throw new Error('BACKUP_NOT_FOUND');
  emitToUser(userId, 'cloud:restore', { backupId, state: 'processing' });
  emitToUser(userId, 'cloud:restore', { backupId, state: 'completed' });
  await logAudit({ userId, actorId, action: 'cloud_restore', resource: 'cloud', resourceId: backupId });
  return { backupId, state: 'completed', restoredAt: new Date().toISOString() };
}

export async function syncCloud(userId: string, actorId: string) {
  const allowed = await checkPermission(userId, CLOUD_APP_BUNDLE, 'storage');
  if (!allowed) throw new Error('CLOUD_PERMISSION_DENIED');
  const lastBackup = await CloudBackup.findOne({ userId: new Types.ObjectId(userId), state: 'completed' })
    .sort({ completedAt: -1 });
  emitToUser(userId, 'cloud:sync', { synced: true, lastBackupId: lastBackup?.backupId ?? null });
  await logAudit({ userId, actorId, action: 'cloud_sync', resource: 'cloud' });
  return { synced: true, lastBackupId: lastBackup?.backupId ?? null, syncedAt: new Date().toISOString() };
}

export async function registerFindMyDevice(userId: string, deviceType: string, deviceName: string) {
  const allowed = await checkPermission(userId, FIND_MY_APP_BUNDLE, 'location');
  if (!allowed) throw new Error('FIND_MY_PERMISSION_DENIED');
  const device = await FindMyDevice.findOneAndUpdate(
    { userId: new Types.ObjectId(userId), deviceName },
    {
      deviceId: id('FMD'),
      userId: new Types.ObjectId(userId),
      deviceType, deviceName,
      lastSeenAt: new Date(),
      batteryLevel: 85,
    },
    { upsert: true, new: true }
  );
  return device;
}

export async function listFindMyDevices(userId: string) {
  const devices = await FindMyDevice.find({ userId: new Types.ObjectId(userId) });
  return devices.map((d) => ({
    deviceId: d.deviceId, deviceType: d.deviceType, deviceName: d.deviceName,
    latitude: d.latitude, longitude: d.longitude, lastSeenAt: d.lastSeenAt,
    isLost: d.isLost, batteryLevel: d.batteryLevel,
  }));
}

export async function markDeviceLost(userId: string, deviceId: string) {
  const device = await FindMyDevice.findOneAndUpdate(
    { deviceId, userId: new Types.ObjectId(userId) },
    { isLost: true, lostModeEnabled: true },
    { new: true }
  );
  if (!device) throw new Error('DEVICE_NOT_FOUND');
  emitToUser(userId, 'device:lost', { deviceId });
  return device;
}

export async function getUpdateChannel(userId: string) {
  let channel = await UpdateChannel.findOne({ userId: new Types.ObjectId(userId) });
  if (!channel) {
    channel = await UpdateChannel.create({
      channelId: id('UPD'), userId: new Types.ObjectId(userId), channel: 'stable',
    });
  }
  return channel;
}

export async function checkForUpdates(userId: string) {
  const channel = await getUpdateChannel(userId);
  const { InstalledPackage } = await import('../database/models/InstalledPackage');
  const packages = await InstalledPackage.find({ userId: new Types.ObjectId(userId) }).limit(10);
  const pending = packages.map((p) => ({
    bundleId: p.bundleId,
    version: p.version,
    size: p.size,
  }));
  channel.pendingUpdates = pending;
  channel.lastCheckAt = new Date();
  await channel.save();
  if (pending.length > 0) emitToUser(userId, 'update:available', { count: pending.length });
  return { channel: channel.channel, pendingUpdates: pending, lastCheckAt: channel.lastCheckAt };
}

export async function getDeveloperDashboard(userId: string) {
  const allowed = await checkPermission(userId, DEVELOPER_APP_BUNDLE, 'notifications');
  if (!allowed) throw new Error('DEVELOPER_PERMISSION_DENIED');
  const { getRegisteredTasks } = await import('./backgroundServiceManager');
  const { getJobStats } = await import('./jobService');
  const [diagnostics, jobs] = await Promise.all([
    collectDiagnostics(userId),
    getJobStats(userId).catch(() => ({ running: 0, queued: 0, failed: 0 })),
  ]);
  return {
    backgroundTasks: getRegisteredTasks(),
    jobStats: jobs,
    diagnostics,
    environment: process.env.NODE_ENV ?? 'development',
  };
}

export async function getAnalyticsCenter(userId: string) {
  const allowed = await checkPermission(userId, ANALYTICS_APP_BUNDLE, 'notifications');
  if (!allowed) throw new Error('ANALYTICS_PERMISSION_DENIED');
  const { InstalledPackage } = await import('../database/models/InstalledPackage');
  const { AuditLog } = await import('../database/models/AuditLog');
  const [appCount, recentAudits] = await Promise.all([
    InstalledPackage.countDocuments({ userId: new Types.ObjectId(userId) }),
    AuditLog.countDocuments({ userId: new Types.ObjectId(userId), createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
  ]);
  return {
    installedApps: appCount,
    auditEvents24h: recentAudits,
    systemHealth: 'healthy',
    collectedAt: new Date().toISOString(),
  };
}

export async function getDiagnosticsCenter(userId: string) {
  const { refreshPerformanceState } = await import('./phoneOsService');
  const [diagnostics, device, performance] = await Promise.all([
    collectDiagnostics(userId),
    getDeviceState(userId).catch(() => null),
    refreshPerformanceState(userId).catch(() => null),
  ]);
  emitToUser(userId, 'diagnostics:update', { collectedAt: diagnostics.collectedAt });
  return { diagnostics, device, performance };
}

export async function listEnterpriseOrgs(userId: string) {
  const allowed = await checkPermission(userId, ENTERPRISE_APP_BUNDLE, 'notifications');
  if (!allowed) throw new Error('ENTERPRISE_PERMISSION_DENIED');
  return EnterpriseOrganization.find({ ownerId: new Types.ObjectId(userId) });
}

export async function createEnterpriseOrg(userId: string, name: string, actorId: string) {
  const org = await EnterpriseOrganization.create({
    orgId: id('ORG'),
    name,
    ownerId: new Types.ObjectId(userId),
    departments: [{ id: 'dept-1', name: 'Engineering' }],
  });
  emitToUser(userId, 'enterprise:update', { orgId: org.orgId });
  await logAudit({ userId, actorId, action: 'enterprise_create', resource: 'enterprise', resourceId: org.orgId });
  return org;
}

export {
  SECURITY_APP_BUNDLE, CLOUD_APP_BUNDLE, FIND_MY_APP_BUNDLE,
  PRIVACY_APP_BUNDLE, DEVELOPER_APP_BUNDLE, ANALYTICS_APP_BUNDLE,
};
