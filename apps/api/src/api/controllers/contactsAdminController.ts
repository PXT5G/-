import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { ContactAuditLog } from '../../database/models/ContactAuditLog';
import { ContactPermission, ADMIN_CONTACT_PERMISSIONS } from '../../database/models/ContactPermission';
import {
  getAdminStats,
  grantAdminPermissions,
  logContactAudit,
  AuditContext,
} from '../../services/contactsService';
import type { ContactPermissionName } from '../../database/models/ContactPermission';

function adminCtx(req: AuthRequest, permission: ContactPermissionName, reason?: string): AuditContext {
  return {
    performedBy: req.user!.userId,
    performedByRole: 'admin',
    permission,
    ipAddress: req.ip,
    reason,
  };
}

export const adminStats = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const stats = await getAdminStats();
  res.json({ success: true, data: stats });
});

export const adminAuditLogs = asyncHandler(async (req: AuthRequest, res: Response) => {
  const limit = Math.min(Number(req.query.limit ?? 100), 200);
  const logs = await ContactAuditLog.find().sort({ createdAt: -1 }).limit(limit);
  res.json({
    success: true,
    data: logs.map((l) => ({
      id: l._id.toString(),
      userId: l.userId.toString(),
      action: l.action,
      entityType: l.entityType,
      permission: l.permission,
      oldValue: l.oldValue,
      newValue: l.newValue,
      reason: l.reason,
      ipAddress: l.ipAddress,
      deviceId: l.deviceId,
      performedByRole: l.performedByRole,
      createdAt: l.createdAt.toISOString(),
    })),
  });
});

export const adminGrantPermissions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schema = z.object({ userId: z.string(), permissions: z.array(z.string()).optional() });
  const data = schema.parse(req.body);
  const perms = (data.permissions ?? ADMIN_CONTACT_PERMISSIONS) as ContactPermissionName[];
  for (const permission of perms) {
    await ContactPermission.findOneAndUpdate(
      { userId: data.userId, permission },
      { granted: true, grantedBy: req.user!.userId, grantedAt: new Date() },
      { upsert: true }
    );
  }
  await logContactAudit(data.userId, 'permissions_granted', 'ContactPermission', adminCtx(req, 'view_audit_logs'));
  res.json({ success: true, message: 'Permissions granted' });
});

export const adminInitSelf = asyncHandler(async (req: AuthRequest, res: Response) => {
  await grantAdminPermissions(req.user!.userId);
  res.json({ success: true, data: ADMIN_CONTACT_PERMISSIONS });
});
