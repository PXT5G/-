import { DeviceProfile } from '../database/models/DeviceProfile';

const MAX_WRITES_FOR_DEGRADATION = 50_000_000_000_000; // 50 TB simulated lifetime

export async function recordStorageWrite(userId: string, bytes: number): Promise<void> {
  const profile = await DeviceProfile.findOne({ userId });
  if (!profile) return;

  profile.storageWear.lifetimeWrites += bytes;
  profile.storageWear.lifetimeReads += Math.floor(bytes * 0.1);
  updateHealth(profile);
  await profile.save();
}

export async function recordStorageRead(userId: string, bytes: number): Promise<void> {
  const profile = await DeviceProfile.findOne({ userId });
  if (!profile) return;

  profile.storageWear.lifetimeReads += bytes;
  await profile.save();
}

function updateHealth(profile: InstanceType<typeof DeviceProfile>): void {
  const writeRatio = profile.storageWear.lifetimeWrites / MAX_WRITES_FOR_DEGRADATION;
  profile.storageWear.healthPercent = Math.max(70, Math.round((1 - writeRatio) * 100));
  profile.storageWear.estimatedRemainingLifeYears = Math.max(
    1,
    Math.round((1 - writeRatio) * 8 * 10) / 10
  );
}

export async function getStorageWear(userId: string) {
  const profile = await DeviceProfile.findOne({ userId });
  if (!profile) {
    return {
      healthPercent: 100,
      lifetimeWrites: 0,
      lifetimeReads: 0,
      estimatedRemainingLifeYears: 8,
    };
  }
  return profile.storageWear;
}
