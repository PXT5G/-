import { Types } from 'mongoose';
import { SystemRecoveryState } from '../database/models/SystemRecoveryState';
import { rollbackUpdate } from './systemUpdateService';
import { restoreBackup, getBackupHistory } from './deviceBackupService';
import { InstalledApp } from '../database/models/InstalledApp';
import { AppStorage } from '../database/models/AppStorage';
import type { RecoveryMode } from '../constants/deviceEcosystem';
import { logDeviceEcosystemAudit } from './deviceEcosystemAuditService';
import { emitToUser } from './socketService';

async function ensureRecovery(userId: string) {
  let state = await SystemRecoveryState.findOne({ userId, deletedAt: null });
  if (!state) {
    state = await SystemRecoveryState.create({ userId: new Types.ObjectId(userId) });
  }
  return state;
}

function formatRecovery(state: InstanceType<typeof SystemRecoveryState>) {
  return {
    recoveryMode: state.recoveryMode,
    safeModeEnabled: state.safeModeEnabled,
    factoryResetPending: state.factoryResetPending,
    rollbackVersion: state.rollbackVersion,
    lastRecoveryAt: state.lastRecoveryAt?.toISOString(),
  };
}

export async function getRecoveryState(userId: string) {
  const state = await ensureRecovery(userId);
  return formatRecovery(state);
}

export async function setRecoveryMode(userId: string, mode: RecoveryMode, actorId: string) {
  const state = await ensureRecovery(userId);
  state.recoveryMode = mode;
  state.safeModeEnabled = mode === 'safe';
  state.lastRecoveryAt = new Date();
  state.updatedBy = new Types.ObjectId(actorId);
  await state.save();

  await logDeviceEcosystemAudit({ userId, actorId, action: 'recovery_mode', subsystem: 'recovery', metadata: { mode } });
  emitToUser(userId, 'device:recovery:update', formatRecovery(state));
  return formatRecovery(state);
}

export async function rollbackSystemUpdate(userId: string, actorId: string) {
  const result = await rollbackUpdate(userId);
  const state = await ensureRecovery(userId);
  state.rollbackVersion = result?.previousVersion;
  state.lastRecoveryAt = new Date();
  await state.save();

  await logDeviceEcosystemAudit({ userId, actorId, action: 'rollback_update', subsystem: 'recovery' });
  emitToUser(userId, 'device:update:rollback', result);
  return result;
}

export async function factoryReset(userId: string, actorId: string, confirmPhrase: string) {
  if (confirmPhrase !== 'RESET DEVICE') throw new Error('CONFIRMATION_REQUIRED');

  const state = await ensureRecovery(userId);
  state.factoryResetPending = true;
  state.recoveryMode = 'recovery';
  await state.save();

  const apps = await InstalledApp.find({ userId, deletedAt: null });
  for (const app of apps) {
    if (!app.bundleId.startsWith('com.gulfos.system') && !app.bundleId.startsWith('com.gulfos.settings')) {
      await InstalledApp.findOneAndUpdate({ _id: app._id }, { deletedAt: new Date() });
      await AppStorage.deleteOne({ userId, bundleId: app.bundleId });
    }
  }

  state.factoryResetPending = false;
  state.lastRecoveryAt = new Date();
  await state.save();

  await logDeviceEcosystemAudit({ userId, actorId, action: 'factory_reset', subsystem: 'recovery' });
  emitToUser(userId, 'device:recovery:factory_reset', { completed: true });
  return { reset: true, appsRemoved: apps.length };
}

export async function restoreFromBackup(userId: string, backupId: string, actorId: string) {
  const result = await restoreBackup(userId, backupId, actorId);
  const state = await ensureRecovery(userId);
  state.recoveryMode = 'normal';
  state.safeModeEnabled = false;
  state.lastRecoveryAt = new Date();
  await state.save();
  return result;
}

export async function getRecoveryOptions(userId: string) {
  const [state, backups] = await Promise.all([getRecoveryState(userId), getBackupHistory(userId, 5)]);
  return { recovery: state, availableBackups: backups };
}
