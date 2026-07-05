import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { Types } from 'mongoose';
import { User } from '../database/models/User';
import { JusticeOfficial } from '../database/models/JusticeOfficial';
import { JusticeCourtroom } from '../database/models/JusticeCourtroom';
import { JusticeCase } from '../database/models/JusticeCase';
import { JusticeHearing } from '../database/models/JusticeHearing';
import { JusticeTrial } from '../database/models/JusticeTrial';
import { JusticeCharge } from '../database/models/JusticeCharge';
import { JusticeLaw } from '../database/models/JusticeLaw';
import { JusticeSentence } from '../database/models/JusticeSentence';
import { JusticeWarrant } from '../database/models/JusticeWarrant';
import { JusticeAppeal } from '../database/models/JusticeAppeal';
import { JusticeWitness } from '../database/models/JusticeWitness';
import { JusticeEvidence } from '../database/models/JusticeEvidence';
import { JusticeSubpoena } from '../database/models/JusticeSubpoena';
import { JusticeJudgment } from '../database/models/JusticeJudgment';
import { JusticeDocket } from '../database/models/JusticeDocket';
import { JusticeSearchLog } from '../database/models/JusticeSearchLog';
import { PoliceCase } from '../database/models/PoliceCase';
import { PoliceCitation } from '../database/models/PoliceCitation';
import {
  JUSTICE_APP_BUNDLE,
  JUSTICE_ROLES,
  type JusticeRole,
  type OfficialStatus,
  type CaseStatus,
  type HearingStatus,
  type TrialStatus,
} from '../constants/justice';
import {
  seedJusticeRoleConfigs,
  requireOfficial,
  assertJusticePermission,
  formatOfficial,
  getRolePermissions,
  updateRolePermissions,
  createDigitalSignature,
} from './justiceRBACService';
import {
  logJusticeAction,
  searchCitizen,
  searchCaseNumber,
  searchJusticeEvidence,
  searchPoliceReports,
  searchBankRecords,
  getPendingPoliceCases,
  getPendingWarrants,
  getContestedCitations,
  syncPoliceWarrantReview,
  searchIdentity,
  searchPhone,
  searchPlate,
  searchVehicle,
  searchProperty,
  searchBusiness,
  searchWeaponLicense,
  getCommunicationLogs,
  getGpsRecord,
} from './justiceIntegrationService';
import { createEvent } from './calendarService';
import { emitToUser } from './socketService';
import { enqueueNotification } from './notificationBrokerService';
import { checkPermission } from './permissionBrokerService';

function id(prefix: string) {
  return `${prefix}-${uuidv4().slice(0, 8).toUpperCase()}`;
}

function caseNumber() {
  const year = new Date().getFullYear();
  const seq = Math.floor(Math.random() * 9000) + 1000;
  return `CR-${year}-${seq}`;
}

async function broadcastJustice(event: string, data: unknown, userId?: string) {
  if (userId) emitToUser(userId, event as never, data);
  const officials = await JusticeOfficial.find({ deletedAt: null, status: { $ne: 'off_duty' } });
  for (const o of officials) {
    emitToUser(o.userId.toString(), event as never, data);
  }
}

async function formatOfficialWithUser(official: InstanceType<typeof JusticeOfficial>) {
  const user = await User.findById(official.userId);
  return formatOfficial(official, user ?? undefined);
}

const ROLE_TITLES: Record<JusticeRole, string> = {
  chief_judge: 'Chief Judge',
  judge: 'Judge',
  magistrate: 'Magistrate',
  prosecutor: 'Prosecutor',
  defense_attorney: 'Defense Attorney',
  court_clerk: 'Court Clerk',
  bailiff: 'Bailiff',
  court_admin: 'Court Administrator',
};

export async function initializeJustice(userId: string, userRole?: string) {
  await seedJusticeRoleConfigs();

  const hasApp = await checkPermission(userId, JUSTICE_APP_BUNDLE, 'location');
  if (!hasApp && userRole !== 'admin') throw new Error('APP_NOT_INSTALLED');

  let official = await JusticeOfficial.findOne({ userId, deletedAt: null });
  if (!official) {
    const user = await User.findById(userId);
    if (!user) throw new Error('USER_NOT_FOUND');
    const employeeId = `JD-${String(await JusticeOfficial.countDocuments() + 1).padStart(4, '0')}`;
    const defaultRole: JusticeRole = userRole === 'admin' ? 'chief_judge' : 'court_clerk';
    official = await JusticeOfficial.create({
      userId: new Types.ObjectId(userId),
      employeeId,
      role: defaultRole,
      title: ROLE_TITLES[defaultRole],
      department: 'GULF Superior Court',
      status: 'off_duty',
      signatureHash: crypto.createHash('sha256').update(`${employeeId}:${userId}`).digest('hex'),
      createdBy: new Types.ObjectId(userId),
    });
  }

  await seedCourtrooms();
  await seedLaws();
  await syncPendingPoliceData(userId);

  emitToUser(userId, 'justice:initialized', { official: await formatOfficialWithUser(official) });
  return { initialized: true, official: await formatOfficialWithUser(official) };
}

async function seedCourtrooms() {
  if (await JusticeCourtroom.countDocuments() > 0) return;
  const rooms = [
    { courtroomId: 'CR-101', name: 'Courtroom 101', floor: 1, capacity: 80 },
    { courtroomId: 'CR-102', name: 'Courtroom 102', floor: 1, capacity: 60 },
    { courtroomId: 'CR-201', name: 'Courtroom 201', floor: 2, capacity: 100 },
    { courtroomId: 'CR-MAG', name: 'Magistrate Court', floor: 1, capacity: 40 },
  ];
  for (const r of rooms) {
    await JusticeCourtroom.create({ ...r, status: 'available' });
  }
}

async function seedLaws() {
  if (await JusticeLaw.countDocuments() > 0) return;
  const laws = [
    { lawId: id('LAW'), statute: 'PC-187', title: 'Murder', description: 'Unlawful killing of a human being', category: 'violent_crime', severity: 'felony' as const, minFine: 0, maxFine: 0, minJailDays: 365, maxJailDays: 3650 },
    { lawId: id('LAW'), statute: 'PC-211', title: 'Robbery', description: 'Taking property by force or fear', category: 'violent_crime', severity: 'felony' as const, minFine: 1000, maxFine: 10000, minJailDays: 180, maxJailDays: 1095 },
    { lawId: id('LAW'), statute: 'PC-484', title: 'Petty Theft', description: 'Theft of property valued under $950', category: 'property_crime', severity: 'misdemeanor' as const, minFine: 250, maxFine: 1000, minJailDays: 0, maxJailDays: 180 },
    { lawId: id('LAW'), statute: 'VC-22350', title: 'Speeding', description: 'Unsafe speed for conditions', category: 'traffic', severity: 'infraction' as const, minFine: 100, maxFine: 500, minJailDays: 0, maxJailDays: 0 },
    { lawId: id('LAW'), statute: 'VC-23152', title: 'DUI', description: 'Driving under the influence', category: 'traffic', severity: 'misdemeanor' as const, minFine: 500, maxFine: 5000, minJailDays: 2, maxJailDays: 365 },
    { lawId: id('LAW'), statute: 'PC-415', title: 'Disturbing the Peace', description: 'Unlawful fighting or unreasonable noise', category: 'public_order', severity: 'misdemeanor' as const, minFine: 200, maxFine: 1000, minJailDays: 0, maxJailDays: 90 },
    { lawId: id('LAW'), statute: 'PC-245', title: 'Assault with Deadly Weapon', description: 'Assault with a deadly weapon or force likely to cause great bodily injury', category: 'violent_crime', severity: 'felony' as const, minFine: 1000, maxFine: 10000, minJailDays: 180, maxJailDays: 1460 },
    { lawId: id('LAW'), statute: 'PC-148', title: 'Resisting Arrest', description: 'Willfully resisting or obstructing a peace officer', category: 'public_order', severity: 'misdemeanor' as const, minFine: 500, maxFine: 2000, minJailDays: 0, maxJailDays: 365 },
  ];
  for (const law of laws) {
    await JusticeLaw.create({ ...law, active: true });
  }
}

async function syncPendingPoliceData(actorId: string) {
  const pendingCases = await getPendingPoliceCases();
  for (const pc of pendingCases) {
    const existing = await JusticeCase.findOne({ policeCaseId: pc.caseId, deletedAt: null });
    if (existing) continue;

    const suspect = pc.suspectNames[0] ?? 'Unknown Defendant';
    const caseDoc = await JusticeCase.create({
      caseId: id('CASE'),
      caseNumber: caseNumber(),
      title: pc.title,
      description: pc.description,
      status: 'pending',
      policeCaseId: pc.caseId,
      defendantName: suspect,
      charges: pc.charges,
      district: pc.district,
      timeline: [{ at: new Date(), event: `Imported from police case ${pc.caseId}` }],
      createdBy: new Types.ObjectId(actorId),
    });

    await broadcastJustice('justice:case:update', { caseId: caseDoc.caseId, status: caseDoc.status });
  }

  const pendingWarrants = await getPendingWarrants();
  for (const pw of pendingWarrants) {
    const existing = await JusticeWarrant.findOne({ policeWarrantId: pw.warrantId, deletedAt: null });
    if (existing) continue;

    await JusticeWarrant.create({
      warrantReviewId: id('WREV'),
      policeWarrantId: pw.warrantId,
      warrantType: pw.type,
      subjectName: pw.subjectName,
      subjectUserId: pw.subjectUserId,
      charges: pw.charges,
      description: pw.description,
      requestedByBadge: pw.issuedBy,
      expiresAt: pw.expiresAt,
      address: pw.address,
      district: pw.district,
      reviewStatus: 'pending',
      createdBy: new Types.ObjectId(actorId),
    });
  }
}

export async function getDashboard(userId: string, userRole?: string) {
  await assertJusticePermission(userId, 'dashboard.view', userRole);
  const official = await requireOfficial(userId);

  const [activeCases, pendingHearings, pendingWarrants, pendingAppeals, contestedCitations, todayDockets] = await Promise.all([
    JusticeCase.countDocuments({ status: { $nin: ['closed', 'dismissed'] }, deletedAt: null }),
    JusticeHearing.countDocuments({ status: 'scheduled', scheduledAt: { $gte: new Date() }, deletedAt: null }),
    JusticeWarrant.countDocuments({ reviewStatus: 'pending', deletedAt: null }),
    JusticeAppeal.countDocuments({ status: { $in: ['filed', 'under_review', 'hearing_scheduled'] }, deletedAt: null }),
    PoliceCitation.countDocuments({ status: 'contested', deletedAt: null }),
    JusticeDocket.countDocuments({ date: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }, status: 'published', deletedAt: null }),
  ]);

  const upcomingHearings = await JusticeHearing.find({
    status: 'scheduled',
    scheduledAt: { $gte: new Date() },
    deletedAt: null,
  }).sort({ scheduledAt: 1 }).limit(5);

  const recentCases = await JusticeCase.find({ deletedAt: null }).sort({ updatedAt: -1 }).limit(5);

  return {
    official: await formatOfficialWithUser(official),
    stats: {
      activeCases,
      pendingHearings,
      pendingWarrants,
      pendingAppeals,
      contestedCitations,
      todayDockets,
    },
    upcomingHearings: upcomingHearings.map(formatHearing),
    recentCases: recentCases.map(formatCase),
    permissions: await getRolePermissions(official.role),
  };
}

function formatCase(c: InstanceType<typeof JusticeCase>) {
  return {
    caseId: c.caseId,
    caseNumber: c.caseNumber,
    title: c.title,
    description: c.description,
    status: c.status,
    policeCaseId: c.policeCaseId,
    defendantName: c.defendantName,
    defendantUserId: c.defendantUserId?.toString(),
    prosecutorEmployeeId: c.prosecutorEmployeeId,
    defenseAttorneyEmployeeId: c.defenseAttorneyEmployeeId,
    judgeEmployeeId: c.judgeEmployeeId,
    charges: c.charges,
    courtroomId: c.courtroomId,
    district: c.district,
    filedAt: c.filedAt.toISOString(),
    closedAt: c.closedAt?.toISOString(),
    timeline: c.timeline,
    createdAt: (c as unknown as { createdAt: Date }).createdAt?.toISOString(),
    updatedAt: (c as unknown as { updatedAt: Date }).updatedAt?.toISOString(),
  };
}

function formatHearing(h: InstanceType<typeof JusticeHearing>) {
  return {
    hearingId: h.hearingId,
    caseId: h.caseId,
    caseNumber: h.caseNumber,
    title: h.title,
    hearingType: h.hearingType,
    status: h.status,
    scheduledAt: h.scheduledAt.toISOString(),
    endAt: h.endAt?.toISOString(),
    courtroomId: h.courtroomId,
    judgeEmployeeId: h.judgeEmployeeId,
    liveUpdates: h.liveUpdates,
    notes: h.notes,
  };
}

function formatTrial(t: InstanceType<typeof JusticeTrial>) {
  return {
    trialId: t.trialId,
    caseId: t.caseId,
    caseNumber: t.caseNumber,
    title: t.title,
    status: t.status,
    scheduledAt: t.scheduledAt.toISOString(),
    courtroomId: t.courtroomId,
    judgeEmployeeId: t.judgeEmployeeId,
    jurySize: t.jurySize,
    jurySelected: t.jurySelected,
    verdict: t.verdict,
    verdictAt: t.verdictAt?.toISOString(),
    liveUpdates: t.liveUpdates,
  };
}

export async function updateOfficialStatus(
  userId: string,
  status: OfficialStatus,
  actorId: string,
  userRole?: string,
  meta?: { deviceUuid?: string; ipAddress?: string }
) {
  await assertJusticePermission(actorId, 'mdt.access', userRole);
  const official = await requireOfficial(actorId);
  official.status = status;
  official.lastStatusAt = new Date();
  if (meta?.deviceUuid) official.deviceUuid = meta.deviceUuid;
  if (meta?.ipAddress) official.ipAddress = meta.ipAddress;
  await official.save();

  await logJusticeAction({
    userId: actorId, actorId, action: 'official_status_update',
    resource: 'justice_official', resourceId: official.employeeId,
    metadata: { status }, employeeId: official.employeeId,
    deviceUuid: meta?.deviceUuid, ipAddress: meta?.ipAddress,
  });

  return formatOfficialWithUser(official);
}

export async function listCases(userId: string, userRole?: string, filters?: { status?: string }) {
  await assertJusticePermission(userId, 'cases.view', userRole);
  const query: Record<string, unknown> = { deletedAt: null };
  if (filters?.status) query.status = filters.status;
  const cases = await JusticeCase.find(query).sort({ updatedAt: -1 }).limit(100);
  return cases.map(formatCase);
}

export async function getCase(userId: string, caseId: string, userRole?: string) {
  await assertJusticePermission(userId, 'cases.view', userRole);
  const caseDoc = await JusticeCase.findOne({ caseId, deletedAt: null });
  if (!caseDoc) throw new Error('CASE_NOT_FOUND');

  const [charges, evidence, witnesses, hearings, appeals, judgments, sentences] = await Promise.all([
    JusticeCharge.find({ caseId, deletedAt: null }),
    JusticeEvidence.find({ caseId, deletedAt: null }),
    JusticeWitness.find({ caseId, deletedAt: null }),
    JusticeHearing.find({ caseId, deletedAt: null }).sort({ scheduledAt: 1 }),
    JusticeAppeal.find({ caseId, deletedAt: null }),
    JusticeJudgment.find({ caseId, deletedAt: null }),
    JusticeSentence.find({ caseId, deletedAt: null }),
  ]);

  let policeCase = null;
  if (caseDoc.policeCaseId) {
    policeCase = await PoliceCase.findOne({ caseId: caseDoc.policeCaseId, deletedAt: null });
  }

  return {
    ...formatCase(caseDoc),
    charges,
    evidence,
    witnesses,
    hearings: hearings.map(formatHearing),
    appeals,
    judgments,
    sentences,
    policeCase,
  };
}

export async function createCase(
  actorId: string,
  data: {
    title: string;
    description: string;
    defendantName: string;
    defendantUserId?: string;
    policeCaseId?: string;
    charges?: string[];
    district?: string;
  },
  userRole?: string
) {
  await assertJusticePermission(actorId, 'cases.create', userRole);
  const official = await requireOfficial(actorId);

  const caseDoc = await JusticeCase.create({
    caseId: id('CASE'),
    caseNumber: caseNumber(),
    title: data.title,
    description: data.description,
    defendantName: data.defendantName,
    defendantUserId: data.defendantUserId ? new Types.ObjectId(data.defendantUserId) : undefined,
    policeCaseId: data.policeCaseId,
    charges: data.charges ?? [],
    district: data.district,
    clerkEmployeeId: official.employeeId,
    timeline: [{ at: new Date(), event: 'Case filed', employeeId: official.employeeId }],
    createdBy: new Types.ObjectId(actorId),
  });

  if (data.policeCaseId) {
    await PoliceCase.findOneAndUpdate(
      { caseId: data.policeCaseId },
      { status: 'pending_court' }
    );
  }

  await logJusticeAction({
    userId: actorId, actorId, action: 'case_create',
    resource: 'justice_case', resourceId: caseDoc.caseId,
    employeeId: official.employeeId,
  });

  await broadcastJustice('justice:case:update', { caseId: caseDoc.caseId, status: caseDoc.status });
  return formatCase(caseDoc);
}

export async function updateCase(
  actorId: string,
  caseId: string,
  updates: {
    status?: CaseStatus;
    judgeEmployeeId?: string;
    prosecutorEmployeeId?: string;
    defenseAttorneyEmployeeId?: string;
    courtroomId?: string;
    event?: string;
  },
  userRole?: string
) {
  await assertJusticePermission(actorId, 'cases.manage', userRole);
  const official = await requireOfficial(actorId);
  const caseDoc = await JusticeCase.findOne({ caseId, deletedAt: null });
  if (!caseDoc) throw new Error('CASE_NOT_FOUND');

  if (updates.status) {
    caseDoc.status = updates.status;
    if (updates.status === 'closed' || updates.status === 'dismissed') {
      caseDoc.closedAt = new Date();
    }
  }
  if (updates.judgeEmployeeId) caseDoc.judgeEmployeeId = updates.judgeEmployeeId;
  if (updates.prosecutorEmployeeId) caseDoc.prosecutorEmployeeId = updates.prosecutorEmployeeId;
  if (updates.defenseAttorneyEmployeeId) caseDoc.defenseAttorneyEmployeeId = updates.defenseAttorneyEmployeeId;
  if (updates.courtroomId) caseDoc.courtroomId = updates.courtroomId;

  caseDoc.timeline.push({
    at: new Date(),
    event: updates.event ?? `Case updated to ${updates.status ?? 'modified'}`,
    employeeId: official.employeeId,
  });
  caseDoc.updatedBy = new Types.ObjectId(actorId);
  await caseDoc.save();

  await broadcastJustice('justice:case:update', { caseId: caseDoc.caseId, status: caseDoc.status });
  return formatCase(caseDoc);
}

export async function listHearings(userId: string, userRole?: string, filters?: { status?: string; from?: Date }) {
  await assertJusticePermission(userId, 'hearings.view', userRole);
  const query: Record<string, unknown> = { deletedAt: null };
  if (filters?.status) query.status = filters.status;
  if (filters?.from) query.scheduledAt = { $gte: filters.from };
  const hearings = await JusticeHearing.find(query).sort({ scheduledAt: 1 }).limit(100);
  return hearings.map(formatHearing);
}

export async function scheduleHearing(
  actorId: string,
  data: {
    caseId: string;
    title: string;
    hearingType: string;
    scheduledAt: string;
    endAt?: string;
    courtroomId: string;
    judgeEmployeeId?: string;
  },
  userRole?: string
) {
  await assertJusticePermission(actorId, 'hearings.schedule', userRole);
  const official = await requireOfficial(actorId);
  const caseDoc = await JusticeCase.findOne({ caseId: data.caseId, deletedAt: null });
  if (!caseDoc) throw new Error('CASE_NOT_FOUND');

  const hearing = await JusticeHearing.create({
    hearingId: id('HRG'),
    caseId: data.caseId,
    caseNumber: caseDoc.caseNumber,
    title: data.title,
    hearingType: data.hearingType,
    scheduledAt: new Date(data.scheduledAt),
    endAt: data.endAt ? new Date(data.endAt) : undefined,
    courtroomId: data.courtroomId,
    judgeEmployeeId: data.judgeEmployeeId ?? caseDoc.judgeEmployeeId,
    prosecutorEmployeeId: caseDoc.prosecutorEmployeeId,
    defenseAttorneyEmployeeId: caseDoc.defenseAttorneyEmployeeId,
    clerkEmployeeId: official.employeeId,
    status: 'scheduled',
    createdBy: new Types.ObjectId(actorId),
  });

  caseDoc.hearingIds.push(hearing.hearingId);
  caseDoc.timeline.push({ at: new Date(), event: `Hearing scheduled: ${data.title}`, employeeId: official.employeeId });
  await caseDoc.save();

  const calendarEvent = await createEvent(
    actorId,
    {
      title: `${caseDoc.caseNumber}: ${data.title}`,
      description: `Court hearing at ${data.courtroomId}`,
      eventType: 'justice_hearing',
      startAt: data.scheduledAt,
      endAt: data.endAt ?? new Date(new Date(data.scheduledAt).getTime() + 3600000).toISOString(),
      location: data.courtroomId,
      metadata: { caseId: data.caseId, hearingId: hearing.hearingId },
    },
    actorId
  );
  hearing.calendarEventId = calendarEvent.eventId;
  await hearing.save();

  await broadcastJustice('justice:hearing:update', formatHearing(hearing));
  await enqueueNotification({
    userId: actorId,
    title: 'Hearing Scheduled',
    body: `${caseDoc.caseNumber}: ${data.title}`,
    priority: 'high',
    appId: JUSTICE_APP_BUNDLE,
  });

  return formatHearing(hearing);
}

export async function updateHearing(
  actorId: string,
  hearingId: string,
  updates: { status?: HearingStatus; note?: string; liveMessage?: string },
  userRole?: string
) {
  await assertJusticePermission(actorId, 'hearings.manage', userRole);
  const official = await requireOfficial(actorId);
  const hearing = await JusticeHearing.findOne({ hearingId, deletedAt: null });
  if (!hearing) throw new Error('HEARING_NOT_FOUND');

  if (updates.status) hearing.status = updates.status;
  if (updates.note) hearing.notes.push(updates.note);
  if (updates.liveMessage) {
    hearing.liveUpdates.push({ at: new Date(), message: updates.liveMessage, employeeId: official.employeeId });
    await broadcastJustice('justice:courtroom:live', {
      hearingId, courtroomId: hearing.courtroomId, message: updates.liveMessage,
    });
  }
  await hearing.save();

  await broadcastJustice('justice:hearing:update', formatHearing(hearing));
  return formatHearing(hearing);
}

export async function listTrials(userId: string, userRole?: string) {
  await assertJusticePermission(userId, 'trials.view', userRole);
  const trials = await JusticeTrial.find({ deletedAt: null }).sort({ scheduledAt: 1 }).limit(100);
  return trials.map(formatTrial);
}

export async function createTrial(
  actorId: string,
  data: { caseId: string; title: string; scheduledAt: string; courtroomId: string; judgeEmployeeId: string },
  userRole?: string
) {
  await assertJusticePermission(actorId, 'trials.manage', userRole);
  const official = await requireOfficial(actorId);
  const caseDoc = await JusticeCase.findOne({ caseId: data.caseId, deletedAt: null });
  if (!caseDoc) throw new Error('CASE_NOT_FOUND');

  const trial = await JusticeTrial.create({
    trialId: id('TRL'),
    caseId: data.caseId,
    caseNumber: caseDoc.caseNumber,
    title: data.title,
    scheduledAt: new Date(data.scheduledAt),
    courtroomId: data.courtroomId,
    judgeEmployeeId: data.judgeEmployeeId,
    prosecutorEmployeeId: caseDoc.prosecutorEmployeeId,
    defenseAttorneyEmployeeId: caseDoc.defenseAttorneyEmployeeId,
    status: 'scheduled',
    createdBy: new Types.ObjectId(actorId),
  });

  caseDoc.trialId = trial.trialId;
  caseDoc.status = 'trial';
  caseDoc.timeline.push({ at: new Date(), event: `Trial scheduled: ${data.title}`, employeeId: official.employeeId });
  await caseDoc.save();

  await broadcastJustice('justice:trial:update', formatTrial(trial));
  return formatTrial(trial);
}

export async function updateTrial(
  actorId: string,
  trialId: string,
  updates: { status?: TrialStatus; verdict?: string; liveMessage?: string },
  userRole?: string
) {
  await assertJusticePermission(actorId, 'trials.manage', userRole);
  const official = await requireOfficial(actorId);
  const trial = await JusticeTrial.findOne({ trialId, deletedAt: null });
  if (!trial) throw new Error('TRIAL_NOT_FOUND');

  if (updates.status) trial.status = updates.status;
  if (updates.verdict) {
    trial.verdict = updates.verdict as never;
    trial.verdictAt = new Date();
    trial.status = 'completed';
  }
  if (updates.liveMessage) {
    trial.liveUpdates.push({ at: new Date(), message: updates.liveMessage, employeeId: official.employeeId });
    await broadcastJustice('justice:courtroom:live', {
      trialId, courtroomId: trial.courtroomId, message: updates.liveMessage,
    });
  }
  await trial.save();

  await broadcastJustice('justice:trial:update', formatTrial(trial));
  return formatTrial(trial);
}

export async function listOfficials(userId: string, userRole?: string, role?: string) {
  await assertJusticePermission(userId, 'mdt.access', userRole);
  const query: Record<string, unknown> = { deletedAt: null };
  if (role) query.role = role;
  const officials = await JusticeOfficial.find(query).sort({ employeeId: 1 });
  return Promise.all(officials.map(formatOfficialWithUser));
}

export async function listCourtrooms(userId: string, userRole?: string) {
  await assertJusticePermission(userId, 'courtrooms.view', userRole);
  return JusticeCourtroom.find({ deletedAt: null });
}

export async function listEvidence(userId: string, userRole?: string, caseId?: string) {
  await assertJusticePermission(userId, 'evidence.view', userRole);
  const query: Record<string, unknown> = { deletedAt: null };
  if (caseId) query.caseId = caseId;
  return JusticeEvidence.find(query).sort({ createdAt: -1 }).limit(100);
}

export async function createEvidence(
  actorId: string,
  data: {
    caseId?: string;
    policeEvidenceId?: string;
    title: string;
    description: string;
    type: string;
    fileUrl?: string;
    metadata?: Record<string, unknown>;
    location?: string;
  },
  userRole?: string
) {
  await assertJusticePermission(actorId, 'evidence.create', userRole);
  const official = await requireOfficial(actorId);
  const sig = createDigitalSignature(official.employeeId, data.title);

  let caseNumberVal: string | undefined;
  if (data.caseId) {
    const caseDoc = await JusticeCase.findOne({ caseId: data.caseId, deletedAt: null });
    caseNumberVal = caseDoc?.caseNumber;
  }

  const evidence = await JusticeEvidence.create({
    evidenceId: id('EVD'),
    caseId: data.caseId,
    caseNumber: caseNumberVal,
    policeEvidenceId: data.policeEvidenceId,
    title: data.title,
    description: data.description,
    type: data.type,
    fileUrl: data.fileUrl,
    metadata: data.metadata,
    location: data.location,
    collectedByEmployeeId: official.userId,
    collectedByEmployeeNumber: official.employeeId,
    chainOfCustody: [{
      officialId: official.userId,
      employeeId: official.employeeId,
      action: 'collected',
      at: new Date(),
      signatureHash: sig,
    }],
    createdBy: new Types.ObjectId(actorId),
  });

  if (data.caseId) {
    await JusticeCase.findOneAndUpdate({ caseId: data.caseId }, { $push: { evidenceIds: evidence.evidenceId } });
  }

  await broadcastJustice('justice:evidence:update', { evidenceId: evidence.evidenceId, title: evidence.title });
  return evidence;
}

export async function transferEvidenceCustody(
  actorId: string,
  evidenceId: string,
  action: string,
  userRole?: string
) {
  await assertJusticePermission(actorId, 'evidence.custody', userRole);
  const official = await requireOfficial(actorId);
  const evidence = await JusticeEvidence.findOne({ evidenceId, deletedAt: null });
  if (!evidence) throw new Error('EVIDENCE_NOT_FOUND');

  const sig = createDigitalSignature(official.employeeId, `${evidenceId}:${action}`);
  evidence.chainOfCustody.push({
    officialId: official.userId,
    employeeId: official.employeeId,
    action,
    at: new Date(),
    signatureHash: sig,
  });

  if (action === 'admit') {
    evidence.admitted = true;
    evidence.admittedAt = new Date();
    evidence.admittedByEmployeeId = official.employeeId;
  }

  await evidence.save();
  await broadcastJustice('justice:evidence:update', { evidenceId, action });
  return evidence;
}

export async function listWitnesses(userId: string, userRole?: string, caseId?: string) {
  await assertJusticePermission(userId, 'witnesses.view', userRole);
  const query: Record<string, unknown> = { deletedAt: null };
  if (caseId) query.caseId = caseId;
  return JusticeWitness.find(query).sort({ createdAt: -1 });
}

export async function addWitness(
  actorId: string,
  data: { caseId: string; name: string; userId?: string; phone?: string; role?: string; testimony?: string },
  userRole?: string
) {
  await assertJusticePermission(actorId, 'witnesses.manage', userRole);
  const official = await requireOfficial(actorId);
  const caseDoc = await JusticeCase.findOne({ caseId: data.caseId, deletedAt: null });
  if (!caseDoc) throw new Error('CASE_NOT_FOUND');

  const witness = await JusticeWitness.create({
    witnessId: id('WIT'),
    caseId: data.caseId,
    caseNumber: caseDoc.caseNumber,
    name: data.name,
    userId: data.userId ? new Types.ObjectId(data.userId) : undefined,
    phone: data.phone,
    role: data.role ?? 'eyewitness',
    testimony: data.testimony,
    addedByEmployeeId: official.employeeId,
    createdBy: new Types.ObjectId(actorId),
  });

  caseDoc.witnessIds.push(witness.witnessId);
  await caseDoc.save();
  return witness;
}

export async function listCharges(userId: string, userRole?: string, caseId?: string) {
  await assertJusticePermission(userId, 'charges.view', userRole);
  const query: Record<string, unknown> = { deletedAt: null };
  if (caseId) query.caseId = caseId;
  return JusticeCharge.find(query).sort({ filedAt: -1 });
}

export async function fileCharge(
  actorId: string,
  data: { caseId: string; statute: string; title: string; description: string; severity: string; lawId?: string },
  userRole?: string
) {
  await assertJusticePermission(actorId, 'charges.file', userRole);
  const official = await requireOfficial(actorId);
  const caseDoc = await JusticeCase.findOne({ caseId: data.caseId, deletedAt: null });
  if (!caseDoc) throw new Error('CASE_NOT_FOUND');

  const charge = await JusticeCharge.create({
    chargeId: id('CHG'),
    caseId: data.caseId,
    caseNumber: caseDoc.caseNumber,
    statute: data.statute,
    title: data.title,
    description: data.description,
    severity: data.severity,
    lawId: data.lawId,
    filedByEmployeeId: official.employeeId,
    createdBy: new Types.ObjectId(actorId),
  });

  caseDoc.charges.push(data.title);
  caseDoc.chargeIds.push(charge.chargeId);
  await caseDoc.save();
  return charge;
}

export async function listLaws(userId: string, userRole?: string) {
  await assertJusticePermission(userId, 'laws.view', userRole);
  return JusticeLaw.find({ active: true, deletedAt: null }).sort({ statute: 1 });
}

export async function listSentences(userId: string, userRole?: string, caseId?: string) {
  await assertJusticePermission(userId, 'sentences.view', userRole);
  const query: Record<string, unknown> = { deletedAt: null };
  if (caseId) query.caseId = caseId;
  return JusticeSentence.find(query).sort({ effectiveAt: -1 });
}

export async function issueSentence(
  actorId: string,
  data: {
    caseId: string;
    sentenceType: string;
    fineAmount?: number;
    prisonDays?: number;
    communityServiceHours?: number;
    probationMonths?: number;
    licenseSuspended?: boolean;
    licenseSuspensionDays?: number;
    description: string;
  },
  userRole?: string
) {
  await assertJusticePermission(actorId, 'sentences.issue', userRole);
  const official = await requireOfficial(actorId);
  const caseDoc = await JusticeCase.findOne({ caseId: data.caseId, deletedAt: null });
  if (!caseDoc) throw new Error('CASE_NOT_FOUND');

  const judgeId = caseDoc.judgeEmployeeId ?? official.employeeId;
  const sig = createDigitalSignature(judgeId, `${data.caseId}:${data.sentenceType}`);

  const sentence = await JusticeSentence.create({
    sentenceId: id('SNT'),
    caseId: data.caseId,
    caseNumber: caseDoc.caseNumber,
    defendantName: caseDoc.defendantName,
    defendantUserId: caseDoc.defendantUserId,
    sentenceType: data.sentenceType,
    fineAmount: data.fineAmount ?? 0,
    prisonDays: data.prisonDays ?? 0,
    communityServiceHours: data.communityServiceHours ?? 0,
    probationMonths: data.probationMonths ?? 0,
    licenseSuspended: data.licenseSuspended ?? false,
    licenseSuspensionDays: data.licenseSuspensionDays ?? 0,
    description: data.description,
    issuedByEmployeeId: official.employeeId,
    judgeEmployeeId: judgeId,
    signatureHash: sig,
    status: 'active',
    createdBy: new Types.ObjectId(actorId),
  });

  caseDoc.status = 'sentencing';
  caseDoc.timeline.push({ at: new Date(), event: `Sentence issued: ${data.sentenceType}`, employeeId: official.employeeId, signatureHash: sig });
  await caseDoc.save();

  await broadcastJustice('justice:sentence:issued', { sentenceId: sentence.sentenceId, caseId: data.caseId });
  await enqueueNotification({
    userId: actorId,
    title: 'Sentence Issued',
    body: `${caseDoc.caseNumber}: ${data.description}`,
    priority: 'high',
    appId: JUSTICE_APP_BUNDLE,
  });

  return sentence;
}

export async function listWarrantReviews(userId: string, userRole?: string, status?: string) {
  await assertJusticePermission(userId, 'warrants.view', userRole);
  const query: Record<string, unknown> = { deletedAt: null };
  if (status) query.reviewStatus = status;
  return JusticeWarrant.find(query).sort({ createdAt: -1 }).limit(100);
}

export async function reviewWarrant(
  actorId: string,
  warrantReviewId: string,
  approved: boolean,
  denialReason?: string,
  userRole?: string
) {
  const perm = approved ? 'warrants.approve' : 'warrants.revoke';
  await assertJusticePermission(actorId, perm, userRole);
  const official = await requireOfficial(actorId);
  const user = await User.findById(actorId);
  const warrant = await JusticeWarrant.findOne({ warrantReviewId, deletedAt: null });
  if (!warrant) throw new Error('WARRANT_NOT_FOUND');

  const sig = createDigitalSignature(official.employeeId, `${warrantReviewId}:${approved}`);
  warrant.reviewStatus = approved ? 'approved' : 'denied';
  warrant.reviewedByEmployeeId = official.employeeId;
  warrant.judgeEmployeeId = official.employeeId;
  warrant.judgeName = user?.displayName ?? official.title;
  warrant.signatureHash = sig;
  warrant.reviewedAt = new Date();
  if (!approved && denialReason) warrant.denialReason = denialReason;
  await warrant.save();

  await syncPoliceWarrantReview(warrant.policeWarrantId, warrant.judgeName!, approved);

  await logJusticeAction({
    userId: actorId, actorId, action: approved ? 'warrant_approved' : 'warrant_denied',
    resource: 'justice_warrant', resourceId: warrantReviewId,
    employeeId: official.employeeId, signatureHash: sig,
  });

  await broadcastJustice('justice:warrant:review', {
    warrantReviewId, reviewStatus: warrant.reviewStatus, policeWarrantId: warrant.policeWarrantId,
  });

  return warrant;
}

export async function listAppeals(userId: string, userRole?: string) {
  await assertJusticePermission(userId, 'appeals.view', userRole);
  return JusticeAppeal.find({ deletedAt: null }).sort({ filedAt: -1 }).limit(100);
}

export async function fileAppeal(
  actorId: string,
  data: { caseId: string; grounds: string; appellantName: string; appellantUserId?: string; originalSentenceId?: string },
  userRole?: string
) {
  await assertJusticePermission(actorId, 'appeals.manage', userRole);
  const official = await requireOfficial(actorId);
  const caseDoc = await JusticeCase.findOne({ caseId: data.caseId, deletedAt: null });
  if (!caseDoc) throw new Error('CASE_NOT_FOUND');

  const appeal = await JusticeAppeal.create({
    appealId: id('APL'),
    caseId: data.caseId,
    caseNumber: caseDoc.caseNumber,
    originalSentenceId: data.originalSentenceId,
    appellantName: data.appellantName,
    appellantUserId: data.appellantUserId ? new Types.ObjectId(data.appellantUserId) : undefined,
    grounds: data.grounds,
    filedByEmployeeId: official.employeeId,
    createdBy: new Types.ObjectId(actorId),
  });

  caseDoc.appealIds.push(appeal.appealId);
  caseDoc.status = 'appealed';
  await caseDoc.save();

  await broadcastJustice('justice:appeal:update', { appealId: appeal.appealId, status: appeal.status });
  return appeal;
}

export async function updateAppeal(
  actorId: string,
  appealId: string,
  updates: { status?: string; decision?: string; assignedJudgeEmployeeId?: string },
  userRole?: string
) {
  await assertJusticePermission(actorId, 'appeals.manage', userRole);
  const official = await requireOfficial(actorId);
  const appeal = await JusticeAppeal.findOne({ appealId, deletedAt: null });
  if (!appeal) throw new Error('APPEAL_NOT_FOUND');

  if (updates.status) appeal.status = updates.status as never;
  if (updates.decision) {
    appeal.decision = updates.decision;
    appeal.decisionAt = new Date();
    appeal.signatureHash = createDigitalSignature(official.employeeId, `${appealId}:${updates.decision}`);
  }
  if (updates.assignedJudgeEmployeeId) appeal.assignedJudgeEmployeeId = updates.assignedJudgeEmployeeId;
  await appeal.save();

  await broadcastJustice('justice:appeal:update', { appealId, status: appeal.status });
  return appeal;
}

export async function issueSubpoena(
  actorId: string,
  data: {
    caseId: string;
    recipientName: string;
    recipientUserId?: string;
    recipientPhone?: string;
    documentType: string;
    description: string;
    dueDate: string;
  },
  userRole?: string
) {
  await assertJusticePermission(actorId, 'subpoena.issue', userRole);
  const official = await requireOfficial(actorId);
  const caseDoc = await JusticeCase.findOne({ caseId: data.caseId, deletedAt: null });
  if (!caseDoc) throw new Error('CASE_NOT_FOUND');

  const judgeId = caseDoc.judgeEmployeeId ?? official.employeeId;
  const sig = createDigitalSignature(judgeId, `subpoena:${data.caseId}:${data.recipientName}`);

  const subpoena = await JusticeSubpoena.create({
    subpoenaId: id('SUB'),
    caseId: data.caseId,
    caseNumber: caseDoc.caseNumber,
    recipientName: data.recipientName,
    recipientUserId: data.recipientUserId ? new Types.ObjectId(data.recipientUserId) : undefined,
    recipientPhone: data.recipientPhone,
    documentType: data.documentType,
    description: data.description,
    dueDate: new Date(data.dueDate),
    issuedByEmployeeId: official.employeeId,
    judgeEmployeeId: judgeId,
    signatureHash: sig,
    createdBy: new Types.ObjectId(actorId),
  });

  await broadcastJustice('justice:subpoena:issued', { subpoenaId: subpoena.subpoenaId, caseNumber: caseDoc.caseNumber });
  return subpoena;
}

export async function issueJudgment(
  actorId: string,
  data: { caseId: string; title: string; ruling: string; outcome: string; sentenceId?: string },
  userRole?: string
) {
  await assertJusticePermission(actorId, 'judgment.issue', userRole);
  const official = await requireOfficial(actorId);
  const caseDoc = await JusticeCase.findOne({ caseId: data.caseId, deletedAt: null });
  if (!caseDoc) throw new Error('CASE_NOT_FOUND');

  const judgeId = caseDoc.judgeEmployeeId ?? official.employeeId;
  const sig = createDigitalSignature(judgeId, `judgment:${data.caseId}:${data.outcome}`);

  const judgment = await JusticeJudgment.create({
    judgmentId: id('JDG'),
    caseId: data.caseId,
    caseNumber: caseDoc.caseNumber,
    title: data.title,
    ruling: data.ruling,
    outcome: data.outcome,
    judgeEmployeeId: judgeId,
    signatureHash: sig,
    sentenceId: data.sentenceId,
    createdBy: new Types.ObjectId(actorId),
  });

  if (data.outcome === 'guilty') caseDoc.status = 'sentencing';
  else if (data.outcome === 'not_guilty' || data.outcome === 'dismissed') {
    caseDoc.status = 'closed';
    caseDoc.closedAt = new Date();
  }
  caseDoc.timeline.push({ at: new Date(), event: `Judgment: ${data.outcome}`, employeeId: official.employeeId, signatureHash: sig });
  await caseDoc.save();

  await broadcastJustice('justice:judgment:issued', { judgmentId: judgment.judgmentId, outcome: data.outcome });
  return judgment;
}

export async function listContestedCitations(userId: string, userRole?: string) {
  await assertJusticePermission(userId, 'citations.review', userRole);
  return getContestedCitations();
}

export async function resolveContestedCitation(
  actorId: string,
  citationId: string,
  resolution: 'upheld' | 'dismissed' | 'reduced',
  userRole?: string,
  reducedAmount?: number
) {
  await assertJusticePermission(actorId, 'citations.review', userRole);
  const official = await requireOfficial(actorId);
  const citation = await PoliceCitation.findOne({ citationId, deletedAt: null });
  if (!citation) throw new Error('CITATION_NOT_FOUND');

  if (resolution === 'upheld') citation.status = 'issued';
  else if (resolution === 'dismissed') citation.status = 'voided';
  else if (resolution === 'reduced' && reducedAmount !== undefined) {
    citation.fineAmount = reducedAmount;
    citation.status = 'issued';
  }
  await citation.save();

  await logJusticeAction({
    userId: actorId, actorId, action: 'citation_resolved',
    resource: 'police_citation', resourceId: citationId,
    metadata: { resolution }, employeeId: official.employeeId,
  });

  await broadcastJustice('justice:citation:resolved', { citationId, resolution });
  return citation;
}

export async function listDocket(userId: string, userRole?: string, date?: string) {
  await assertJusticePermission(userId, 'docket.view', userRole);
  const query: Record<string, unknown> = { deletedAt: null };
  if (date) {
    const d = new Date(date);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    query.date = { $gte: d, $lt: next };
  }
  return JusticeDocket.find(query).sort({ date: -1 }).limit(30);
}

export async function publishDocket(
  actorId: string,
  data: { date: string; courtroomId: string; entries: { time: string; caseNumber: string; caseId: string; title: string; hearingId?: string }[] },
  userRole?: string
) {
  await assertJusticePermission(actorId, 'docket.manage', userRole);
  const official = await requireOfficial(actorId);

  const docket = await JusticeDocket.create({
    docketId: id('DKT'),
    date: new Date(data.date),
    courtroomId: data.courtroomId,
    entries: data.entries.map((e) => ({ ...e, status: 'scheduled' as const })),
    publishedByEmployeeId: official.employeeId,
    status: 'published',
    createdBy: new Types.ObjectId(actorId),
  });

  await broadcastJustice('justice:docket:update', { docketId: docket.docketId, courtroomId: data.courtroomId });
  return docket;
}

export async function performSearch(
  actorId: string,
  searchType: string,
  query: string,
  userRole?: string,
  meta?: { ipAddress?: string; deviceUuid?: string }
) {
  const permMap: Record<string, string> = {
    citizen: 'search.citizen', identity: 'search.identity', phone: 'search.phone',
    vehicle: 'search.vehicle', property: 'search.property', business: 'search.business',
    weapon: 'search.weapon', case: 'search.case', evidence: 'search.evidence',
    report: 'search.report', bank: 'search.bank',
  };
  await assertJusticePermission(actorId, permMap[searchType] as never, userRole);
  const official = await requireOfficial(actorId);

  let results: unknown;
  switch (searchType) {
    case 'citizen': results = await searchCitizen(query); break;
    case 'identity': results = await searchIdentity(query); break;
    case 'phone': results = await searchPhone(query); break;
    case 'vehicle': results = await searchVehicle(query); break;
    case 'property': results = await searchProperty(query); break;
    case 'business': results = await searchBusiness(query); break;
    case 'weapon': results = await searchWeaponLicense(query); break;
    case 'case': results = await searchCaseNumber(query); break;
    case 'evidence': results = await searchJusticeEvidence(query); break;
    case 'report': results = await searchPoliceReports(query); break;
    case 'bank': {
      const user = await User.findOne({
        $or: [{ username: query.toLowerCase() }, { displayName: new RegExp(query, 'i') }],
      });
      if (!user) results = { found: false };
      else results = await searchBankRecords(user._id.toString());
      break;
    }
    default: throw new Error('INVALID_SEARCH_TYPE');
  }

  const log = await JusticeSearchLog.create({
    searchId: id('SRC'),
    searchType,
    query,
    officialId: official.userId,
    employeeId: official.employeeId,
    results: { data: results },
    resultCount: Array.isArray(results) ? results.length : 1,
    ipAddress: meta?.ipAddress,
    deviceUuid: meta?.deviceUuid,
    createdBy: new Types.ObjectId(actorId),
  });

  await logJusticeAction({
    userId: actorId, actorId, action: 'justice_search',
    resource: 'justice_search', resourceId: log.searchId,
    metadata: { searchType, query }, employeeId: official.employeeId,
    ipAddress: meta?.ipAddress, deviceUuid: meta?.deviceUuid,
  });

  await emitToUser(actorId, 'justice:search:complete', { searchId: log.searchId, searchType });
  return { searchId: log.searchId, searchType, query, results };
}

export async function getAnalytics(userId: string, userRole?: string) {
  await assertJusticePermission(userId, 'analytics.view', userRole);

  const [totalCases, activeCases, closedCases, hearings, trials, sentences, appeals, warrants] = await Promise.all([
    JusticeCase.countDocuments({ deletedAt: null }),
    JusticeCase.countDocuments({ status: { $nin: ['closed', 'dismissed'] }, deletedAt: null }),
    JusticeCase.countDocuments({ status: { $in: ['closed', 'dismissed'] }, deletedAt: null }),
    JusticeHearing.countDocuments({ deletedAt: null }),
    JusticeTrial.countDocuments({ deletedAt: null }),
    JusticeSentence.countDocuments({ deletedAt: null }),
    JusticeAppeal.countDocuments({ deletedAt: null }),
    JusticeWarrant.countDocuments({ reviewStatus: 'approved', deletedAt: null }),
  ]);

  const byStatus = await JusticeCase.aggregate([
    { $match: { deletedAt: null } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const bySeverity = await JusticeCharge.aggregate([
    { $match: { deletedAt: null } },
    { $group: { _id: '$severity', count: { $sum: 1 } } },
  ]);

  return {
    totalCases, activeCases, closedCases, hearings, trials, sentences, appeals, warrantsApproved: warrants,
    casesByStatus: byStatus,
    chargesBySeverity: bySeverity,
  };
}

export async function getRbac(userId: string, userRole?: string) {
  await assertJusticePermission(userId, 'audit.view', userRole);
  const configs = await Promise.all(
    JUSTICE_ROLES.map(async (role) => ({
      role,
      permissions: await getRolePermissions(role),
    }))
  );
  return configs;
}

export async function updateRbac(
  actorId: string,
  role: JusticeRole,
  permissions: string[],
  userRole?: string
) {
  await assertJusticePermission(actorId, 'rbac.configure', userRole);
  return updateRolePermissions(role, permissions as never, actorId);
}

export async function addCourtroomLiveUpdate(
  actorId: string,
  courtroomId: string,
  message: string,
  userRole?: string
) {
  await assertJusticePermission(actorId, 'realtime.courtroom', userRole);
  const official = await requireOfficial(actorId);

  const courtroom = await JusticeCourtroom.findOne({ courtroomId, deletedAt: null });
  if (!courtroom) throw new Error('COURTROOM_NOT_FOUND');

  await broadcastJustice('justice:courtroom:live', {
    courtroomId, message, employeeId: official.employeeId, at: new Date().toISOString(),
  });

  return { courtroomId, message, employeeId: official.employeeId };
}

export { getRolePermissions, updateRolePermissions };
