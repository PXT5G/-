import { Types } from 'mongoose';
import { DeviceProfile } from '../database/models/DeviceProfile';
import { getHardwareProfile, seedHardwareProfile } from './hardwareService';
import { WARRANTY_DEFAULT_MONTHS } from '../constants/deviceEcosystem';
import { logDeviceEcosystemAudit } from './deviceEcosystemAuditService';
import { emitToUser } from './socketService';

export async function getDeviceProfile(userId: string) {
  const hardware = await getHardwareProfile(userId);
  const profile = await DeviceProfile.findOne({ userId });
  if (!profile) return hardware;

  return {
    ...hardware,
    purchaseDate: profile.purchaseDate?.toISOString(),
    warrantyExpiresAt: profile.warrantyExpiresAt?.toISOString(),
    warrantyActive: profile.warrantyExpiresAt ? profile.warrantyExpiresAt > new Date() : false,
    region: profile.region,
    language: profile.language,
    timezone: profile.timezone,
  };
}

export async function updateDeviceProfile(
  userId: string,
  updates: Partial<{ deviceName: string; region: string; language: string; timezone: string }>,
  actorId: string
) {
  const profile = await DeviceProfile.findOneAndUpdate(
    { userId },
    { ...updates, updatedAt: new Date() },
    { new: true }
  );
  if (!profile) throw new Error('PROFILE_NOT_FOUND');

  await logDeviceEcosystemAudit({ userId, actorId, action: 'profile_update', subsystem: 'profile', metadata: updates });
  const data = await getDeviceProfile(userId);
  emitToUser(userId, 'device:profile:update', data);
  return data;
}

export async function initializeDeviceProfile(userId: string, deviceName?: string) {
  let profile = await DeviceProfile.findOne({ userId });
  if (!profile) {
    profile = await seedHardwareProfile(userId, undefined, deviceName);
  }

  const purchaseDate = profile.purchaseDate ?? new Date();
  const warrantyExpiresAt = profile.warrantyExpiresAt ?? new Date(
    purchaseDate.getTime() + WARRANTY_DEFAULT_MONTHS * 30 * 24 * 60 * 60 * 1000
  );

  if (!profile.purchaseDate) {
    profile.purchaseDate = purchaseDate;
    profile.warrantyExpiresAt = warrantyExpiresAt;
    profile.region = profile.region || 'US';
    profile.language = profile.language || 'en';
    profile.timezone = profile.timezone || 'America/Los_Angeles';
    await profile.save();
  }

  return getDeviceProfile(userId);
}
