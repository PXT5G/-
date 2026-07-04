import { DeviceProfile } from '../database/models/DeviceProfile';
import { reserveStorage, releaseReservation, commitReservation } from './deviceStorageService';
import { recordStorageWrite } from './storageWearService';
import { emitToUser } from './socketService';

const UPDATE_OVERHEAD_RATIO = 1.5;

export async function reserveUpdateSpace(userId: string, updateBytes: number): Promise<string> {
  const required = Math.floor(updateBytes * UPDATE_OVERHEAD_RATIO);
  const profile = await DeviceProfile.findOne({ userId });
  if (!profile) throw new Error('Device profile not found');

  const { reservationId } = await reserveStorage(userId, 'com.bananaos.system', required);
  profile.systemStorage.updateReserved = required;
  await profile.save();
  return reservationId;
}

export async function completeSystemUpdate(
  userId: string,
  updateBytes: number,
  success: boolean
): Promise<void> {
  const profile = await DeviceProfile.findOne({ userId });
  if (!profile) return;

  if (success) {
    profile.systemStorage.updates += updateBytes;
    profile.systemStorage.updateReserved = 0;
    profile.osVersion = bumpPatch(profile.osVersion);
    await recordStorageWrite(userId, updateBytes);
    await commitReservation(userId, 'com.bananaos.system');
    emitToUser(userId, 'device:update:complete' as never, {
      version: profile.osVersion,
      timestamp: new Date().toISOString(),
    });
  } else {
    await rollbackUpdate(userId);
  }
  await profile.save();
}

export async function rollbackUpdate(userId: string): Promise<void> {
  const profile = await DeviceProfile.findOne({ userId });
  if (!profile) return;

  profile.systemStorage.updateReserved = 0;
  await profile.save();
  await releaseReservation(userId, 'com.bananaos.system');

  emitToUser(userId, 'device:update:rollback' as never, {
    message: 'System update rolled back.',
    timestamp: new Date().toISOString(),
  });
}

function bumpPatch(version: string): string {
  const parts = version.split('.').map(Number);
  parts[2] = (parts[2] ?? 0) + 1;
  return parts.join('.');
}
