import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { controlPanelService } from '../../platform';

async function logView(req: AuthRequest, section: string): Promise<void> {
  const { auditService } = await import('../../platform');
  await auditService.log({
    appId: controlPanelService.CONTROL_PANEL_APP_ID,
    userId: req.user!.userId,
    action: `control_view_${section}`,
    entityType: 'ControlPanel',
    ctx: { performedBy: req.user!.userId, performedByRole: 'admin', permission: 'control_panel' },
  });
}

export const dashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  await logView(req, 'dashboard');
  const data = await controlPanelService.getSystemDashboard();
  res.json({ success: true, data });
});

export const permissions = asyncHandler(async (req: AuthRequest, res: Response) => {
  await logView(req, 'permissions');
  const page = Number(req.query.page ?? 0);
  const limit = Number(req.query.limit ?? 50);
  const data = await controlPanelService.getPermissionsManager({
    appId: req.query.appId ? String(req.query.appId) : undefined,
    userId: req.query.userId ? String(req.query.userId) : undefined,
    page,
    limit,
  });
  res.json({ success: true, data });
});

export const syncPermissions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schema = z.object({ appId: z.string().min(1) });
  const { appId } = schema.parse(req.body);
  const data = await controlPanelService.syncAppPermissions(req.user!.userId, appId);
  res.json({ success: true, data });
});

export const grantPermissions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    appId: z.string(),
    userId: z.string(),
    permissions: z.array(z.string()).min(1),
    override: z.boolean().optional(),
    reason: z.string().optional(),
  });
  const data = schema.parse(req.body);
  await controlPanelService.grantPermissionsAdmin(
    req.user!.userId,
    data.appId,
    data.userId,
    data.permissions,
    data.override,
    data.reason
  );
  res.json({ success: true, message: 'Permissions updated' });
});

export const revokePermission = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schema = z.object({ appId: z.string(), userId: z.string(), permission: z.string() });
  const data = schema.parse(req.body);
  await controlPanelService.revokePermissionAdmin(req.user!.userId, data.appId, data.userId, data.permission);
  res.json({ success: true, message: 'Permission revoked' });
});

export const auditLogs = asyncHandler(async (req: AuthRequest, res: Response) => {
  await logView(req, 'audit');
  const data = await controlPanelService.searchAuditLogs({
    appId: req.query.appId ? String(req.query.appId) : undefined,
    userId: req.query.userId ? String(req.query.userId) : undefined,
    action: req.query.action ? String(req.query.action) : undefined,
    search: req.query.search ? String(req.query.search) : undefined,
    page: Number(req.query.page ?? 0),
    limit: Number(req.query.limit ?? 50),
  });
  res.json({ success: true, data });
});

export const exportAudit = asyncHandler(async (req: AuthRequest, res: Response) => {
  const logs = await controlPanelService.exportAuditLogs(req.user!.userId, {
    appId: req.query.appId ? String(req.query.appId) : undefined,
    userId: req.query.userId ? String(req.query.userId) : undefined,
    action: req.query.action ? String(req.query.action) : undefined,
    search: req.query.search ? String(req.query.search) : undefined,
    limit: Number(req.query.limit ?? 1000),
  });

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="bananaos-audit-${Date.now()}.json"`);
  res.json({ success: true, exportedAt: new Date().toISOString(), count: logs.length, data: logs });
});

export const realtime = asyncHandler(async (req: AuthRequest, res: Response) => {
  await logView(req, 'realtime');
  const limit = Math.min(Number(req.query.limit ?? 100), 500);
  const data = await controlPanelService.getRealtimeMonitor(limit);
  res.json({ success: true, data });
});

export const sessions = asyncHandler(async (req: AuthRequest, res: Response) => {
  await logView(req, 'sessions');
  const data = await controlPanelService.getSessionManager({
    page: Number(req.query.page ?? 0),
    limit: Number(req.query.limit ?? 50),
    userId: req.query.userId ? String(req.query.userId) : undefined,
  });
  res.json({ success: true, data });
});

export const forceLogoutSession = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schema = z.object({ userId: z.string(), sessionId: z.string(), reason: z.string().optional() });
  const data = schema.parse(req.body);
  await controlPanelService.forceLogoutSessionAdmin(req.user!.userId, data.userId, data.sessionId, data.reason);
  res.json({ success: true, message: 'Session revoked' });
});

export const forceLogoutUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schema = z.object({ userId: z.string(), reason: z.string().optional() });
  const data = schema.parse(req.body);
  await controlPanelService.forceLogoutUserAdmin(req.user!.userId, data.userId, data.reason);
  res.json({ success: true, message: 'User logged out from all sessions' });
});

export const health = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const data = await controlPanelService.getSystemDashboard();
  res.json({
    success: true,
    data: {
      status: data.systemHealth.status,
      uptime: data.systemHealth.uptime,
      connectedSockets: data.connectedSockets,
    },
  });
});
