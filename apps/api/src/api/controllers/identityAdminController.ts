import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { Identity } from '../../database/models/Identity';
import { IdentityHistory } from '../../database/models/IdentityHistory';
import {
  approveIdentity,
  rejectIdentity,
  suspendIdentity,
  reactivateIdentity,
  formatIdentity,
  getIdentityStats,
} from '../../services/identityService';

export const getVerificationQueue = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const pending = await Identity.find({ status: 'pending' })
    .sort({ createdAt: 1 })
    .limit(50);

  res.json({
    success: true,
    data: pending.map((i) => formatIdentity(i)),
  });
});

export const adminSearch = asyncHandler(async (req: AuthRequest, res: Response) => {
  const q = String(req.query.q ?? '').trim();
  const status = req.query.status as string | undefined;

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (q.length >= 2) {
    const regex = new RegExp(q, 'i');
    filter.$or = [
      { fullName: regex },
      { username: regex },
      { nationalId: regex },
      { membershipNumber: regex },
    ];
  }

  const identities = await Identity.find(filter).sort({ createdAt: -1 }).limit(50);
  res.json({
    success: true,
    data: identities.map((i) => formatIdentity(i)),
  });
});

export const adminApprove = asyncHandler(async (req: AuthRequest, res: Response) => {
  const identity = await approveIdentity(String(req.params.id), req.user!.userId);
  res.json({ success: true, data: formatIdentity(identity) });
});

export const adminReject = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schema = z.object({ reason: z.string().max(500).optional() });
  const { reason } = schema.parse(req.body);
  const identity = await rejectIdentity(String(req.params.id), req.user!.userId, reason);
  res.json({ success: true, data: formatIdentity(identity) });
});

export const adminSuspend = asyncHandler(async (req: AuthRequest, res: Response) => {
  const identity = await suspendIdentity(String(req.params.id), req.user!.userId);
  res.json({ success: true, data: formatIdentity(identity) });
});

export const adminReactivate = asyncHandler(async (req: AuthRequest, res: Response) => {
  const identity = await reactivateIdentity(String(req.params.id), req.user!.userId);
  res.json({ success: true, data: formatIdentity(identity) });
});

export const adminStats = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const stats = await getIdentityStats();
  res.json({ success: true, data: stats });
});

export const adminAuditLogs = asyncHandler(async (req: AuthRequest, res: Response) => {
  const limit = Math.min(Number(req.query.limit ?? 100), 200);
  const logs = await IdentityHistory.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('identityId', 'fullName nationalId');

  res.json({
    success: true,
    data: logs.map((l) => ({
      id: l._id.toString(),
      action: l.action,
      field: l.field,
      oldValue: l.oldValue,
      newValue: l.newValue,
      performedByRole: l.performedByRole,
      identity: l.identityId,
      createdAt: l.createdAt.toISOString(),
    })),
  });
});

export const adminGetIdentity = asyncHandler(async (req: AuthRequest, res: Response) => {
  const identity = await Identity.findById(String(req.params.id));
  if (!identity) throw new AppError(404, 'Identity not found');
  res.json({ success: true, data: formatIdentity(identity) });
});
