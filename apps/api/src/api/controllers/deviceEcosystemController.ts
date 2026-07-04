import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { getActorId } from '../../services/rbacService';
import { initializeDeviceEcosystem } from '../../services/deviceEcosystemService';
import { getDeviceProfile, updateDeviceProfile } from '../../services/deviceProfileService';
import { getPowerState, setCharging, setPowerMode } from '../../services/powerSystemService';
import {
  getSecurityConfig,
  updateSecurityMethods,
  attemptUnlock,
  addTrustedDevice,
  remoteLock,
  remoteWipe,
} from '../../services/deviceSecurityService';
import {
  getExpandedStorageBreakdown,
  detectDuplicates,
  systemCleanup,
  emptyTrashWithAudit,
} from '../../services/storageExpansionService';
import {
  createBackup,
  getBackupHistory,
  restoreBackup,
  getBackupQueue,
} from '../../services/deviceBackupService';
import { startDeviceSync, getSyncHistory, getSyncStatus } from '../../services/deviceSyncService';
import { collectExtendedDiagnostics, getDiagnosticsHistory } from '../../services/deviceDiagnosticsService';
import { runMaintenance, getMaintenanceHistory } from '../../services/deviceMaintenanceService';
import {
  getDeveloperDashboard,
  getDeveloperLogs,
  getApiInspector,
  getSocketInspector,
  getPermissionViewer,
  getStorageViewer,
  getNetworkViewer,
} from '../../services/developerModeService';
import {
  getRecoveryOptions,
  setRecoveryMode,
  rollbackSystemUpdate,
  factoryReset,
  restoreFromBackup,
} from '../../services/systemRecoveryService';
import {
  UNLOCK_METHODS,
  POWER_MODES,
  CHARGING_TYPES,
  BACKUP_TYPES,
  SYNC_DOMAINS,
  RECOVERY_MODES,
  MAINTENANCE_ACTIONS,
} from '../../constants/deviceEcosystem';

function param(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

const appIdSchema = z.object({ appId: z.string().default('com.bananaos.system') });

function mapError(err: unknown): never {
  if (!(err instanceof Error)) throw err;
  const map: Record<string, [number, string]> = {
    PROFILE_NOT_FOUND: [404, 'Device profile not found'],
    UNLOCK_FAILED: [401, 'Unlock failed'],
    TEMP_LOCKED: [423, 'Device temporarily locked'],
    REMOTE_LOCKED: [423, 'Device remotely locked'],
    BACKUP_NOT_FOUND: [404, 'Backup not found'],
    PERMISSION_DENIED: [403, 'Permission denied'],
    CONFIRMATION_REQUIRED: [400, 'Confirmation phrase required'],
  };
  const entry = map[err.message];
  if (entry) throw new AppError(entry[0], entry[1]);
  throw err;
}

// ─── Init ───────────────────────────────────────────────────────────────────

export const initializeHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { deviceName } = z.object({ deviceName: z.string().optional() }).parse(req.body ?? {});
  const data = await initializeDeviceEcosystem(req.user!.userId, deviceName);
  res.json({ success: true, data });
});

// ─── Profile ────────────────────────────────────────────────────────────────

export const getProfileHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await getDeviceProfile(req.user!.userId);
  res.json({ success: true, data });
});

export const updateProfileHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    deviceName: z.string().optional(),
    region: z.string().optional(),
    language: z.string().optional(),
    timezone: z.string().optional(),
  }).parse(req.body);
  try {
    const data = await updateDeviceProfile(req.user!.userId, body, getActorId(req));
    res.json({ success: true, data });
  } catch (err) {
    mapError(err);
  }
});

// ─── Power ──────────────────────────────────────────────────────────────────

export const getPowerHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await getPowerState(req.user!.userId);
  res.json({ success: true, data });
});

export const setChargingHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    charging: z.boolean(),
    chargingType: z.enum(CHARGING_TYPES as unknown as [string, ...string[]]).optional(),
  }).parse(req.body);
  const data = await setCharging(
    req.user!.userId,
    body.charging,
    (body.chargingType ?? 'wired') as never,
    getActorId(req)
  );
  res.json({ success: true, data });
});

export const setPowerModeHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { mode } = z.object({
    mode: z.enum(POWER_MODES as unknown as [string, ...string[]]),
  }).parse(req.body);
  const data = await setPowerMode(req.user!.userId, mode as never, getActorId(req));
  res.json({ success: true, data });
});

// ─── Security ───────────────────────────────────────────────────────────────

export const getSecurityHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await getSecurityConfig(req.user!.userId);
  res.json({ success: true, data });
});

export const updateSecurityHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    faceUnlockEnabled: z.boolean().optional(),
    fingerprintEnabled: z.boolean().optional(),
    pinEnabled: z.boolean().optional(),
    passwordEnabled: z.boolean().optional(),
    primaryUnlockMethod: z.enum(UNLOCK_METHODS as unknown as [string, ...string[]]).optional(),
  }).parse(req.body);
  const data = await updateSecurityMethods(req.user!.userId, body as never, getActorId(req));
  res.json({ success: true, data });
});

export const unlockHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    method: z.enum(UNLOCK_METHODS as unknown as [string, ...string[]]),
    credential: z.string().min(1),
    deviceId: z.string().optional(),
    deviceName: z.string().optional(),
  }).parse(req.body);
  try {
    const data = await attemptUnlock(
      req.user!.userId,
      body.method as never,
      body.credential,
      body.deviceId,
      body.deviceName
    );
    res.json({ success: true, data });
  } catch (err) {
    mapError(err);
  }
});

export const addTrustedDeviceHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { deviceId, deviceName } = z.object({
    deviceId: z.string(),
    deviceName: z.string(),
  }).parse(req.body);
  const data = await addTrustedDevice(req.user!.userId, deviceId, deviceName, getActorId(req));
  res.json({ success: true, data });
});

export const remoteLockHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { appId } = appIdSchema.parse(req.body);
  try {
    const data = await remoteLock(req.user!.userId, getActorId(req), appId);
    res.json({ success: true, data });
  } catch (err) {
    mapError(err);
  }
});

export const remoteWipeHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { appId } = appIdSchema.parse(req.body);
  try {
    const data = await remoteWipe(req.user!.userId, getActorId(req), appId);
    res.json({ success: true, data });
  } catch (err) {
    mapError(err);
  }
});

// ─── Storage ────────────────────────────────────────────────────────────────

export const getExpandedStorageHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await getExpandedStorageBreakdown(req.user!.userId);
  res.json({ success: true, data });
});

export const storageCleanupHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await systemCleanup(req.user!.userId, getActorId(req));
  res.json({ success: true, data });
});

export const emptyTrashHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await emptyTrashWithAudit(req.user!.userId, getActorId(req));
  res.json({ success: true, data });
});

export const detectDuplicatesHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await detectDuplicates(req.user!.userId);
  res.json({ success: true, data });
});

// ─── Backup ─────────────────────────────────────────────────────────────────

export const createBackupHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { backupType } = z.object({
    backupType: z.enum(BACKUP_TYPES as unknown as [string, ...string[]]).default('manual'),
  }).parse(req.body ?? {});
  const data = await createBackup(req.user!.userId, backupType as never, getActorId(req));
  res.status(201).json({ success: true, data });
});

export const getBackupHistoryHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
  const data = await getBackupHistory(req.user!.userId, limit);
  res.json({ success: true, data });
});

export const restoreBackupHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await restoreBackup(req.user!.userId, param(req.params.backupId), getActorId(req));
    res.json({ success: true, data });
  } catch (err) {
    mapError(err);
  }
});

export const getBackupQueueHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await getBackupQueue(req.user!.userId);
  res.json({ success: true, data });
});

// ─── Sync ───────────────────────────────────────────────────────────────────

export const startSyncHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    sourceDeviceId: z.string(),
    targetDeviceId: z.string(),
    domains: z.array(z.enum(SYNC_DOMAINS as unknown as [string, ...string[]])).optional(),
  }).parse(req.body);
  const data = await startDeviceSync(req.user!.userId, body as never, getActorId(req));
  res.status(201).json({ success: true, data });
});

export const getSyncHistoryHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
  const data = await getSyncHistory(req.user!.userId, limit);
  res.json({ success: true, data });
});

export const getSyncStatusHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await getSyncStatus(req.user!.userId);
  res.json({ success: true, data });
});

// ─── Diagnostics ────────────────────────────────────────────────────────────

export const collectDiagnosticsHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await collectExtendedDiagnostics(req.user!.userId);
  res.json({ success: true, data });
});

export const getDiagnosticsHistoryHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
  const data = await getDiagnosticsHistory(req.user!.userId, limit);
  res.json({ success: true, data });
});

// ─── Maintenance ────────────────────────────────────────────────────────────

export const runMaintenanceHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { action } = z.object({
    action: z.enum(MAINTENANCE_ACTIONS as unknown as [string, ...string[]]),
  }).parse(req.body);
  const data = await runMaintenance(req.user!.userId, action as never, getActorId(req));
  res.json({ success: true, data });
});

export const getMaintenanceHistoryHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
  const data = await getMaintenanceHistory(req.user!.userId, limit);
  res.json({ success: true, data });
});

// ─── Developer Mode ───────────────────────────────────────────────────────────

export const getDeveloperDashboardHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await getDeveloperDashboard(req.user!.userId);
  res.json({ success: true, data });
});

export const getDeveloperLogsHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
  const level = req.query.level as string | undefined;
  const data = await getDeveloperLogs(req.user!.userId, limit, level);
  res.json({ success: true, data });
});

export const getApiInspectorHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await getApiInspector(req.user!.userId);
  res.json({ success: true, data });
});

export const getSocketInspectorHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await getSocketInspector(req.user!.userId);
  res.json({ success: true, data });
});

export const getPermissionViewerHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await getPermissionViewer(req.user!.userId);
  res.json({ success: true, data });
});

export const getStorageViewerHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await getStorageViewer(req.user!.userId);
  res.json({ success: true, data });
});

export const getNetworkViewerHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await getNetworkViewer(req.user!.userId);
  res.json({ success: true, data });
});

// ─── Recovery ───────────────────────────────────────────────────────────────

export const getRecoveryHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await getRecoveryOptions(req.user!.userId);
  res.json({ success: true, data });
});

export const setRecoveryModeHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { mode } = z.object({
    mode: z.enum(RECOVERY_MODES as unknown as [string, ...string[]]),
  }).parse(req.body);
  const data = await setRecoveryMode(req.user!.userId, mode as never, getActorId(req));
  res.json({ success: true, data });
});

export const rollbackHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await rollbackSystemUpdate(req.user!.userId, getActorId(req));
  res.json({ success: true, data });
});

export const factoryResetHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { confirmPhrase } = z.object({ confirmPhrase: z.string() }).parse(req.body);
  try {
    const data = await factoryReset(req.user!.userId, getActorId(req), confirmPhrase);
    res.json({ success: true, data });
  } catch (err) {
    mapError(err);
  }
});

export const recoveryRestoreHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await restoreFromBackup(req.user!.userId, param(req.params.backupId), getActorId(req));
    res.json({ success: true, data });
  } catch (err) {
    mapError(err);
  }
});
