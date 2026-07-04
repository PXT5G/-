import { Response } from 'express';
import { z } from 'zod';
import { Types } from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { SIMProfile } from '../../database/models/SIMProfile';
import { PhoneNumber } from '../../database/models/PhoneNumber';
import { Carrier } from '../../database/models/Carrier';
import { SIMAuditLog } from '../../database/models/SIMAuditLog';
import { SIMPermission, ADMIN_PERMISSIONS } from '../../database/models/SIMPermission';
import {
  suspendSIM,
  activateSIM,
  generateUniqueNumber,
  getAdminStats,
  grantAdminPermissions,
  logSimAudit,
  formatPhoneNumber,
  formatSIMProfile,
  AuditContext,
} from '../../services/simService';
import type { SIMPermissionName } from '../../database/models/SIMPermission';

function adminCtx(req: AuthRequest, permission: SIMPermissionName, reason?: string): AuditContext {
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

export const adminSearchSims = asyncHandler(async (req: AuthRequest, res: Response) => {
  const q = String(req.query.q ?? '').trim();
  const status = req.query.status as string | undefined;
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;

  let sims = await SIMProfile.find(filter).sort({ createdAt: -1 }).limit(50);

  if (q.length >= 2) {
    const numbers = await PhoneNumber.find({ number: new RegExp(q, 'i') });
    const ids = numbers.map((n) => n.simProfileId).filter(Boolean);
    sims = await SIMProfile.find({ ...filter, $or: [{ _id: { $in: ids } }, { simSerial: new RegExp(q, 'i') }] }).limit(50);
  }

  const result = await Promise.all(
    sims.map(async (sim) => {
      const [phoneNumber, carrier] = await Promise.all([
        PhoneNumber.findById(sim.phoneNumberId),
        Carrier.findById(sim.carrierId),
      ]);
      return formatSIMProfile(sim, phoneNumber ?? undefined, carrier ? { name: carrier.name, code: carrier.code } : undefined);
    })
  );
  res.json({ success: true, data: result });
});

export const adminSuspend = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schema = z.object({ reason: z.string().optional() });
  const { reason } = schema.parse(req.body);
  const sim = await SIMProfile.findById(String(req.params.id));
  if (!sim) throw new AppError(404, 'SIM not found');
  try {
    const updated = await suspendSIM(sim.userId.toString(), sim._id.toString(), adminCtx(req, 'suspend', reason));
    res.json({ success: true, data: { id: updated._id.toString(), status: updated.status } });
  } catch (err) {
    throw new AppError(400, err instanceof Error ? err.message : 'Suspend failed');
  }
});

export const adminActivate = asyncHandler(async (req: AuthRequest, res: Response) => {
  const sim = await SIMProfile.findById(String(req.params.id));
  if (!sim) throw new AppError(404, 'SIM not found');
  try {
    const updated = await activateSIM(sim.userId.toString(), sim._id.toString(), adminCtx(req, 'activate'));
    res.json({ success: true, data: { id: updated._id.toString(), status: updated.status } });
  } catch (err) {
    throw new AppError(400, err instanceof Error ? err.message : 'Activate failed');
  }
});

export const adminGenerateNumber = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schema = z.object({ premium: z.boolean().optional(), assignToUserId: z.string().optional() });
  const data = schema.parse(req.body);
  const number = await generateUniqueNumber(data.premium ?? false);
  if (data.assignToUserId) {
    number.userId = new Types.ObjectId(data.assignToUserId);
    number.status = 'assigned';
    number.assignedAt = new Date();
    await number.save();
  }
  await logSimAudit(data.assignToUserId ?? req.user!.userId, 'admin_number_generated', 'PhoneNumber', adminCtx(req, 'generate_numbers'), number._id.toString(), undefined, number.number);
  res.status(201).json({ success: true, data: formatPhoneNumber(number) });
});

export const adminAuditLogs = asyncHandler(async (req: AuthRequest, res: Response) => {
  const limit = Math.min(Number(req.query.limit ?? 100), 200);
  const logs = await SIMAuditLog.find().sort({ createdAt: -1 }).limit(limit);
  res.json({
    success: true,
    data: logs.map((l) => ({
      id: l._id.toString(),
      userId: l.userId.toString(),
      action: l.action,
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

export const adminManageCarriers = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (req.method === 'GET' || !req.body) {
    const carriers = await Carrier.find();
    res.json({ success: true, data: carriers });
    return;
  }
  const schema = z.object({
    name: z.string(),
    code: z.string(),
    supports5G: z.boolean().optional(),
    supportsWifiCalling: z.boolean().optional(),
    supportsRoaming: z.boolean().optional(),
  });
  const data = schema.parse(req.body);
  const carrier = await Carrier.findOneAndUpdate({ code: data.code }, data, { upsert: true, new: true });
  await logSimAudit(req.user!.userId, 'carrier_managed', 'Carrier', adminCtx(req, 'manage_carriers'), carrier!._id.toString());
  res.json({ success: true, data: carrier });
});

export const adminGrantPermissions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schema = z.object({ userId: z.string(), permissions: z.array(z.string()).optional() });
  const data = schema.parse(req.body);
  const perms = (data.permissions ?? ADMIN_PERMISSIONS) as SIMPermissionName[];
  for (const permission of perms) {
    await SIMPermission.findOneAndUpdate(
      { userId: data.userId, permission },
      { granted: true, grantedBy: req.user!.userId, grantedAt: new Date() },
      { upsert: true }
    );
  }
  res.json({ success: true, message: 'Permissions granted' });
});

export const adminInitSelf = asyncHandler(async (req: AuthRequest, res: Response) => {
  await grantAdminPermissions(req.user!.userId);
  res.json({ success: true, data: ADMIN_PERMISSIONS });
});
