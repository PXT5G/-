import crypto from 'crypto';
import { Types } from 'mongoose';
import { PowerState } from '../database/models/PowerState';
import { BatteryState } from '../database/models/BatteryState';
import { PerformanceState } from '../database/models/PerformanceState';
import { DeviceProfile } from '../database/models/DeviceProfile';
import { DeviceState } from '../database/models/DeviceState';
import { DevicePowerState } from '../database/models/DevicePowerState';
import type { PerformanceMode, PowerAction } from '../constants/phoneOs';
import {
  BATTERY_TEMP_CRITICAL_C,
  BATTERY_TEMP_WARNING_C,
  CPU_THROTTLE_THRESHOLD,
  GPU_THROTTLE_THRESHOLD,
} from '../constants/phoneOs';
import { getHardwareProfile } from './hardwareService';
import { getRamUsage } from './ramService';
import { refreshDeviceState } from './deviceStateService';
import { getPowerState, setCharging, setPowerMode, simulateBatteryDrain } from './powerSystemService';
import { initializePhoneOsConfigs } from './phoneOsConfigService';
import { collectExtendedDiagnostics } from './deviceDiagnosticsService';
import { logAudit } from './auditService';
import { emitToUser } from './socketService';
import { publishEvent } from './eventBusService';

function isDuplicateKeyError(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && (err as { code: number }).code === 11000;
}

async function ensureUniqueState<T>(
  find: () => Promise<T | null>,
  create: () => Promise<T>
): Promise<T> {
  const existing = await find();
  if (existing) return existing;
  try {
    return await create();
  } catch (err) {
    if (!isDuplicateKeyError(err)) throw err;
    const raced = await find();
    if (!raced) throw err;
    return raced;
  }
}

async function ensurePowerState(userId: string) {
  const oid = new Types.ObjectId(userId);
  return ensureUniqueState(
    () => PowerState.findOne({ userId: oid, deletedAt: null }),
    () =>
      PowerState.create({
        userId: oid,
        isPoweredOn: true,
        bootPhase: 'home',
        lastBootAt: new Date(),
      })
  );
}

async function ensureBatteryState(userId: string) {
  const oid = new Types.ObjectId(userId);
  return ensureUniqueState(
    () => BatteryState.findOne({ userId: oid, deletedAt: null }),
    async () => {
      const power = await DevicePowerState.findOne({ userId });
      const profile = await DeviceProfile.findOne({ userId });
      return BatteryState.create({
        userId: oid,
        level: profile?.batteryLevelPercent ?? 100,
        health: profile?.batteryHealthPercent ?? 100,
        isCharging: power?.isCharging ?? false,
        chargingType: power?.chargingType ?? 'none',
        fastChargingEnabled: power?.fastChargingEnabled ?? true,
        wirelessChargingEnabled: power?.wirelessChargingEnabled ?? true,
        chargingCycles: power?.chargingCycles ?? 0,
        temperatureCelsius: profile?.temperatureCelsius ?? 32,
      });
    }
  );
}

async function ensurePerformanceState(userId: string) {
  const oid = new Types.ObjectId(userId);
  return ensureUniqueState(
    () => PerformanceState.findOne({ userId: oid, deletedAt: null }),
    () => PerformanceState.create({ userId: oid })
  );
}

function formatBattery(state: InstanceType<typeof BatteryState>) {
  return {
    level: state.level,
    health: state.health,
    isCharging: state.isCharging,
    chargingType: state.chargingType,
    fastChargingEnabled: state.fastChargingEnabled,
    wirelessChargingEnabled: state.wirelessChargingEnabled,
    chargingCycles: state.chargingCycles,
    temperatureCelsius: state.temperatureCelsius,
    degradationRate: state.degradationRate,
    estimatedTimeToFullMinutes: state.estimatedTimeToFullMinutes,
    estimatedTimeToEmptyMinutes: state.estimatedTimeToEmptyMinutes,
    lastChargeAt: state.lastChargeAt?.toISOString(),
    lastDischargeAt: state.lastDischargeAt?.toISOString(),
  };
}

function formatPerformance(state: InstanceType<typeof PerformanceState>) {
  return {
    performanceMode: state.performanceMode,
    thermalState: state.thermalState,
    cpuUsagePercent: state.cpuUsagePercent,
    gpuUsagePercent: state.gpuUsagePercent,
    memoryPressure: state.memoryPressure,
    backgroundApps: state.backgroundApps.map((a) => ({
      bundleId: a.bundleId,
      memoryMb: a.memoryMb,
      cpuPercent: a.cpuPercent,
      frozen: a.frozen,
      pinned: a.pinned,
      locked: a.locked,
      lastActiveAt: a.lastActiveAt.toISOString(),
    })),
    cpuThrottled: state.cpuThrottled,
    gpuThrottled: state.gpuThrottled,
    batteryOptimized: state.batteryOptimized,
    lastTickAt: state.lastTickAt.toISOString(),
  };
}

function formatPower(state: InstanceType<typeof PowerState>) {
  return {
    isPoweredOn: state.isPoweredOn,
    bootPhase: state.bootPhase,
    lastBootAt: state.lastBootAt?.toISOString(),
    lastShutdownAt: state.lastShutdownAt?.toISOString(),
    lastRestartAt: state.lastRestartAt?.toISOString(),
    crashRecoveryPending: state.crashRecoveryPending,
    emergencyRestartCount: state.emergencyRestartCount,
  };
}

export async function getFullDeviceInfo(userId: string) {
  const [hardware, power, battery, performance, deviceState, configs] = await Promise.all([
    getHardwareProfile(userId),
    ensurePowerState(userId),
    syncBatteryState(userId),
    refreshPerformanceState(userId),
    refreshDeviceState(userId),
    initializePhoneOsConfigs(userId),
  ]);

  return {
    profile: hardware,
    power: formatPower(power),
    battery,
    performance,
    deviceState,
    configs,
  };
}

export async function syncBatteryState(userId: string) {
  const [battery, powerData] = await Promise.all([
    ensureBatteryState(userId),
    getPowerState(userId),
  ]);
  const profile = await DeviceProfile.findOne({ userId });

  battery.level = powerData.batteryLevel;
  battery.health = powerData.batteryHealth;
  battery.isCharging = powerData.isCharging;
  battery.chargingType = powerData.chargingType;
  battery.chargingCycles = powerData.chargingCycles;
  battery.fastChargingEnabled = powerData.fastChargingEnabled;
  battery.wirelessChargingEnabled = powerData.wirelessChargingEnabled;
  battery.degradationRate = powerData.degradationRate;
  battery.temperatureCelsius = profile?.temperatureCelsius ?? battery.temperatureCelsius;

  if (battery.isCharging) {
    const rate = battery.chargingType === 'fast' ? 2 : battery.chargingType === 'wireless' ? 1.2 : 1.5;
    battery.estimatedTimeToFullMinutes = Math.max(0, Math.round((100 - battery.level) / rate));
    battery.lastChargeAt = new Date();
  } else {
    const drainRate = battery.level > 20 ? 0.5 : 0.3;
    battery.estimatedTimeToEmptyMinutes = Math.round(battery.level / drainRate);
    battery.lastDischargeAt = new Date();
  }

  await battery.save();
  const data = formatBattery(battery);
  emitToUser(userId, 'battery:update', data);
  return data;
}

export async function refreshPerformanceState(userId: string) {
  const [perf, ram, deviceState] = await Promise.all([
    ensurePerformanceState(userId),
    getRamUsage(userId),
    DeviceState.findOne({ userId }),
  ]);

  const profile = await DeviceProfile.findOne({ userId });
  const temp = profile?.temperatureCelsius ?? 32;

  perf.cpuUsagePercent = Math.round((deviceState?.cpuLoad ?? 0.15) * 100);
  perf.gpuUsagePercent = Math.round((deviceState?.gpuLoad ?? 0.1) * 100);
  perf.memoryPressure = ram.pressure;
  perf.cpuThrottled = perf.cpuUsagePercent / 100 > CPU_THROTTLE_THRESHOLD;
  perf.gpuThrottled = perf.gpuUsagePercent / 100 > GPU_THROTTLE_THRESHOLD;
  perf.batteryOptimized = perf.performanceMode === 'power_saving' || perf.performanceMode === 'ultra_power_saving';

  if (temp >= BATTERY_TEMP_CRITICAL_C) perf.thermalState = 'critical';
  else if (temp >= BATTERY_TEMP_WARNING_C) perf.thermalState = 'serious';
  else if (temp >= 38) perf.thermalState = 'fair';
  else perf.thermalState = 'nominal';

  perf.lastTickAt = new Date();
  await perf.save();

  const data = formatPerformance(perf);
  emitToUser(userId, 'performance:update', data);
  return data;
}

export async function setPerformanceMode(userId: string, mode: PerformanceMode, actorId: string) {
  const perf = await ensurePerformanceState(userId);
  perf.performanceMode = mode;
  perf.batteryOptimized = mode === 'power_saving' || mode === 'ultra_power_saving';
  perf.updatedBy = new Types.ObjectId(actorId);
  await perf.save();

  const deviceState = await DeviceState.findOne({ userId });
  if (deviceState) {
    deviceState.lowPowerMode = mode === 'power_saving' || mode === 'ultra_power_saving';
    await deviceState.save();
  }

  if (mode === 'power_saving' || mode === 'ultra_power_saving') {
    await setPowerMode(userId, 'low_power', actorId);
  } else {
    await setPowerMode(userId, 'normal', actorId);
  }

  await logAudit({
    userId,
    actorId,
    action: 'performance_mode_change',
    resource: 'phone_os',
    metadata: { mode },
  });

  const data = formatPerformance(perf);
  emitToUser(userId, 'performance:update', data);
  return data;
}

export async function executePowerAction(userId: string, action: PowerAction, actorId: string) {
  const power = await ensurePowerState(userId);
  const now = new Date();

  switch (action) {
    case 'power_on':
      power.isPoweredOn = true;
      power.bootPhase = 'booting';
      power.lastBootAt = now;
      power.crashRecoveryPending = false;
      emitToUser(userId, 'device:boot', { phase: 'booting' });
      break;
    case 'power_off':
      power.isPoweredOn = false;
      power.bootPhase = 'off';
      power.lastShutdownAt = now;
      emitToUser(userId, 'device:shutdown', { at: now.toISOString() });
      break;
    case 'restart':
      power.bootPhase = 'booting';
      power.lastRestartAt = now;
      power.lastBootAt = now;
      emitToUser(userId, 'device:restart', { at: now.toISOString() });
      break;
    case 'emergency_restart':
      power.emergencyRestartCount += 1;
      power.bootPhase = 'booting';
      power.crashRecoveryPending = true;
      power.lastRestartAt = now;
      emitToUser(userId, 'device:restart', { emergency: true, at: now.toISOString() });
      break;
  }

  power.updatedBy = new Types.ObjectId(actorId);
  await power.save();

  await logAudit({
    userId,
    actorId,
    action: `device_${action}`,
    resource: 'phone_os',
    metadata: { bootPhase: power.bootPhase },
  });

  const data = formatPower(power);
  emitToUser(userId, 'security:update', { power: data });
  return data;
}

export async function startCharging(
  userId: string,
  chargingType: 'wired' | 'fast' | 'wireless',
  actorId: string
) {
  await setCharging(userId, true, chargingType, actorId);
  const battery = await syncBatteryState(userId);
  emitToUser(userId, 'charging:start', { chargingType, level: battery.level });
  return battery;
}

export async function stopCharging(userId: string, actorId: string) {
  await setCharging(userId, false, 'none', actorId);
  const battery = await syncBatteryState(userId);
  emitToUser(userId, 'charging:stop', { level: battery.level });
  return battery;
}

export async function freezeBackgroundApp(userId: string, bundleId: string, actorId: string) {
  const perf = await ensurePerformanceState(userId);
  const app = perf.backgroundApps.find((a) => a.bundleId === bundleId);
  if (app) {
    app.frozen = true;
    app.cpuPercent = 0;
  } else {
    perf.backgroundApps.push({
      bundleId,
      memoryMb: 0,
      cpuPercent: 0,
      frozen: true,
      pinned: false,
      locked: false,
      lastActiveAt: new Date(),
    });
  }
  perf.updatedBy = new Types.ObjectId(actorId);
  await perf.save();
  return formatPerformance(perf);
}

export async function pinBackgroundApp(userId: string, bundleId: string, pinned: boolean, actorId: string) {
  const perf = await ensurePerformanceState(userId);
  const app = perf.backgroundApps.find((a) => a.bundleId === bundleId);
  if (app) app.pinned = pinned;
  perf.updatedBy = new Types.ObjectId(actorId);
  await perf.save();
  return formatPerformance(perf);
}

export async function getDeviceDiagnostics(userId: string) {
  const [extended, deviceState, battery, performance] = await Promise.all([
    collectExtendedDiagnostics(userId),
    refreshDeviceState(userId),
    syncBatteryState(userId),
    refreshPerformanceState(userId),
  ]);

  return {
    ...extended,
    deviceState,
    battery,
    performance,
    generatedAt: new Date().toISOString(),
  };
}

export async function initializePhoneOs(userId: string, actorId: string) {
  await Promise.all([
    ensurePowerState(userId),
    ensurePerformanceState(userId),
    initializePhoneOsConfigs(userId),
  ]);
  await syncBatteryState(userId);

  await logAudit({
    userId,
    actorId,
    action: 'phone_os_initialize',
    resource: 'phone_os',
  });

  const data = await getFullDeviceInfo(userId);
  emitToUser(userId, 'device:ecosystem:ready', { phoneOs: true });
  await publishEvent({
    userId,
    namespace: 'phone.os',
    event: 'device:ecosystem:ready',
    payload: data,
    source: 'phoneOsService',
  });

  return data;
}

export async function phoneOsTick(userId: string) {
  await simulateBatteryDrain(userId);
  await syncBatteryState(userId);
  await refreshPerformanceState(userId);
}

export async function phoneOsTickAll() {
  const profiles = await DeviceProfile.find({}).select('userId');
  for (const p of profiles) {
    try {
      await phoneOsTick(p.userId.toString());
    } catch (err) {
      console.error(`[PhoneOS] Tick failed for ${p.userId}:`, err);
    }
  }
  return profiles.length;
}

export function generateActivityId(): string {
  return crypto.randomUUID();
}
