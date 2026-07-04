import { Types } from 'mongoose';
import { DeviceState } from '../database/models/DeviceState';
import { DeviceProfile } from '../database/models/DeviceProfile';
import { getHardwareProfile } from './hardwareService';
import { getRamUsage } from './ramService';
import { buildStorageBreakdown } from './deviceStorageService';
import { evaluateLowStorage } from './lowStorageService';
import { emitToUser } from './socketService';
import { publishEvent } from './eventBusService';

function formatState(doc: InstanceType<typeof DeviceState>) {
  return {
    batteryLevel: doc.batteryLevel,
    batteryHealth: doc.batteryHealth,
    isCharging: doc.isCharging,
    temperature: doc.temperature,
    screenState: doc.screenState,
    lockState: doc.lockState,
    ramUsed: doc.ramUsed,
    ramTotal: doc.ramTotal,
    storageUsed: doc.storageUsed,
    storageTotal: doc.storageTotal,
    cpuLoad: doc.cpuLoad,
    gpuLoad: doc.gpuLoad,
    deviceHealth: doc.deviceHealth,
    lowPowerMode: doc.lowPowerMode,
    criticalMode: doc.criticalMode,
    emergencyMode: doc.emergencyMode,
    lastSnapshotAt: doc.lastSnapshotAt.toISOString(),
  };
}

export async function ensureDeviceState(userId: string) {
  let state = await DeviceState.findOne({ userId, deletedAt: null });
  if (!state) {
    state = await DeviceState.create({ userId: new Types.ObjectId(userId) });
  }
  return state;
}

export async function refreshDeviceState(userId: string) {
  const [hardware, ram, storage, lowStatus, profile] = await Promise.all([
    getHardwareProfile(userId),
    getRamUsage(userId),
    buildStorageBreakdown(userId),
    evaluateLowStorage(userId),
    DeviceProfile.findOne({ userId }),
  ]);

  const state = await ensureDeviceState(userId);
  state.batteryLevel = hardware.batteryLevel;
  state.batteryHealth = hardware.batteryHealth;
  state.isCharging = profile?.batteryLevelPercent === 100 && Math.random() > 0.8 ? true : state.isCharging;
  state.temperature = hardware.temperature;
  state.ramUsed = ram.used;
  state.ramTotal = ram.total;
  state.storageUsed = storage.used;
  state.storageTotal = storage.total;
  state.cpuLoad = Math.min(1, 0.1 + ram.pressure * 0.5 + Math.random() * 0.1);
  state.gpuLoad = Math.min(1, 0.05 + Math.random() * 0.15);
  state.deviceHealth = Math.round(
    (hardware.storageWear.healthPercent + hardware.batteryHealth + (100 - ram.pressure * 100)) / 3
  );
  state.lowPowerMode = lowStatus.lowStorageMode || hardware.batteryLevel < 20;
  state.criticalMode = lowStatus.level === 'critical';
  state.emergencyMode = lowStatus.emergencyMode;
  state.lastSnapshotAt = new Date();
  await state.save();

  const data = formatState(state);

  emitToUser(userId, 'device:update', data);
  emitToUser(userId, 'battery:update', {
    level: data.batteryLevel,
    health: data.batteryHealth,
    isCharging: data.isCharging,
    temperature: data.temperature,
  });

  await publishEvent({
    userId,
    namespace: 'system.device',
    event: 'device:update',
    payload: data,
    source: 'deviceStateService',
  });

  return data;
}

export async function getDeviceState(userId: string) {
  const state = await ensureDeviceState(userId);
  if (Date.now() - state.lastSnapshotAt.getTime() > 30_000) {
    return refreshDeviceState(userId);
  }
  return formatState(state);
}

export async function setScreenState(
  userId: string,
  screenState: 'on' | 'off' | 'dimmed',
  actorId: string
) {
  const state = await ensureDeviceState(userId);
  state.screenState = screenState;
  state.updatedBy = new Types.ObjectId(actorId);
  await state.save();
  return formatState(state);
}

export async function setLockState(
  userId: string,
  lockState: 'locked' | 'unlocked',
  actorId: string
) {
  const state = await ensureDeviceState(userId);
  state.lockState = lockState;
  state.updatedBy = new Types.ObjectId(actorId);
  await state.save();
  return formatState(state);
}

export async function refreshAllDeviceStates(): Promise<number> {
  const profiles = await DeviceProfile.find({}).select('userId');
  for (const p of profiles) {
    await refreshDeviceState(p.userId.toString());
  }
  return profiles.length;
}
