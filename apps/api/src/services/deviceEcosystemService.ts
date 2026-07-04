import { initializeDeviceProfile } from './deviceProfileService';
import { getPowerState, tickPowerForAll } from './powerSystemService';
import { getSecurityConfig } from './deviceSecurityService';
import { processAutomaticBackups } from './deviceBackupService';
import { emitToUser } from './socketService';

export async function initializeDeviceEcosystem(userId: string, deviceName?: string) {
  const [profile, power, security] = await Promise.all([
    initializeDeviceProfile(userId, deviceName),
    getPowerState(userId),
    getSecurityConfig(userId),
  ]);

  emitToUser(userId, 'device:ecosystem:ready', {
    profile: true,
    power: true,
    security: true,
    timestamp: new Date().toISOString(),
  });

  return { ready: true, profile, power, security };
}

export async function deviceEcosystemTick(): Promise<{ power: number; backups: number }> {
  const [power, backups] = await Promise.all([
    tickPowerForAll(),
    processAutomaticBackups(),
  ]);
  return { power, backups };
}
