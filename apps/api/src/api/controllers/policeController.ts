import { Response } from 'express';
import { Types } from 'mongoose';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { PolicePermission } from '../../database/models/PolicePermission';
import { PoliceOfficer } from '../../database/models/PoliceOfficer';
import { Identity } from '../../database/models/Identity';
import { User } from '../../database/models/User';
import {
  hasPermission,
  provisionOfficer,
  getDashboard,
  getOfficerByUserId,
  mdtSearchPersons,
  mdtSearchVehicles,
  mdtSearchProperties,
  mdtCaseLookup,
  getAuditLogs,
  createReport,
  listReports,
  reviewReport,
  addPoints,
  promoteOfficer,
  getRankHistory,
  listOfficers,
  updateOfficerStatus,
  createDispatch,
  listDispatches,
  assignDispatch,
  updateDispatchStatus,
  createCase,
  listCases,
  assignCase,
  getCaseEvidence,
  addEvidence,
  registerVehicle,
  searchVehicles,
  sendChatMessage,
  getChatMessages,
  seedDepartmentData,
  formatOfficer,
  AuditContext,
} from '../../services/policeService';
import type { PolicePermissionName, PoliceRank } from '../../database/models/PolicePermission';

function auditCtx(req: AuthRequest, permission: PolicePermissionName, reason?: string): AuditContext {
  return {
    performedBy: req.user!.userId,
    performedByRole: req.user!.role,
    permission,
    ipAddress: req.ip,
    deviceId: req.headers['x-device-id'] as string | undefined,
    reason,
  };
}

async function checkPerm(req: AuthRequest, permission: PolicePermissionName): Promise<void> {
  const allowed = await hasPermission(req.user!.userId, permission, req.user!.role);
  if (!allowed) throw new AppError(403, `Permission denied: ${permission}`);
}

async function requireOfficer(req: AuthRequest) {
  const officer = await getOfficerByUserId(req.user!.userId);
  if (!officer) throw new AppError(404, 'Officer profile not provisioned');
  return officer;
}

export const getPermissions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const perms = await PolicePermission.find({ userId: req.user!.userId, granted: true });
  res.json({ success: true, data: perms.map((p) => p.permission) });
});

export const provision = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    firstName: z.string().min(1).max(100).optional(),
    lastName: z.string().min(1).max(100).optional(),
    rank: z.enum(['cadet', 'officer', 'sergeant', 'lieutenant', 'captain', 'chief']).optional(),
  });
  const data = schema.parse(req.body);

  const [identity, user] = await Promise.all([
    Identity.findOne({ userId: req.user!.userId }),
    User.findById(req.user!.userId),
  ]);

  const nameParts = identity?.fullName?.split(' ') ?? [];
  const firstName = data.firstName ?? nameParts[0] ?? user?.username?.split(' ')[0] ?? 'Officer';
  const lastName = data.lastName ?? (nameParts.slice(1).join(' ') || user?.username?.split(' ').slice(1).join(' ') || 'Banana');

  try {
    const officer = await provisionOfficer(
      req.user!.userId,
      { firstName, lastName, rank: data.rank },
      auditCtx(req, 'view_dashboard')
    );
    await seedDepartmentData(req.user!.userId, auditCtx(req, 'view_dashboard'));
    res.status(201).json({ success: true, data: formatOfficer(officer) });
  } catch (err) {
    throw new AppError(400, err instanceof Error ? err.message : 'Provisioning failed');
  }
});

export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const officer = await getOfficerByUserId(req.user!.userId);
  if (!officer) {
    res.json({ success: true, data: null });
    return;
  }
  res.json({ success: true, data: formatOfficer(officer) });
});

export const getDashboardData = asyncHandler(async (req: AuthRequest, res: Response) => {
  await checkPerm(req, 'view_dashboard');
  const dashboard = await getDashboard(req.user!.userId);
  res.json({ success: true, data: dashboard });
});

export const mdtPersons = asyncHandler(async (req: AuthRequest, res: Response) => {
  const q = String(req.query.q ?? '');
  if (!q.trim()) throw new AppError(400, 'Query required');
  try {
    const results = await mdtSearchPersons(q, req.user!.userId, auditCtx(req, 'access_mdt'));
    res.json({ success: true, data: results });
  } catch (err) {
    throw new AppError(403, err instanceof Error ? err.message : 'MDT search failed');
  }
});

export const mdtVehicles = asyncHandler(async (req: AuthRequest, res: Response) => {
  const q = String(req.query.q ?? '');
  if (!q.trim()) throw new AppError(400, 'Query required');
  try {
    const results = await mdtSearchVehicles(q, req.user!.userId, auditCtx(req, 'access_mdt'));
    res.json({ success: true, data: results });
  } catch (err) {
    throw new AppError(403, err instanceof Error ? err.message : 'MDT search failed');
  }
});

export const mdtProperties = asyncHandler(async (req: AuthRequest, res: Response) => {
  const q = String(req.query.q ?? '');
  if (!q.trim()) throw new AppError(400, 'Query required');
  try {
    const results = await mdtSearchProperties(q, req.user!.userId, auditCtx(req, 'access_mdt'));
    res.json({ success: true, data: results });
  } catch (err) {
    throw new AppError(403, err instanceof Error ? err.message : 'MDT search failed');
  }
});

export const mdtCases = asyncHandler(async (req: AuthRequest, res: Response) => {
  const q = String(req.query.q ?? '');
  if (!q.trim()) throw new AppError(400, 'Query required');
  try {
    const results = await mdtCaseLookup(q, req.user!.userId, auditCtx(req, 'access_mdt'));
    res.json({ success: true, data: results });
  } catch (err) {
    throw new AppError(403, err instanceof Error ? err.message : 'MDT search failed');
  }
});

export const auditLogs = asyncHandler(async (req: AuthRequest, res: Response) => {
  await checkPerm(req, 'view_audit_logs');
  const limit = Math.min(Number(req.query.limit ?? 50), 100);
  const logs = await getAuditLogs(req.user!.userId, limit);
  res.json({ success: true, data: logs });
});

const reportSchema = z.object({
  type: z.enum(['incident', 'arrest', 'traffic', 'investigation', 'other']).optional(),
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  location: z.string().min(1),
  involvedParties: z.array(z.string()).optional(),
  caseId: z.string().optional(),
});

export const createReportHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = reportSchema.parse(req.body);
  const officer = await requireOfficer(req);
  try {
    const report = await createReport(req.user!.userId, officer._id.toString(), {
      ...data,
      caseId: data.caseId ? new Types.ObjectId(data.caseId) : undefined,
    }, auditCtx(req, 'create_report'));
    res.status(201).json({
      success: true,
      data: {
        id: report._id.toString(),
        reportNumber: report.reportNumber,
        title: report.title,
        status: report.status,
      },
    });
  } catch (err) {
    throw new AppError(400, err instanceof Error ? err.message : 'Create report failed');
  }
});

export const listReportsHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  await checkPerm(req, 'view_reports');
  const page = Number(req.query.page ?? 0);
  const limit = Math.min(Number(req.query.limit ?? 20), 50);
  const reports = await listReports(req.user!.userId, page, limit);
  res.json({ success: true, data: reports });
});

export const reviewReportHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schema = z.object({ approve: z.boolean(), note: z.string().optional() });
  const { approve, note } = schema.parse(req.body);
  try {
    const report = await reviewReport(req.user!.userId, String(req.params.id), approve, note, auditCtx(req, 'approve_report'));
    res.json({ success: true, data: { id: report._id.toString(), status: report.status } });
  } catch (err) {
    throw new AppError(400, err instanceof Error ? err.message : 'Review failed');
  }
});

export const addPointsHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schema = z.object({ points: z.number().int(), reason: z.string().min(1) });
  const { points, reason } = schema.parse(req.body);
  try {
    const officer = await addPoints(req.user!.userId, String(req.params.id), points, reason, auditCtx(req, 'manage_rankings'));
    res.json({ success: true, data: formatOfficer(officer) });
  } catch (err) {
    throw new AppError(400, err instanceof Error ? err.message : 'Add points failed');
  }
});

export const promoteHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    rank: z.enum(['cadet', 'officer', 'sergeant', 'lieutenant', 'captain', 'chief']),
    reason: z.string().min(1),
  });
  const { rank, reason } = schema.parse(req.body);
  try {
    const officer = await promoteOfficer(req.user!.userId, String(req.params.id), rank as PoliceRank, reason, auditCtx(req, 'manage_rankings'));
    res.json({ success: true, data: formatOfficer(officer) });
  } catch (err) {
    throw new AppError(400, err instanceof Error ? err.message : 'Promotion failed');
  }
});

export const rankHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const limit = Math.min(Number(req.query.limit ?? 20), 50);
  const history = await getRankHistory(String(req.params.id), limit);
  res.json({ success: true, data: history });
});

export const listOfficersHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  await checkPerm(req, 'view_officers');
  const page = Number(req.query.page ?? 0);
  const limit = Math.min(Number(req.query.limit ?? 20), 50);
  const officers = await listOfficers(page, limit);
  res.json({ success: true, data: officers });
});

export const updateStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    status: z.enum(['on_duty', 'off_duty', 'break', 'en_route', 'on_scene']),
  });
  const { status } = schema.parse(req.body);
  const officer = await requireOfficer(req);
  const targetId = req.params.id === 'me' ? officer._id.toString() : String(req.params.id);
  try {
    const updated = await updateOfficerStatus(req.user!.userId, targetId, status, auditCtx(req, 'view_officers'));
    res.json({ success: true, data: formatOfficer(updated) });
  } catch (err) {
    throw new AppError(400, err instanceof Error ? err.message : 'Status update failed');
  }
});

const dispatchSchema = z.object({
  priority: z.number().int().min(1).max(3).optional(),
  type: z.string().min(1),
  description: z.string().min(1),
  location: z.string().min(1),
  assignedOfficerIds: z.array(z.string()).optional(),
  assignedUnit: z.string().optional(),
});

export const createDispatchHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = dispatchSchema.parse(req.body);
  try {
    const dispatch = await createDispatch(req.user!.userId, {
      priority: (data.priority ?? 2) as 1 | 2 | 3,
      type: data.type,
      description: data.description,
      location: { address: data.location },
      assignedOfficerIds: data.assignedOfficerIds?.map((id) => new Types.ObjectId(id)),
      assignedUnit: data.assignedUnit,
    }, auditCtx(req, 'manage_dispatch'));
    res.status(201).json({
      success: true,
      data: {
        id: dispatch._id.toString(),
        dispatchNumber: dispatch.dispatchNumber,
        status: dispatch.status,
      },
    });
  } catch (err) {
    throw new AppError(400, err instanceof Error ? err.message : 'Create dispatch failed');
  }
});

export const listDispatchesHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  await checkPerm(req, 'view_dispatch');
  const page = Number(req.query.page ?? 0);
  const limit = Math.min(Number(req.query.limit ?? 20), 50);
  const status = req.query.status ? String(req.query.status) : undefined;
  const dispatches = await listDispatches(status, page, limit);
  res.json({ success: true, data: dispatches });
});

export const assignDispatchHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schema = z.object({ officerIds: z.array(z.string()).min(1) });
  const { officerIds } = schema.parse(req.body);
  try {
    const dispatch = await assignDispatch(req.user!.userId, String(req.params.id), officerIds, auditCtx(req, 'manage_dispatch'));
    res.json({ success: true, data: { id: dispatch._id.toString(), status: dispatch.status } });
  } catch (err) {
    throw new AppError(400, err instanceof Error ? err.message : 'Assign failed');
  }
});

export const updateDispatchHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    status: z.enum(['pending', 'assigned', 'en_route', 'on_scene', 'resolved', 'cancelled']),
  });
  const { status } = schema.parse(req.body);
  try {
    const dispatch = await updateDispatchStatus(req.user!.userId, String(req.params.id), status, auditCtx(req, 'view_dispatch'));
    res.json({ success: true, data: { id: dispatch._id.toString(), status: dispatch.status } });
  } catch (err) {
    throw new AppError(400, err instanceof Error ? err.message : 'Update failed');
  }
});

const caseSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  priority: z.number().int().min(1).max(3).optional(),
  involvedParties: z.array(z.string()).optional(),
  location: z.string().optional(),
});

export const createCaseHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = caseSchema.parse(req.body);
  try {
    const policeCase = await createCase(req.user!.userId, {
      ...data,
      priority: (data.priority ?? 2) as 1 | 2 | 3,
    }, auditCtx(req, 'manage_cases'));
    res.status(201).json({
      success: true,
      data: { id: policeCase._id.toString(), caseNumber: policeCase.caseNumber, status: policeCase.status },
    });
  } catch (err) {
    throw new AppError(400, err instanceof Error ? err.message : 'Create case failed');
  }
});

export const listCasesHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  await checkPerm(req, 'view_cases');
  const page = Number(req.query.page ?? 0);
  const limit = Math.min(Number(req.query.limit ?? 20), 50);
  const status = req.query.status ? String(req.query.status) : undefined;
  const cases = await listCases(page, limit, status);
  res.json({ success: true, data: cases });
});

export const assignCaseHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    officerIds: z.array(z.string()).min(1),
    leadOfficerId: z.string().optional(),
  });
  const { officerIds, leadOfficerId } = schema.parse(req.body);
  try {
    const policeCase = await assignCase(req.user!.userId, String(req.params.id), officerIds, leadOfficerId, auditCtx(req, 'manage_cases'));
    res.json({ success: true, data: { id: policeCase._id.toString(), status: policeCase.status } });
  } catch (err) {
    throw new AppError(400, err instanceof Error ? err.message : 'Assign case failed');
  }
});

export const caseEvidence = asyncHandler(async (req: AuthRequest, res: Response) => {
  await checkPerm(req, 'view_cases');
  const evidence = await getCaseEvidence(String(req.params.id));
  res.json({ success: true, data: evidence });
});

const evidenceSchema = z.object({
  caseId: z.string().optional(),
  reportId: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['photo', 'video', 'document', 'audio', 'other']).optional(),
  fileUrl: z.string().optional(),
});

export const addEvidenceHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = evidenceSchema.parse(req.body);
  const officer = await requireOfficer(req);
  try {
    const evidence = await addEvidence(req.user!.userId, {
      ...data,
      caseId: data.caseId ? new Types.ObjectId(data.caseId) : undefined,
      reportId: data.reportId ? new Types.ObjectId(data.reportId) : undefined,
    }, officer._id.toString(), auditCtx(req, 'manage_evidence'));
    res.status(201).json({
      success: true,
      data: { id: evidence._id.toString(), title: evidence.title },
    });
  } catch (err) {
    throw new AppError(400, err instanceof Error ? err.message : 'Add evidence failed');
  }
});

const vehicleSchema = z.object({
  plateNumber: z.string().min(2).max(12),
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().min(1900).max(2100),
  color: z.string().min(1),
  ownerName: z.string().min(1),
  ownerIdentityNumber: z.string().optional(),
  ownerPhone: z.string().optional(),
});

export const registerVehicleHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = vehicleSchema.parse(req.body);
  try {
    const vehicle = await registerVehicle(req.user!.userId, {
      plateNumber: data.plateNumber,
      make: data.make,
      vehicleModel: data.model,
      year: data.year,
      color: data.color,
      ownerName: data.ownerName,
      ownerIdentityNumber: data.ownerIdentityNumber,
      ownerPhone: data.ownerPhone,
    }, auditCtx(req, 'manage_vehicles'));
    res.status(201).json({
      success: true,
      data: { id: vehicle._id.toString(), plateNumber: vehicle.plateNumber },
    });
  } catch (err) {
    throw new AppError(400, err instanceof Error ? err.message : 'Register vehicle failed');
  }
});

export const searchVehiclesHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  await checkPerm(req, 'view_vehicles');
  const q = String(req.query.q ?? '');
  const page = Number(req.query.page ?? 0);
  const limit = Math.min(Number(req.query.limit ?? 20), 50);
  const vehicles = q.trim() ? await searchVehicles(q, page, limit) : [];
  res.json({ success: true, data: vehicles });
});

export const sendChat = asyncHandler(async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    channel: z.string().min(1),
    message: z.string().min(1).max(2000),
  });
  const { channel, message } = schema.parse(req.body);
  const officer = await requireOfficer(req);
  try {
    const msg = await sendChatMessage(req.user!.userId, officer._id.toString(), channel, message, auditCtx(req, 'internal_chat'));
    res.status(201).json({
      success: true,
      data: {
        id: msg._id.toString(),
        channel: msg.channel,
        message: msg.message,
        createdAt: msg.createdAt.toISOString(),
      },
    });
  } catch (err) {
    throw new AppError(400, err instanceof Error ? err.message : 'Send message failed');
  }
});

export const getChat = asyncHandler(async (req: AuthRequest, res: Response) => {
  await checkPerm(req, 'internal_chat');
  const channel = String(req.query.channel ?? 'general');
  const page = Number(req.query.page ?? 0);
  const limit = Math.min(Number(req.query.limit ?? 50), 100);
  const messages = await getChatMessages(channel, page, limit);
  res.json({ success: true, data: messages });
});
