import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { getActorId } from '../../services/rbacService';
import {
  POLICE_ROLES,
  OFFICER_STATUSES,
  DISPATCH_STATUSES,
  REPORT_TYPES,
  CITATION_TYPES,
} from '../../constants/police';
import * as policeService from '../../services/policeService';

function mapError(err: unknown): never {
  if (!(err instanceof Error)) throw err;
  const map: Record<string, [number, string]> = {
    PERMISSION_DENIED: [403, 'Permission denied'],
    NOT_AN_OFFICER: [403, 'Not registered as police officer'],
    DISPATCH_NOT_FOUND: [404, 'Dispatch not found'],
    CASE_NOT_FOUND: [404, 'Case not found'],
    EVIDENCE_NOT_FOUND: [404, 'Evidence not found'],
    INMATE_NOT_FOUND: [404, 'Inmate not found'],
    SHIFT_NOT_FOUND: [404, 'Shift not found'],
    OFFICER_NOT_FOUND: [404, 'Officer not found'],
    APP_NOT_INSTALLED: [403, 'Police app not installed'],
    INVALID_SEARCH_TYPE: [400, 'Invalid search type'],
    TARGET_NOT_FOUND: [404, 'Target not found'],
    TARGET_REQUIRED: [400, 'Target required'],
  };
  const entry = map[err.message];
  if (entry) throw new AppError(entry[0], entry[1]);
  throw err;
}

function clientMeta(req: AuthRequest) {
  return {
    ipAddress: req.ip,
    deviceUuid: req.headers['x-device-uuid'] as string | undefined,
  };
}

export const initialize = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await policeService.initializePolice(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const dashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await policeService.getDashboard(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const officers = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await policeService.listOfficers(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const units = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await policeService.listUnits(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const updateStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    status: z.enum(OFFICER_STATUSES as unknown as [string, ...string[]]),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    district: z.string().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await policeService.updateOfficerStatus(
      req.user!.userId, body.status as never, getActorId(req), req.user!.role,
      { ...body, ...clientMeta(req) }
    );
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const dispatches = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const is911 = req.query.is911 === 'true';
    const status = req.query.status as string | undefined;
    const data = await policeService.listDispatches(req.user!.userId, req.user!.role, { is911, status });
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const createDispatch = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    callType: z.string(),
    priority: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    title: z.string().min(1),
    description: z.string().min(1),
    callerPhone: z.string().optional(),
    address: z.string().optional(),
    district: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    is911: z.boolean().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await policeService.createDispatch(getActorId(req), body, req.user!.role, clientMeta(req));
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const updateDispatch = asyncHandler(async (req: AuthRequest, res: Response) => {
  const dispatchId = String(req.params.id);
  const body = z.object({
    status: z.enum(DISPATCH_STATUSES as unknown as [string, ...string[]]).optional(),
    assignedUnitId: z.string().optional(),
    assignedBadges: z.array(z.string()).optional(),
    notes: z.string().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await policeService.updateDispatch(getActorId(req), dispatchId, body as never, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const bolos = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await policeService.listBolos(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const createBolo = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    type: z.enum(['person', 'vehicle', 'property']).optional(),
    title: z.string().min(1),
    description: z.string().min(1),
    subjectName: z.string().optional(),
    plateNumber: z.string().optional(),
    vehicleDescription: z.string().optional(),
    dangerLevel: z.enum(['low', 'medium', 'high', 'extreme']).optional(),
  }).parse(req.body ?? {});
  try {
    const data = await policeService.createBolo(getActorId(req), body, req.user!.role);
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const warrants = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await policeService.listWarrants(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const createWarrant = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    type: z.enum(['arrest', 'search', 'bench']).optional(),
    subjectName: z.string().min(1),
    subjectUserId: z.string().optional(),
    subjectPhone: z.string().optional(),
    charges: z.array(z.string()).optional(),
    description: z.string().min(1),
    expiresAt: z.string().datetime().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await policeService.createWarrant(getActorId(req), {
      ...body,
      subjectUserId: body.subjectUserId ? new (await import('mongoose')).Types.ObjectId(body.subjectUserId) : undefined,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
    }, req.user!.role);
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const wanted = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await policeService.listWanted(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const reports = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await policeService.listReports(req.user!.userId, req.user!.role, req.query.type as string);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const createReport = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    reportType: z.enum(REPORT_TYPES as unknown as [string, ...string[]]),
    title: z.string().min(1),
    description: z.string().min(1),
    location: z.string().optional(),
    district: z.string().optional(),
    involvedParties: z.array(z.string()).optional(),
    suspectNames: z.array(z.string()).optional(),
  }).parse(req.body ?? {});
  try {
    const data = await policeService.createReport(getActorId(req), body as never, req.user!.role);
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const createCitation = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    citationType: z.enum(CITATION_TYPES as unknown as [string, ...string[]]).optional(),
    violatorName: z.string().min(1),
    violatorUserId: z.string().optional(),
    plateNumber: z.string().optional(),
    violationCode: z.string().min(1),
    description: z.string().min(1),
    location: z.string().min(1),
    district: z.string().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await policeService.createCitation(getActorId(req), {
      ...body,
      citationType: body.citationType as 'citation' | 'warning' | undefined,
    }, req.user!.role);
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const cases = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await policeService.listCases(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const createCase = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    suspectNames: z.array(z.string()).optional(),
    charges: z.array(z.string()).optional(),
  }).parse(req.body ?? {});
  try {
    const data = await policeService.createCase(getActorId(req), body, req.user!.role);
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const evidence = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await policeService.listEvidence(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const createEvidence = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    type: z.enum(['photo', 'video', 'document', 'physical', 'digital', 'bodycam']).optional(),
    caseId: z.string().optional(),
    reportId: z.string().optional(),
    fileUrl: z.string().optional(),
    lockerNumber: z.string().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await policeService.createEvidence(getActorId(req), body as never, req.user!.role);
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const updateCase = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    status: z.enum(['open', 'investigating', 'pending_court', 'closed']).optional(),
    event: z.string().optional(),
    addEvidenceId: z.string().optional(),
    addReportId: z.string().optional(),
    addSuspect: z.string().optional(),
    addCharge: z.string().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await policeService.updateCase(getActorId(req), String(req.params.id), body, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const prison = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await policeService.getPrisonOverview(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const bookInmate = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    name: z.string().min(1),
    charges: z.array(z.string()).optional(),
    jailDays: z.number().int().positive().optional(),
    cellId: z.string().optional(),
    notes: z.string().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await policeService.bookInmate(getActorId(req), body, req.user!.role);
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const releaseInmate = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await policeService.releaseInmate(getActorId(req), String(req.params.id), req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const shifts = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await policeService.listShifts(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const createShift = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    officerBadge: z.string().optional(),
    shiftType: z.enum(['patrol', 'dispatch', 'detective', 'traffic', 'swat', 'admin']).optional(),
    startAt: z.string().min(1),
    endAt: z.string().min(1),
    district: z.string().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await policeService.createShift(getActorId(req), body, req.user!.role);
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const clockShift = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({ action: z.enum(['start', 'end']) }).parse(req.body ?? {});
  try {
    const data = await policeService.clockShift(getActorId(req), String(req.params.id), body.action, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const citations = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await policeService.listCitations(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const notes = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await policeService.listNotes(req.user!.userId, req.user!.role, req.query.subjectId as string | undefined);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const panics = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await policeService.listActivePanics(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const auditLog = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await policeService.listAuditLog(req.user!.userId, req.user!.role, Number(req.query.limit) || 100);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const transferEvidence = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({ action: z.string().min(1), notes: z.string().optional() }).parse(req.body ?? {});
  try {
    const data = await policeService.transferEvidenceCustody(getActorId(req), String(req.params.id), body, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const search = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    searchType: z.enum(['person', 'vehicle', 'plate', 'property', 'business', 'phone', 'identity', 'weapon']),
    query: z.string().min(1),
  }).parse(req.body ?? {});
  try {
    const data = await policeService.performSearch(getActorId(req), body.searchType, body.query, req.user!.role, clientMeta(req));
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const panic = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    district: z.string().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await policeService.triggerPanic(getActorId(req), req.user!.role, { ...body, ...clientMeta(req) });
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const analytics = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await policeService.getAnalytics(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const gangs = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await policeService.listGangs(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const organizations = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await policeService.listOrganizations(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const createNote = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    content: z.string().min(1),
    subjectType: z.string().optional(),
    subjectId: z.string().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await policeService.createNote(getActorId(req), body, req.user!.role);
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const track = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    requestType: z.string(),
    targetPhoneNumber: z.string().optional(),
    targetUserId: z.string().optional(),
    reason: z.string().min(1),
    warrantId: z.string().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await policeService.trackTarget(getActorId(req), body, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const citizenBank = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await policeService.getCitizenBank(req.user!.userId, String(req.params.userId), req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const liveGps = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await policeService.getLiveGps(req.user!.userId, String(req.params.userId), req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const rbac = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await policeService.getRbacConfig(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const updateRbac = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    role: z.enum(POLICE_ROLES as unknown as [string, ...string[]]),
    permissions: z.array(z.string()),
  }).parse(req.body ?? {});
  try {
    const data = await policeService.setRbacConfig(getActorId(req), body.role as never, body.permissions, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const fineCalculator = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { violationCode } = z.object({ violationCode: z.string() }).parse(req.query);
  const { calculateFine, calculateJailDays } = await import('../../services/policeIntegrationService');
  res.json({ success: true, data: { fine: calculateFine(violationCode), jailDays: calculateJailDays(violationCode) } });
});
