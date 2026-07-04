import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { PoliceAuditLog } from '../../database/models/PoliceAuditLog';
import { PolicePermission, ADMIN_POLICE_PERMISSIONS } from '../../database/models/PolicePermission';
import { getAdminStats, grantRankPermissions, logPoliceAudit, AuditContext } from '../../services/policeService';
import type { PolicePermissionName, PoliceRank } from '../../database/models/PolicePermission';

function adminCtx(req: AuthRequest, permission: PolicePermissionName, reason?: string): AuditContext {
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
  const logs = await PoliceAuditLog.find().sort({ createdAt: -1 }).limit(limit);
  res.json({
    success: true,
    data: logs.map((l) => ({
      id: l._id.toString(),
      userId: l.userId.toString(),
      action: l.action,
      entityType: l.entityType,
      query: l.query,
      permission: l.permission,
      oldValue: l.oldValue,
      newValue: l.newValue,
      reason: l.reason,
      ipAddress: l.ipAddress,
      performedByRole: l.performedByRole,
      createdAt: l.createdAt.toISOString(),
    })),
  });
});

export const adminGrantPermissions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    userId: z.string(),
    rank: z.enum(['cadet', 'officer', 'sergeant', 'lieutenant', 'captain', 'chief']).optional(),
    permissions: z.array(z.string()).optional(),
  });
  const data = schema.parse(req.body);

  if (data.rank) {
    await grantRankPermissions(data.userId, data.rank as PoliceRank, req.user!.userId);
  } else {
    const perms = (data.permissions ?? ADMIN_POLICE_PERMISSIONS) as PolicePermissionName[];
    for (const permission of perms) {
      await PolicePermission.findOneAndUpdate(
        { userId: data.userId, permission },
        { granted: true, grantedBy: req.user!.userId, grantedAt: new Date() },
        { upsert: true }
      );
    }
  }

  await logPoliceAudit(data.userId, 'permissions_granted', 'PolicePermission', adminCtx(req, 'view_audit_logs'));
  res.json({ success: true, message: 'Permissions granted' });
});

export const adminInitSelf = asyncHandler(async (req: AuthRequest, res: Response) => {
  for (const permission of ADMIN_POLICE_PERMISSIONS) {
    await PolicePermission.findOneAndUpdate(
      { userId: req.user!.userId, permission },
      { granted: true, grantedBy: req.user!.userId, grantedAt: new Date() },
      { upsert: true }
    );
  }
  res.json({ success: true, data: ADMIN_POLICE_PERMISSIONS });
});
