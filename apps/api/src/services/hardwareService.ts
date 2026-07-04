import crypto from 'crypto';
import { Types } from 'mongoose';
import { DeviceProfile } from '../database/models/DeviceProfile';
import { DEVICE_GENERATIONS, DEVICE_COLORS } from '../constants/hardwareSpecs';
import { DEFAULT_CAPACITY, formatCapacityLabel, type StorageCapacityTier } from '../constants/appSizes';

function generateSerial(): string {
  return `BN${crypto.randomBytes(6).toString('hex').toUpperCase().slice(0, 10)}`;
}

export function pickDeviceGeneration() {
  return DEVICE_GENERATIONS[Math.floor(Math.random() * DEVICE_GENERATIONS.length)];
}

export async function seedHardwareProfile(
  userId: string,
  capacity: StorageCapacityTier = DEFAULT_CAPACITY,
  deviceName = 'Banana Phone'
) {
  const gen = pickDeviceGeneration();
  const color = DEVICE_COLORS[Math.floor(Math.random() * DEVICE_COLORS.length)];
  const uuid = crypto.randomUUID();

  const profile = await DeviceProfile.findOneAndUpdate(
    { userId },
    {
      userId: new Types.ObjectId(userId),
      deviceName,
      deviceModel: gen.name,
      deviceColor: color,
      serialNumber: generateSerial(),
      deviceUuid: uuid,
      generation: gen.id,
      cpuModel: gen.cpu,
      gpuModel: gen.gpu,
      ramTotalBytes: gen.ram,
      totalCapacity: capacity,
      capacityTier: formatCapacityLabel(capacity),
      batteryCapacityMah: gen.battery,
      batteryHealthPercent: 100,
      batteryLevelPercent: 100,
      displayResolution: gen.display,
      bootedAt: new Date(),
      storageWear: {
        healthPercent: 100,
        lifetimeWrites: 0,
        lifetimeReads: 0,
        estimatedRemainingLifeYears: 8,
      },
    },
    { upsert: true, new: true }
  );

  return profile;
}

export async function getHardwareProfile(userId: string) {
  let profile = await DeviceProfile.findOne({ userId });
  if (!profile) {
    profile = await seedHardwareProfile(userId);
  }

  const uptimeMs = Date.now() - profile.bootedAt.getTime();

  return {
    deviceName: profile.deviceName,
    deviceModel: profile.deviceModel,
    deviceColor: profile.deviceColor,
    serialNumber: profile.serialNumber,
    deviceUuid: profile.deviceUuid,
    generation: profile.generation,
    cpu: profile.cpuModel,
    gpu: profile.gpuModel,
    ramTotal: profile.ramTotalBytes,
    internalStorage: profile.totalCapacity,
    capacityTier: profile.capacityTier,
    batteryCapacity: profile.batteryCapacityMah,
    batteryHealth: profile.batteryHealthPercent,
    batteryLevel: profile.batteryLevelPercent,
    displayResolution: profile.displayResolution,
    osVersion: profile.osVersion,
    buildNumber: profile.buildNumber,
    temperature: profile.temperatureCelsius,
    uptimeMs,
    storageWear: profile.storageWear,
    lowStorageMode: profile.lowStorageMode,
    emergencyMode: profile.emergencyMode,
    lowStorageLevel: profile.lowStorageLevel,
  };
}

export async function simulateTemperature(userId: string): Promise<number> {
  const profile = await DeviceProfile.findOne({ userId });
  if (!profile) return 32;
  const base = 30 + Math.random() * 8;
  profile.temperatureCelsius = Math.round(base * 10) / 10;
  await profile.save();
  return profile.temperatureCelsius;
}

export async function simulateBatteryDrain(userId: string, deltaPercent: number): Promise<number> {
  const profile = await DeviceProfile.findOne({ userId });
  if (!profile) return 100;
  profile.batteryLevelPercent = Math.max(0, profile.batteryLevelPercent - deltaPercent);
  await profile.save();
  return profile.batteryLevelPercent;
}

export async function ensureHardwareProfile(userId: string, deviceName?: string) {
  const profile = await DeviceProfile.findOne({ userId });
  if (!profile) {
    return seedHardwareProfile(userId, undefined, deviceName);
  }
  if (profile.serialNumber && profile.deviceUuid) {
    return profile;
  }

  const gen = pickDeviceGeneration();
  const color = DEVICE_COLORS[Math.floor(Math.random() * DEVICE_COLORS.length)];
  profile.deviceModel = profile.deviceModel || gen.name;
  profile.deviceColor = profile.deviceColor || color;
  profile.serialNumber = profile.serialNumber || generateSerial();
  profile.deviceUuid = profile.deviceUuid || crypto.randomUUID();
  profile.generation = profile.generation || gen.id;
  profile.cpuModel = profile.cpuModel || gen.cpu;
  profile.gpuModel = profile.gpuModel || gen.gpu;
  profile.ramTotalBytes = profile.ramTotalBytes || gen.ram;
  profile.batteryCapacityMah = profile.batteryCapacityMah || gen.battery;
  profile.displayResolution = profile.displayResolution || gen.display;
  profile.bootedAt = profile.bootedAt || new Date();
  if (!profile.storageWear?.healthPercent) {
    profile.storageWear = {
      healthPercent: 100,
      lifetimeWrites: 0,
      lifetimeReads: 0,
      estimatedRemainingLifeYears: 8,
    };
  }
  await profile.save();
  return profile;
}

export function startHardwareSimulator(): void {
  setInterval(async () => {
    try {
      const profiles = await DeviceProfile.find({}).select('userId');
      for (const p of profiles) {
        await simulateTemperature(p.userId.toString());
        if (Math.random() < 0.3) {
          await simulateBatteryDrain(p.userId.toString(), 0.1);
        }
      }
    } catch (err) {
      console.error('[Hardware] Simulator tick failed:', err);
    }
  }, 5 * 60 * 1000);
}
