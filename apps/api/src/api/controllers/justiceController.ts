import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { getActorId } from '../../services/rbacService';
import {
  JUSTICE_ROLES,
  OFFICIAL_STATUSES,
  CASE_STATUSES,
  HEARING_STATUSES,
  HEARING_TYPES,
  TRIAL_STATUSES,
  SENTENCE_TYPES,
} from '../../constants/justice';
import * as justiceService from '../../services/justiceService';

function mapError(err: unknown): never {
  if (!(err instanceof Error)) throw err;
  const map: Record<string, [number, string]> = {
    PERMISSION_DENIED: [403, 'Permission denied'],
    NOT_A_COURT_OFFICIAL: [403, 'Not registered as court official'],
    APP_NOT_INSTALLED: [403, 'Justice app not installed'],
    CASE_NOT_FOUND: [404, 'Case not found'],
    HEARING_NOT_FOUND: [404, 'Hearing not found'],
    TRIAL_NOT_FOUND: [404, 'Trial not found'],
    EVIDENCE_NOT_FOUND: [404, 'Evidence not found'],
    WARRANT_NOT_FOUND: [404, 'Warrant review not found'],
    APPEAL_NOT_FOUND: [404, 'Appeal not found'],
    CITATION_NOT_FOUND: [404, 'Citation not found'],
    COURTROOM_NOT_FOUND: [404, 'Courtroom not found'],
    INVALID_SEARCH_TYPE: [400, 'Invalid search type'],
    USER_NOT_FOUND: [404, 'User not found'],
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
    const data = await justiceService.initializeJustice(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const dashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await justiceService.getDashboard(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const updateStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    status: z.enum(OFFICIAL_STATUSES as unknown as [string, ...string[]]),
  }).parse(req.body ?? {});
  try {
    const data = await justiceService.updateOfficialStatus(
      req.user!.userId, body.status as never, getActorId(req), req.user!.role, clientMeta(req)
    );
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const cases = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const data = await justiceService.listCases(req.user!.userId, req.user!.role, { status });
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const getCaseById = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await justiceService.getCase(req.user!.userId, String(req.params.id), req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const createCase = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    defendantName: z.string().min(1),
    defendantUserId: z.string().optional(),
    policeCaseId: z.string().optional(),
    charges: z.array(z.string()).optional(),
    district: z.string().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await justiceService.createCase(getActorId(req), body, req.user!.role);
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const updateCase = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    status: z.enum(CASE_STATUSES as unknown as [string, ...string[]]).optional(),
    judgeEmployeeId: z.string().optional(),
    prosecutorEmployeeId: z.string().optional(),
    defenseAttorneyEmployeeId: z.string().optional(),
    courtroomId: z.string().optional(),
    event: z.string().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await justiceService.updateCase(getActorId(req), String(req.params.id), body as never, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const hearings = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const data = await justiceService.listHearings(req.user!.userId, req.user!.role, { status });
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const scheduleHearing = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    caseId: z.string().min(1),
    title: z.string().min(1),
    hearingType: z.enum(HEARING_TYPES as unknown as [string, ...string[]]),
    scheduledAt: z.string().datetime(),
    endAt: z.string().datetime().optional(),
    courtroomId: z.string().min(1),
    judgeEmployeeId: z.string().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await justiceService.scheduleHearing(getActorId(req), body, req.user!.role);
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const updateHearing = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    status: z.enum(HEARING_STATUSES as unknown as [string, ...string[]]).optional(),
    note: z.string().optional(),
    liveMessage: z.string().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await justiceService.updateHearing(getActorId(req), String(req.params.id), body as never, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const trials = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await justiceService.listTrials(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const createTrial = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    caseId: z.string().min(1),
    title: z.string().min(1),
    scheduledAt: z.string().datetime(),
    courtroomId: z.string().min(1),
    judgeEmployeeId: z.string().min(1),
  }).parse(req.body ?? {});
  try {
    const data = await justiceService.createTrial(getActorId(req), body, req.user!.role);
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const updateTrial = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    status: z.enum(TRIAL_STATUSES as unknown as [string, ...string[]]).optional(),
    verdict: z.enum(['guilty', 'not_guilty', 'hung_jury', 'mistrial']).optional(),
    liveMessage: z.string().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await justiceService.updateTrial(getActorId(req), String(req.params.id), body as never, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const officials = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const role = req.query.role as string | undefined;
    const data = await justiceService.listOfficials(req.user!.userId, req.user!.role, role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const courtrooms = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await justiceService.listCourtrooms(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const evidence = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const caseId = req.query.caseId as string | undefined;
    const data = await justiceService.listEvidence(req.user!.userId, req.user!.role, caseId);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const createEvidence = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    caseId: z.string().optional(),
    policeEvidenceId: z.string().optional(),
    title: z.string().min(1),
    description: z.string().min(1),
    type: z.string().min(1),
    fileUrl: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
    location: z.string().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await justiceService.createEvidence(getActorId(req), body, req.user!.role);
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const transferEvidence = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({ action: z.string().min(1) }).parse(req.body ?? {});
  try {
    const data = await justiceService.transferEvidenceCustody(getActorId(req), String(req.params.id), body.action, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const witnesses = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const caseId = req.query.caseId as string | undefined;
    const data = await justiceService.listWitnesses(req.user!.userId, req.user!.role, caseId);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const addWitness = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    caseId: z.string().min(1),
    name: z.string().min(1),
    userId: z.string().optional(),
    phone: z.string().optional(),
    role: z.string().optional(),
    testimony: z.string().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await justiceService.addWitness(getActorId(req), body, req.user!.role);
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const charges = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const caseId = req.query.caseId as string | undefined;
    const data = await justiceService.listCharges(req.user!.userId, req.user!.role, caseId);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const fileCharge = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    caseId: z.string().min(1),
    statute: z.string().min(1),
    title: z.string().min(1),
    description: z.string().min(1),
    severity: z.enum(['infraction', 'misdemeanor', 'felony']),
    lawId: z.string().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await justiceService.fileCharge(getActorId(req), body, req.user!.role);
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const laws = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await justiceService.listLaws(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const sentences = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const caseId = req.query.caseId as string | undefined;
    const data = await justiceService.listSentences(req.user!.userId, req.user!.role, caseId);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const issueSentence = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    caseId: z.string().min(1),
    sentenceType: z.enum(SENTENCE_TYPES as unknown as [string, ...string[]]),
    fineAmount: z.number().optional(),
    prisonDays: z.number().optional(),
    communityServiceHours: z.number().optional(),
    probationMonths: z.number().optional(),
    licenseSuspended: z.boolean().optional(),
    licenseSuspensionDays: z.number().optional(),
    description: z.string().min(1),
  }).parse(req.body ?? {});
  try {
    const data = await justiceService.issueSentence(getActorId(req), body, req.user!.role);
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const warrants = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const data = await justiceService.listWarrantReviews(req.user!.userId, req.user!.role, status);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const reviewWarrant = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    approved: z.boolean(),
    denialReason: z.string().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await justiceService.reviewWarrant(
      getActorId(req), String(req.params.id), body.approved, body.denialReason, req.user!.role
    );
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const appeals = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await justiceService.listAppeals(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const fileAppeal = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    caseId: z.string().min(1),
    grounds: z.string().min(1),
    appellantName: z.string().min(1),
    appellantUserId: z.string().optional(),
    originalSentenceId: z.string().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await justiceService.fileAppeal(getActorId(req), body, req.user!.role);
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const updateAppeal = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    status: z.string().optional(),
    decision: z.string().optional(),
    assignedJudgeEmployeeId: z.string().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await justiceService.updateAppeal(getActorId(req), String(req.params.id), body, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const issueSubpoena = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    caseId: z.string().min(1),
    recipientName: z.string().min(1),
    recipientUserId: z.string().optional(),
    recipientPhone: z.string().optional(),
    documentType: z.enum(['testimony', 'records', 'physical_evidence', 'appearance']),
    description: z.string().min(1),
    dueDate: z.string().datetime(),
  }).parse(req.body ?? {});
  try {
    const data = await justiceService.issueSubpoena(getActorId(req), body, req.user!.role);
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const issueJudgment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    caseId: z.string().min(1),
    title: z.string().min(1),
    ruling: z.string().min(1),
    outcome: z.enum(['guilty', 'not_guilty', 'dismissed', 'settled', 'default']),
    sentenceId: z.string().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await justiceService.issueJudgment(getActorId(req), body, req.user!.role);
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const contestedCitations = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await justiceService.listContestedCitations(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const resolveCitation = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    resolution: z.enum(['upheld', 'dismissed', 'reduced']),
    reducedAmount: z.number().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await justiceService.resolveContestedCitation(
      getActorId(req), String(req.params.id), body.resolution, req.user!.role, body.reducedAmount
    );
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const docket = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const date = req.query.date as string | undefined;
    const data = await justiceService.listDocket(req.user!.userId, req.user!.role, date);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const publishDocket = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    date: z.string().datetime(),
    courtroomId: z.string().min(1),
    entries: z.array(z.object({
      time: z.string(),
      caseNumber: z.string(),
      caseId: z.string(),
      title: z.string(),
      hearingId: z.string().optional(),
    })),
  }).parse(req.body ?? {});
  try {
    const data = await justiceService.publishDocket(getActorId(req), body, req.user!.role);
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const search = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    searchType: z.string().min(1),
    query: z.string().min(1),
  }).parse(req.body ?? {});
  try {
    const data = await justiceService.performSearch(
      getActorId(req), body.searchType, body.query, req.user!.role, clientMeta(req)
    );
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const analytics = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await justiceService.getAnalytics(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const courtroomLive = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({ message: z.string().min(1) }).parse(req.body ?? {});
  try {
    const data = await justiceService.addCourtroomLiveUpdate(
      getActorId(req), String(req.params.id), body.message, req.user!.role
    );
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const legalNotes = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await justiceService.listLegalNotes(req.user!.userId, req.user!.role, req.query.subjectId as string | undefined);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const createLegalNote = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({ content: z.string().min(1), subjectType: z.string().optional(), subjectId: z.string().optional() }).parse(req.body ?? {});
  try {
    const data = await justiceService.createLegalNote(getActorId(req), body, req.user!.role);
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const documents = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await justiceService.listDocuments(req.user!.userId, req.user!.role, req.query.caseId as string | undefined);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const createDocument = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({ title: z.string().min(1), type: z.string().optional(), caseId: z.string().optional(), content: z.string().min(1) }).parse(req.body ?? {});
  try {
    const data = await justiceService.createDocument(getActorId(req), body, req.user!.role);
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const auditLog = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await justiceService.listAuditLog(req.user!.userId, req.user!.role, Number(req.query.limit) || 100);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const rbac = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await justiceService.getRbac(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const updateRbac = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    role: z.enum(JUSTICE_ROLES as unknown as [string, ...string[]]),
    permissions: z.array(z.string()),
  }).parse(req.body ?? {});
  try {
    const data = await justiceService.updateRbac(getActorId(req), body.role as never, body.permissions, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});
