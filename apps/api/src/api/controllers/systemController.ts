import { Response } from 'express';
import { z } from 'zod';
import type { SystemPermissionType } from '@bananaos/shared';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { getActorId } from '../../services/rbacService';
import { getLocation, refreshLocation, setLocationEnabled } from '../../services/locationService';
import { getNetwork, refreshNetwork, updateNetworkSettings } from '../../services/networkService';
import {
  getDeviceState,
  refreshDeviceState,
  setScreenState,
  setLockState,
} from '../../services/deviceStateService';
import {
  createJob,
  getJobs,
  getJob,
  cancelJob,
  getJobStats,
} from '../../services/jobService';
import { publishEvent, replayEvents } from '../../services/eventBusService';
import {
  getPermissions,
  grantPermission,
  revokePermission,
  requestPermission,
  checkPermission,
} from '../../services/permissionBrokerService';
import {
  enqueueNotification,
  markNotificationRead,
  dismissNotification,
  getNotificationQueue,
} from '../../services/notificationBrokerService';
import {
  collectDiagnostics,
  getLatestDiagnostics,
  getDiagnosticsHistory,
} from '../../services/diagnosticsService';
import { getRegisteredTasks } from '../../services/backgroundServiceManager';
import { seedSystemPermissions } from '../../services/permissionBrokerService';
import { ensureLocation } from '../../services/locationService';
import { ensureNetwork } from '../../services/networkService';
import { ensureDeviceState } from '../../services/deviceStateService';
import { emitToUser } from '../../services/socketService';

function param(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

const appIdSchema = z.object({ appId: z.string().default('com.bananaos.system') });

// ─── Location ───────────────────────────────────────────────────────────────

export const getLocationHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { appId } = appIdSchema.parse(req.query);
  try {
    const data = await getLocation(req.user!.userId, appId);
    res.json({ success: true, data });
  } catch (err) {
    if (err instanceof Error && err.message === 'PERMISSION_DENIED') {
      throw new AppError(403, 'Location permission denied');
    }
    throw err;
  }
});

export const refreshLocationHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await refreshLocation(req.user!.userId);
  res.json({ success: true, data });
});

export const setLocationEnabledHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { enabled } = z.object({ enabled: z.boolean() }).parse(req.body);
  const data = await setLocationEnabled(req.user!.userId, enabled, getActorId(req));
  res.json({ success: true, data });
});

// ─── Network ────────────────────────────────────────────────────────────────

export const getNetworkHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await getNetwork(req.user!.userId);
  res.json({ success: true, data });
});

export const refreshNetworkHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await refreshNetwork(req.user!.userId);
  res.json({ success: true, data });
});

export const updateNetworkHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    wifiEnabled: z.boolean().optional(),
    bluetoothEnabled: z.boolean().optional(),
    vpnEnabled: z.boolean().optional(),
    vpnName: z.string().optional(),
  }).parse(req.body);
  const data = await updateNetworkSettings(req.user!.userId, body, getActorId(req));
  res.json({ success: true, data });
});

// ─── Device State ───────────────────────────────────────────────────────────

export const getDeviceStateHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await getDeviceState(req.user!.userId);
  res.json({ success: true, data });
});

export const refreshDeviceStateHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await refreshDeviceState(req.user!.userId);
  res.json({ success: true, data });
});

export const setScreenStateHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { screenState } = z.object({
    screenState: z.enum(['on', 'off', 'dimmed']),
  }).parse(req.body);
  const data = await setScreenState(req.user!.userId, screenState, getActorId(req));
  res.json({ success: true, data });
});

export const setLockStateHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { lockState } = z.object({
    lockState: z.enum(['locked', 'unlocked']),
  }).parse(req.body);
  const data = await setLockState(req.user!.userId, lockState, getActorId(req));
  res.json({ success: true, data });
});

// ─── Jobs ─────────────────────────────────────────────────────────────────

const createJobSchema = z.object({
  type: z.string().min(1),
  name: z.string().min(1),
  payload: z.record(z.unknown()).optional(),
  priority: z.enum(['low', 'normal', 'high', 'critical']).optional(),
  execution: z.enum(['background', 'foreground']).optional(),
  scheduledAt: z.string().datetime().optional(),
  recurringIntervalMs: z.number().positive().optional(),
});

export const getJobsHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const status = req.query.status as string | undefined;
  const data = await getJobs(req.user!.userId, status as never);
  res.json({ success: true, data });
});

export const getJobHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await getJob(req.user!.userId, param(req.params.id));
  res.json({ success: true, data });
});

export const createJobHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = createJobSchema.parse(req.body);
  const data = await createJob({
    userId: req.user!.userId,
    type: body.type,
    name: body.name,
    payload: body.payload,
    priority: body.priority,
    execution: body.execution,
    scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
    recurringIntervalMs: body.recurringIntervalMs,
    actorId: getActorId(req),
  });
  res.status(201).json({ success: true, data });
});

export const cancelJobHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await cancelJob(req.user!.userId, param(req.params.id), getActorId(req));
  res.json({ success: true, data });
});

export const getJobStatsHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await getJobStats(req.user!.userId);
  res.json({ success: true, data });
});

// ─── Events ─────────────────────────────────────────────────────────────────

export const publishEventHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    namespace: z.string().min(1),
    event: z.string().min(1),
    payload: z.record(z.unknown()).default({}),
    priority: z.number().optional(),
  }).parse(req.body);
  const data = await publishEvent({
    userId: req.user!.userId,
    namespace: body.namespace,
    event: body.event,
    payload: body.payload,
    priority: body.priority,
    source: req.user!.userId,
  });
  res.status(201).json({ success: true, data });
});

export const replayEventsHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { namespace, event, since, limit } = req.query;
  const data = await replayEvents({
    userId: req.user!.userId,
    namespace: namespace as string | undefined,
    event: event as string | undefined,
    since: since ? new Date(since as string) : undefined,
    limit: limit ? parseInt(limit as string, 10) : undefined,
  });
  res.json({ success: true, data });
});

// ─── Permissions ────────────────────────────────────────────────────────────

export const getPermissionsHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const appId = req.query.appId as string | undefined;
  const data = await getPermissions(req.user!.userId, appId);
  res.json({ success: true, data });
});

export const grantPermissionHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    appId: z.string().min(1),
    permission: z.string().min(1),
  }).parse(req.body);
  const data = await grantPermission(
    req.user!.userId,
    body.appId,
    body.permission as SystemPermissionType,
    getActorId(req)
  );
  res.json({ success: true, data });
});

export const revokePermissionHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    appId: z.string().min(1),
    permission: z.string().min(1),
  }).parse(req.body);
  const data = await revokePermission(
    req.user!.userId,
    body.appId,
    body.permission as SystemPermissionType,
    getActorId(req)
  );
  res.json({ success: true, data });
});

export const requestPermissionHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    appId: z.string().min(1),
    permission: z.string().min(1),
  }).parse(req.body);
  const data = await requestPermission(
    req.user!.userId,
    body.appId,
    body.permission as SystemPermissionType,
    getActorId(req)
  );
  res.json({ success: true, data });
});

export const checkPermissionHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const appId = param(req.params.appId);
  const permission = param(req.params.permission) as SystemPermissionType;
  const granted = await checkPermission(req.user!.userId, appId, permission);
  res.json({ success: true, data: { granted } });
});

// ─── Notifications ──────────────────────────────────────────────────────────

export const enqueueNotificationHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    appId: z.string().min(1),
    title: z.string().min(1),
    body: z.string().min(1),
    icon: z.string().optional(),
    priority: z.enum(['low', 'normal', 'high', 'critical']).optional(),
    silent: z.boolean().optional(),
    headsUp: z.boolean().optional(),
    dynamicIsland: z.boolean().optional(),
    groupId: z.string().optional(),
    deepLink: z.string().optional(),
    scheduledAt: z.string().datetime().optional(),
  }).parse(req.body);

  const data = await enqueueNotification({
    userId: req.user!.userId,
    appId: body.appId,
    title: body.title,
    body: body.body,
    icon: body.icon,
    priority: body.priority,
    silent: body.silent,
    headsUp: body.headsUp,
    dynamicIsland: body.dynamicIsland,
    groupId: body.groupId,
    deepLink: body.deepLink,
    scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
    actorId: getActorId(req),
  });
  res.status(201).json({ success: true, data });
});

export const getNotificationQueueHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await getNotificationQueue(req.user!.userId);
  res.json({ success: true, data });
});

export const markBrokerNotificationRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await markNotificationRead(req.user!.userId, param(req.params.id), getActorId(req));
  res.json({ success: true, data });
});

export const dismissBrokerNotification = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await dismissNotification(req.user!.userId, param(req.params.id), getActorId(req));
  res.json({ success: true, data });
});

// ─── Diagnostics ────────────────────────────────────────────────────────────

export const getDiagnosticsHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await getLatestDiagnostics(req.user!.userId);
  res.json({ success: true, data });
});

export const collectDiagnosticsHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await collectDiagnostics(req.user!.userId, true);
  res.json({ success: true, data });
});

export const getDiagnosticsHistoryHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
  const data = await getDiagnosticsHistory(req.user!.userId, limit);
  res.json({ success: true, data });
});

export const getBackgroundTasksHandler = asyncHandler(async (_req: AuthRequest, res: Response) => {
  res.json({ success: true, data: getRegisteredTasks() });
});

// ─── System Init ────────────────────────────────────────────────────────────

export async function initializeSystemServices(userId: string): Promise<void> {
  await Promise.all([
    ensureLocation(userId),
    ensureNetwork(userId),
    ensureDeviceState(userId),
    seedSystemPermissions(userId),
  ]);
  emitToUser(userId, 'system:ready', {
    services: getRegisteredTasks(),
    timestamp: new Date().toISOString(),
  });
}

export const systemReadyHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  await initializeSystemServices(req.user!.userId);
  res.json({
    success: true,
    data: {
      ready: true,
      services: getRegisteredTasks(),
      timestamp: new Date().toISOString(),
    },
  });
});
