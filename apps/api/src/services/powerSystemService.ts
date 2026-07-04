import { Types } from 'mongoose';
import { DevicePowerState } from '../database/models/DevicePowerState';
import { DeviceProfile } from '../database/models/DeviceProfile';
import { DeviceState } from '../database/models/DeviceState';
import { BATTERY_DEGRADATION_PER_CYCLE } from '../constants/deviceEcosystem';
import type { ChargingType, PowerMode } from '../constants/deviceEcosystem';
import { logDeviceEcosystemAudit } from './deviceEcosystemAuditService';
import { emitToUser } from './socketService';
import { enqueueNotification } from './notificationBrokerService';

async function ensurePowerState(userId: string) {
  let state = await DevicePowerState.findOne({ userId, deletedAt: null });
  if (!state) {
    state = await DevicePowerState.create({ userId: new Types.ObjectId(userId) });
  }
  return state;
}

function formatPower(state: InstanceType<typeof DevicePowerState>) {
  return {
    batteryLevel: state.batteryLevel,
    batteryHealth: state.batteryHealth,
    chargingCycles: state.chargingCycles,
    chargingType: state.chargingType,
    isCharging: state.isCharging,
    fastChargingEnabled: state.fastChargingEnabled,
    wirelessChargingEnabled: state.wirelessChargingEnabled,
    powerMode: state.powerMode,
    degradationRate: state.degradationRate,
    lastChargeAt: state.lastChargeAt?.toISOString(),
    emergencyShutdownAt: state.emergencyShutdownAt?.toISOString(),
  };
}

export async function getPowerState(userId: string) {
  const state = await ensurePowerState(userId);
  const profile = await DeviceProfile.findOne({ userId });
  if (profile) {
    state.batteryLevel = profile.batteryLevelPercent;
    state.batteryHealth = profile.batteryHealthPercent;
    await state.save();
  }
  return formatPower(state);
}

export async function setCharging(
  userId: string,
  charging: boolean,
  chargingType: ChargingType = 'wired',
  actorId?: string
) {
  const state = await ensurePowerState(userId);
  const profile = await DeviceProfile.findOne({ userId });
  if (!profile) throw new Error('PROFILE_NOT_FOUND');

  if (charging) {
    if (chargingType === 'fast' && !state.fastChargingEnabled) chargingType = 'wired';
    if (chargingType === 'wireless' && !state.wirelessChargingEnabled) chargingType = 'wired';
    state.isCharging = true;
    state.chargingType = chargingType;
    state.lastChargeAt = new Date();

    const chargeRate = chargingType === 'fast' ? 3 : chargingType === 'wireless' ? 1.2 : 1.5;
    profile.batteryLevelPercent = Math.min(100, profile.batteryLevelPercent + chargeRate);
    state.batteryLevel = profile.batteryLevelPercent;

    if (profile.batteryLevelPercent >= 100 && state.chargingCycles >= 0) {
      state.chargingCycles += 1;
      const degradation = BATTERY_DEGRADATION_PER_CYCLE;
      profile.batteryHealthPercent = Math.max(70, profile.batteryHealthPercent - degradation * 100);
      state.batteryHealth = profile.batteryHealthPercent;
      state.degradationRate = degradation;
    }
  } else {
    state.isCharging = false;
    state.chargingType = 'none';
  }

  await profile.save();
  await state.save();

  const data = formatPower(state);
  emitToUser(userId, 'device:power:update', data);
  emitToUser(userId, 'battery:update', {
    level: state.batteryLevel,
    health: state.batteryHealth,
    isCharging: state.isCharging,
    chargingType: state.chargingType,
  });

  if (actorId) {
    await logDeviceEcosystemAudit({ userId, actorId, action: charging ? 'charge_start' : 'charge_stop', subsystem: 'power', metadata: { chargingType } });
  }
  return data;
}

export async function simulateBatteryDrain(userId: string) {
  const state = await ensurePowerState(userId);
  const profile = await DeviceProfile.findOne({ userId });
  if (!profile || state.isCharging) return formatPower(state);

  const drainRate = state.powerMode === 'low_power' ? 0.05 : state.powerMode === 'critical' ? 0.15 : 0.08;
  profile.batteryLevelPercent = Math.max(0, profile.batteryLevelPercent - drainRate);
  state.batteryLevel = profile.batteryLevelPercent;

  if (profile.batteryLevelPercent <= 5 && state.powerMode !== 'critical') {
    state.powerMode = 'critical';
    await DeviceState.findOneAndUpdate({ userId }, { criticalMode: true, lowPowerMode: true });
  }
  if (profile.batteryLevelPercent <= 1 && state.powerMode !== 'emergency_shutdown') {
    return triggerEmergencyShutdown(userId);
  }

  await profile.save();
  await state.save();
  return formatPower(state);
}

export async function setPowerMode(userId: string, mode: PowerMode, actorId: string) {
  const state = await ensurePowerState(userId);
  state.powerMode = mode;
  state.updatedBy = new Types.ObjectId(actorId);
  await state.save();

  const deviceState = await DeviceState.findOneAndUpdate(
    { userId },
    {
      lowPowerMode: mode === 'low_power' || mode === 'critical',
      criticalMode: mode === 'critical',
      emergencyMode: mode === 'emergency_shutdown',
    },
    { new: true }
  );

  await logDeviceEcosystemAudit({ userId, actorId, action: 'power_mode', subsystem: 'power', metadata: { mode } });
  const data = formatPower(state);
  emitToUser(userId, 'device:power:update', data);
  if (deviceState) emitToUser(userId, 'device:update', { lowPowerMode: deviceState.lowPowerMode, criticalMode: deviceState.criticalMode });
  return data;
}

export async function triggerEmergencyShutdown(userId: string) {
  const state = await ensurePowerState(userId);
  state.powerMode = 'emergency_shutdown';
  state.emergencyShutdownAt = new Date();
  state.isCharging = false;
  state.chargingType = 'none';
  await state.save();

  await DeviceState.findOneAndUpdate({ userId }, { emergencyMode: true, screenState: 'off', lockState: 'locked' });
  await enqueueNotification({
    userId,
    appId: 'com.gulfos.system',
    title: 'Emergency Shutdown',
    body: 'Device shut down due to critical battery level',
    priority: 'critical',
    silent: false,
  });

  const data = formatPower(state);
  emitToUser(userId, 'device:power:emergency', data);
  return data;
}

export async function tickPowerForAll(): Promise<number> {
  const states = await DevicePowerState.find({ deletedAt: null, isCharging: false, powerMode: { $ne: 'emergency_shutdown' } });
  for (const s of states) {
    await simulateBatteryDrain(s.userId.toString());
  }
  return states.length;
}
