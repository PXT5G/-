import crypto from 'crypto';
import { Types } from 'mongoose';
import { DeviceProfile } from '../database/models/DeviceProfile';
import { DEVICE_GENERATIONS, DEVICE_COLORS } from '../constants/hardwareSpecs';
import { DEFAULT_CAPACITY, formatCapacityLabel, type StorageCapacityTier } from '../constants/appSizes';

function generateSerial(): string {
  return `BN${crypto.randomBytes(6).toString('hex').toUpperCase().slice(0, 10)}`;
}

function generateImei(): string {
  const digits = Array.from({ length: 14 }, () => Math.floor(Math.random() * 10)).join('');
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    let d = parseInt(digits[i], 10);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  const check = (10 - (sum % 10)) % 10;
  return digits + check;
}

function generateMac(): string {
  const bytes = crypto.randomBytes(6);
  bytes[0] = (bytes[0] | 0x02) & 0xfe;
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join(':')
    .toUpperCase();
}

export function pickDeviceGeneration() {
  return DEVICE_GENERATIONS[Math.floor(Math.random() * DEVICE_GENERATIONS.length)];
}

export async function seedHardwareProfile(
  userId: string,
  capacity: StorageCapacityTier = DEFAULT_CAPACITY,
  deviceName = 'Gulf Phone V1'
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
      imei: generateImei(),
      secureDeviceId: crypto.randomBytes(32).toString('hex'),
      simStatus: 'active',
      carrier: 'Gulf Mobile',
      networkType: '5G',
      bluetoothMac: generateMac(),
      wifiMac: generateMac(),
      kernelVersion: '6.12.58-gulf',
      installedBuild: '100',
      activationDate: new Date(),
      deviceHealthScore: 100,
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
    installedBuild: profile.installedBuild,
    kernelVersion: profile.kernelVersion,
    imei: profile.imei,
    secureDeviceId: profile.secureDeviceId,
    simStatus: profile.simStatus,
    carrier: profile.carrier,
    networkType: profile.networkType,
    bluetoothMac: profile.bluetoothMac,
    wifiMac: profile.wifiMac,
    activationDate: profile.activationDate?.toISOString(),
    deviceHealthScore: profile.deviceHealthScore,
    lastBoot: profile.bootedAt.toISOString(),
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
  // Deprecated: use backgroundServiceManager
}

export async function refreshAllHardware(): Promise<number> {
  const profiles = await DeviceProfile.find({}).select('userId');
  for (const p of profiles) {
    await simulateTemperature(p.userId.toString());
    if (Math.random() < 0.3) {
      await simulateBatteryDrain(p.userId.toString(), 0.1);
    }
  }
  return profiles.length;
}
