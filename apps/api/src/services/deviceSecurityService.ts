import bcrypt from 'bcryptjs';
import { Types } from 'mongoose';
import { DeviceSecurityConfig } from '../database/models/DeviceSecurityConfig';
import { User } from '../database/models/User';
import { DeviceState } from '../database/models/DeviceState';
import { MAX_FAILED_UNLOCK_ATTEMPTS, TEMP_LOCK_DURATION_MS } from '../constants/deviceEcosystem';
import type { UnlockMethodType } from '../constants/deviceEcosystem';
import { logDeviceEcosystemAudit } from './deviceEcosystemAuditService';
import { emitToUser } from './socketService';
import { checkPermission } from './permissionBrokerService';

async function ensureSecurity(userId: string) {
  let config = await DeviceSecurityConfig.findOne({ userId, deletedAt: null });
  if (!config) {
    config = await DeviceSecurityConfig.create({ userId: new Types.ObjectId(userId), pinEnabled: true, primaryUnlockMethod: 'pin' });
  }
  return config;
}

function formatSecurity(config: InstanceType<typeof DeviceSecurityConfig>) {
  const now = Date.now();
  const tempLocked = config.tempLockedUntil ? config.tempLockedUntil.getTime() > now : false;
  return {
    faceUnlockEnabled: config.faceUnlockEnabled,
    fingerprintEnabled: config.fingerprintEnabled,
    pinEnabled: config.pinEnabled,
    passwordEnabled: config.passwordEnabled,
    primaryUnlockMethod: config.primaryUnlockMethod,
    trustedDevices: config.trustedDevices.map((d) => ({
      deviceId: d.deviceId,
      deviceName: d.deviceName,
      lastSeenAt: d.lastSeenAt.toISOString(),
      trustedAt: d.trustedAt.toISOString(),
    })),
    failedAttempts: config.failedAttempts,
    tempLocked,
    tempLockedUntil: config.tempLockedUntil?.toISOString(),
    remoteLocked: config.remoteLocked,
    remoteWipeRequested: config.remoteWipeRequested,
    lastUnlockAt: config.lastUnlockAt?.toISOString(),
  };
}

export async function getSecurityConfig(userId: string) {
  const config = await ensureSecurity(userId);
  return formatSecurity(config);
}

export async function updateSecurityMethods(
  userId: string,
  updates: Partial<{
    faceUnlockEnabled: boolean;
    fingerprintEnabled: boolean;
    pinEnabled: boolean;
    passwordEnabled: boolean;
    primaryUnlockMethod: UnlockMethodType;
  }>,
  actorId: string
) {
  const config = await ensureSecurity(userId);
  Object.assign(config, updates);
  config.updatedBy = new Types.ObjectId(actorId);
  await config.save();
  await logDeviceEcosystemAudit({ userId, actorId, action: 'security_update', subsystem: 'security', metadata: updates });
  const data = formatSecurity(config);
  emitToUser(userId, 'device:security:update', data);
  return data;
}

export async function attemptUnlock(
  userId: string,
  method: UnlockMethodType,
  credential: string,
  deviceId?: string,
  deviceName?: string
) {
  const config = await ensureSecurity(userId);
  const now = new Date();

  if (config.remoteLocked) throw new Error('REMOTE_LOCKED');
  if (config.tempLockedUntil && config.tempLockedUntil > now) throw new Error('TEMP_LOCKED');

  const user = await User.findById(userId);
  if (!user) throw new Error('USER_NOT_FOUND');

  let success = false;
  if (method === 'pin' && user.pin) {
    success = await bcrypt.compare(credential, user.pin);
  } else if (method === 'password') {
    success = await bcrypt.compare(credential, user.password);
  } else if (method === 'face' && config.faceUnlockEnabled) {
    success = credential.length >= 32;
  } else if (method === 'fingerprint' && config.fingerprintEnabled) {
    success = credential.length >= 16;
  }

  if (!success) {
    config.failedAttempts += 1;
    if (config.failedAttempts >= MAX_FAILED_UNLOCK_ATTEMPTS) {
      config.tempLockedUntil = new Date(Date.now() + TEMP_LOCK_DURATION_MS);
      config.failedAttempts = 0;
    }
    await config.save();
    await logDeviceEcosystemAudit({ userId, actorId: userId, action: 'unlock_failed', subsystem: 'security', metadata: { method, attempts: config.failedAttempts } });
    throw new Error('UNLOCK_FAILED');
  }

  config.failedAttempts = 0;
  config.tempLockedUntil = undefined;
  config.lastUnlockAt = now;
  await config.save();

  if (deviceId && deviceName) {
    await addTrustedDevice(userId, deviceId, deviceName, userId);
  }

  await DeviceState.findOneAndUpdate({ userId }, { lockState: 'unlocked' });
  emitToUser(userId, 'device:security:unlocked', { method, at: now.toISOString() });
  await logDeviceEcosystemAudit({ userId, actorId: userId, action: 'unlock_success', subsystem: 'security', metadata: { method } });
  return { unlocked: true, method };
}

export async function addTrustedDevice(userId: string, deviceId: string, deviceName: string, actorId: string) {
  const config = await ensureSecurity(userId);
  const existing = config.trustedDevices.find((d) => d.deviceId === deviceId);
  if (existing) {
    existing.lastSeenAt = new Date();
    existing.deviceName = deviceName;
  } else {
    config.trustedDevices.push({ deviceId, deviceName, lastSeenAt: new Date(), trustedAt: new Date() });
  }
  config.updatedBy = new Types.ObjectId(actorId);
  await config.save();
  await logDeviceEcosystemAudit({ userId, actorId, action: 'trusted_device_add', subsystem: 'security', metadata: { deviceId } });
  return formatSecurity(config);
}

export async function remoteLock(userId: string, actorId: string, appId: string) {
  if (actorId !== userId) {
    const allowed = await checkPermission(actorId, appId, 'biometrics');
    if (!allowed && appId !== 'com.gulfos.system') throw new Error('PERMISSION_DENIED');
  }

  const config = await ensureSecurity(userId);
  config.remoteLocked = true;
  config.updatedBy = new Types.ObjectId(actorId);
  await config.save();
  await DeviceState.findOneAndUpdate({ userId }, { lockState: 'locked', screenState: 'off' });
  await logDeviceEcosystemAudit({ userId, actorId, action: 'remote_lock', subsystem: 'security' });
  emitToUser(userId, 'device:security:remote_lock', { locked: true });
  return formatSecurity(config);
}

export async function remoteWipe(userId: string, actorId: string, appId: string) {
  if (actorId !== userId) {
    const allowed = await checkPermission(actorId, appId, 'biometrics');
    if (!allowed && appId !== 'com.gulfos.system') throw new Error('PERMISSION_DENIED');
  }

  const config = await ensureSecurity(userId);
  config.remoteWipeRequested = true;
  config.remoteLocked = true;
  config.updatedBy = new Types.ObjectId(actorId);
  await config.save();

  const { clearAppCache } = await import('./storageService');
  const { InstalledApp } = await import('../database/models/InstalledApp');
  const apps = await InstalledApp.find({ userId, deletedAt: null });
  for (const app of apps) {
    if (!app.bundleId.startsWith('com.gulfos.system')) {
      await clearAppCache(userId, app.bundleId).catch(() => {});
    }
  }

  config.remoteWipeCompletedAt = new Date();
  await config.save();
  await logDeviceEcosystemAudit({ userId, actorId, action: 'remote_wipe', subsystem: 'security' });
  emitToUser(userId, 'device:security:remote_wipe', { completed: true });
  return { wiped: true, completedAt: config.remoteWipeCompletedAt.toISOString() };
}
