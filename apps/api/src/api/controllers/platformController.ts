import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import {
  identityBridgeService,
  permissionEngineService,
  auditService,
  eventBusService,
  notificationService,
  BANANAOS_APP_IDS,
} from '../../platform';

export const getIdentityContext = asyncHandler(async (req: AuthRequest, res: Response) => {
  const context = await identityBridgeService.getIdentityContext(req.user!.userId);
  res.json({ success: true, data: context });
});

export const verifyForApp = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schema = z.object({ appId: z.string().min(1) });
  const { appId } = schema.parse(req.body);
  const result = await identityBridgeService.verifyIdentityForApp(req.user!.userId, appId);
  if (!result.allowed) throw new AppError(403, result.reason ?? 'Identity verification failed');
  res.json({ success: true, data: result });
});

export const linkSession = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    appId: z.string().min(1),
    sessionId: z.string().optional(),
    deviceId: z.string().optional(),
    deviceName: z.string().optional(),
  });
  const data = schema.parse(req.body);
  await identityBridgeService.linkAppSession({
    userId: req.user!.userId,
    sessionId: data.sessionId ?? req.user!.sessionId ?? req.user!.userId,
    appId: data.appId,
    deviceId: data.deviceId ?? (req.headers['x-device-id'] as string | undefined),
    deviceName: data.deviceName,
    ipAddress: req.ip,
  });
  res.json({ success: true, message: 'Session linked' });
});

export const getSessions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const sessions = await identityBridgeService.getActiveAppSessions(req.user!.userId);
  res.json({ success: true, data: sessions });
});

export const crossAppLookup = asyncHandler(async (req: AuthRequest, res: Response) => {
  const appId = String(req.query.appId ?? req.headers['x-app-id'] ?? '');
  const permission = String(req.query.permission ?? 'read_identity');
  if (!appId) throw new AppError(400, 'appId required');

  const context = await identityBridgeService.crossAppIdentityLookup(
    req.user!.userId,
    String(req.params.targetUserId),
    appId,
    permission
  );
  if (!context) throw new AppError(403, 'Cross-app identity access denied');
  res.json({ success: true, data: context });
});

export const checkPermission = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schema = z.object({ appId: z.string(), permission: z.string() });
  const { appId, permission } = schema.parse(req.body);
  const result = await permissionEngineService.hasPermission(
    appId,
    req.user!.userId,
    permission,
    req.user!.role
  );
  res.json({ success: true, data: result });
});

export const listPermissions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const appId = String(req.query.appId ?? '');
  if (!appId) throw new AppError(400, 'appId required');
  const permissions = await permissionEngineService.listPermissions(appId, req.user!.userId);
  res.json({ success: true, data: permissions });
});

export const grantPermissions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    appId: z.string(),
    userId: z.string(),
    permissions: z.array(z.string()).min(1),
  });
  const data = schema.parse(req.body);
  await permissionEngineService.grantPermissions(data.appId, data.userId, data.permissions, req.user!.userId);
  res.json({ success: true, message: 'Permissions granted' });
});

export const pushAuditLog = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    appId: z.string(),
    userId: z.string().optional(),
    action: z.string(),
    entityType: z.string(),
    entityId: z.string().optional(),
    permission: z.string().optional(),
    query: z.string().optional(),
    oldValue: z.string().optional(),
    newValue: z.string().optional(),
    reason: z.string().optional(),
    details: z.string().optional(),
    amount: z.number().optional(),
    metadata: z.record(z.unknown()).optional(),
  });
  const data = schema.parse(req.body);

  await auditService.log({
    appId: data.appId,
    userId: data.userId ?? req.user!.userId,
    action: data.action,
    entityType: data.entityType,
    entityId: data.entityId,
    ctx: {
      performedBy: req.user!.userId,
      performedByRole: req.user!.role,
      permission: data.permission,
      ipAddress: req.ip,
      deviceId: req.headers['x-device-id'] as string | undefined,
      reason: data.reason,
    },
    query: data.query,
    oldValue: data.oldValue,
    newValue: data.newValue,
    details: data.details,
    amount: data.amount,
    metadata: data.metadata,
  });

  res.status(201).json({ success: true, message: 'Audit log recorded' });
});

export const queryAuditLogs = asyncHandler(async (req: AuthRequest, res: Response) => {
  const appId = req.query.appId ? String(req.query.appId) : undefined;
  const page = Number(req.query.page ?? 0);
  const limit = Number(req.query.limit ?? 50);
  const result = await auditService.queryLogs({ appId, page, limit });
  res.json({ success: true, data: result });
});

export const auditStats = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const stats = await auditService.getStats();
  res.json({ success: true, data: stats });
});

export const sendNotification = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    appId: z.string(),
    userId: z.string().optional(),
    title: z.string().min(1),
    body: z.string().min(1),
    icon: z.string().optional(),
    priority: z.enum(['low', 'normal', 'high', 'critical']).optional(),
  });
  const data = schema.parse(req.body);
  const result = await notificationService.send({
    userId: data.userId ?? req.user!.userId,
    appId: data.appId,
    title: data.title,
    body: data.body,
    icon: data.icon,
    priority: data.priority,
  });
  res.status(201).json({ success: true, data: result });
});

export const platformHealth = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const [auditStats, connectedUsers] = await Promise.all([
    auditService.getStats(),
    Promise.resolve(eventBusService.getConnectedUsers()),
  ]);
  res.json({
    success: true,
    data: {
      status: 'healthy',
      service: 'bananaos-core-platform',
      connectedUsers,
      auditLogCount: auditStats.total,
      apps: Object.values(BANANAOS_APP_IDS),
    },
  });
});
