import { v4 as uuidv4 } from 'uuid';
import { Types } from 'mongoose';
import { User } from '../database/models/User';
import { PoliceOfficer } from '../database/models/PoliceOfficer';
import { PoliceUnit } from '../database/models/PoliceUnit';
import { PoliceDispatch } from '../database/models/PoliceDispatch';
import { PoliceBolo } from '../database/models/PoliceBolo';
import { PoliceWarrant } from '../database/models/PoliceWarrant';
import { PoliceWanted } from '../database/models/PoliceWanted';
import { PoliceReport } from '../database/models/PoliceReport';
import { PoliceCitation } from '../database/models/PoliceCitation';
import { PoliceCase } from '../database/models/PoliceCase';
import { PoliceEvidence } from '../database/models/PoliceEvidence';
import { PoliceGang } from '../database/models/PoliceGang';
import { PoliceOrganization } from '../database/models/PoliceOrganization';
import { PoliceNote } from '../database/models/PoliceNote';
import { PolicePanicEvent } from '../database/models/PolicePanicEvent';
import { PoliceSearchLog } from '../database/models/PoliceSearchLog';
import {
  POLICE_APP_BUNDLE,
  POLICE_ROLES,
  type PoliceRole,
  type OfficerStatus,
  type DispatchStatus,
} from '../constants/police';
import {
  seedPoliceRoleConfigs,
  requireOfficer,
  assertPolicePermission,
  formatOfficer,
  getRolePermissions,
  updateRolePermissions,
} from './policeRBACService';
import {
  logPoliceAction,
  searchPerson,
  searchPhone,
  searchPlate,
  searchVehicle,
  searchProperty,
  searchBusiness,
  searchIdentity,
  searchWeaponLicense,
  getBankIntegration,
  getWorldLocation,
  calculateFine,
  calculateJailDays,
} from './policeIntegrationService';
import { createTrackingRequest } from './policeTrackingService';
import { emitToUser } from './socketService';
import { enqueueNotification } from './notificationBrokerService';
import { checkPermission } from './permissionBrokerService';
import { getWorldState } from './worldEngineService';

function id(prefix: string) {
  return `${prefix}-${uuidv4().slice(0, 8).toUpperCase()}`;
}

async function broadcastPolice(event: string, data: unknown, userId?: string) {
  if (userId) {
    emitToUser(userId, event as never, data);
  }
  const officers = await PoliceOfficer.find({ deletedAt: null, status: { $ne: 'off_duty' } });
  for (const o of officers) {
    emitToUser(o.userId.toString(), event as never, data);
  }
}

export async function initializePolice(userId: string, userRole?: string) {
  await seedPoliceRoleConfigs();

  const hasApp = await checkPermission(userId, POLICE_APP_BUNDLE, 'location');
  if (!hasApp && userRole !== 'admin') throw new Error('APP_NOT_INSTALLED');

  let officer = await PoliceOfficer.findOne({ userId, deletedAt: null });
  if (!officer) {
    const user = await User.findById(userId);
    if (!user) throw new Error('USER_NOT_FOUND');
    const badgeNumber = `BN-${String(await PoliceOfficer.countDocuments() + 1).padStart(4, '0')}`;
    officer = await PoliceOfficer.create({
      userId: new Types.ObjectId(userId),
      badgeNumber,
      role: userRole === 'admin' ? 'chief' : 'officer',
      rank: userRole === 'admin' ? 'Chief' : 'Officer',
      status: 'off_duty',
      callsign: `UNIT-${badgeNumber}`,
      createdBy: new Types.ObjectId(userId),
    });
  }

  await seedDefaultUnits();
  await seedSampleData(userId);

  emitToUser(userId, 'police:initialized', { officer: await formatOfficerWithUser(officer) });
  return { initialized: true, officer: await formatOfficerWithUser(officer) };
}

async function formatOfficerWithUser(officer: InstanceType<typeof PoliceOfficer>) {
  const user = await User.findById(officer.userId);
  return formatOfficer(officer, user ?? undefined);
}

async function seedDefaultUnits() {
  const count = await PoliceUnit.countDocuments();
  if (count > 0) return;
  const units = [
    { unitId: 'UNIT-ALPHA', code: 'A-1', name: 'Alpha Patrol', type: 'patrol' as const, radioChannel: 'CH-1' },
    { unitId: 'UNIT-BRAVO', code: 'B-1', name: 'Bravo Patrol', type: 'patrol' as const, radioChannel: 'CH-2' },
    { unitId: 'UNIT-DETECTIVE', code: 'D-1', name: 'Detective Division', type: 'detective' as const, radioChannel: 'CH-3' },
    { unitId: 'UNIT-DISPATCH', code: 'DISP-1', name: 'Central Dispatch', type: 'dispatch' as const, radioChannel: 'CH-0' },
    { unitId: 'UNIT-SWAT', code: 'S-1', name: 'SWAT Team', type: 'swat' as const, radioChannel: 'CH-9' },
  ];
  for (const u of units) {
    await PoliceUnit.create({ ...u, status: 'available', memberBadges: [] });
  }
}

async function seedSampleData(actorId: string) {
  if (await PoliceWanted.countDocuments() > 0) return;

  await PoliceWanted.create({
    wantedId: id('WNT'),
    name: 'Marcus Webb',
    aliases: ['Webby'],
    charges: ['Armed Robbery', 'Evading Arrest'],
    dangerLevel: 'high',
    lastSeen: 'Vinewood Hills',
    lastSeenDistrict: 'Vinewood',
    status: 'active',
    createdBy: new Types.ObjectId(actorId),
  });

  await PoliceDispatch.create({
    dispatchId: id('DSP'),
    callType: '911',
    priority: 1,
    status: 'pending',
    title: 'Armed Robbery in Progress',
    description: 'Caller reports armed suspect at convenience store',
    callerPhone: '555-0911',
    address: '123 Vinewood Blvd',
    district: 'Vinewood',
    is911: true,
    assignedBadges: [],
    assignedOfficerIds: [],
    notes: [],
    createdBy: new Types.ObjectId(actorId),
  });
}

export async function getDashboard(userId: string, userRole?: string) {
  await assertPolicePermission(userId, 'dashboard.view', userRole);
  const officer = await requireOfficer(userId);
  const world = await getWorldState(userId).catch(() => null);

  const [activeDispatches, calls911, onDutyOfficers, activeBolos, activeWarrants, openCases, activePanics] = await Promise.all([
    PoliceDispatch.countDocuments({ status: { $in: ['pending', 'assigned', 'en_route', 'on_scene'] }, deletedAt: null }),
    PoliceDispatch.countDocuments({ is911: true, status: { $ne: 'resolved' }, deletedAt: null }),
    PoliceOfficer.countDocuments({ status: { $in: ['on_duty', 'en_route', 'on_scene'] }, deletedAt: null }),
    PoliceBolo.countDocuments({ status: 'active', deletedAt: null }),
    PoliceWarrant.countDocuments({ status: 'active', deletedAt: null }),
    PoliceCase.countDocuments({ status: { $in: ['open', 'investigating'] }, deletedAt: null }),
    PolicePanicEvent.countDocuments({ status: 'active', deletedAt: null }),
  ]);

  const recentDispatches = await PoliceDispatch.find({ deletedAt: null })
    .sort({ priority: 1, createdAt: -1 }).limit(5);

  return {
    officer: await formatOfficerWithUser(officer),
    stats: {
      activeDispatches,
      calls911,
      onDutyOfficers,
      activeBolos,
      activeWarrants,
      openCases,
      activePanics,
    },
    location: world ? {
      district: world.district,
      street: world.street,
      postalCode: world.zone,
      latitude: world.latitude,
      longitude: world.longitude,
    } : null,
    recentDispatches: recentDispatches.map(formatDispatch),
    permissions: await getRolePermissions(officer.role),
  };
}

function formatDispatch(d: InstanceType<typeof PoliceDispatch>) {
  return {
    dispatchId: d.dispatchId,
    callType: d.callType,
    priority: d.priority,
    status: d.status,
    title: d.title,
    description: d.description,
    callerPhone: d.callerPhone,
    address: d.address,
    district: d.district,
    latitude: d.latitude,
    longitude: d.longitude,
    is911: d.is911,
    assignedUnitId: d.assignedUnitId,
    assignedBadges: d.assignedBadges,
    createdAt: d.createdAt.toISOString(),
    resolvedAt: d.resolvedAt?.toISOString(),
  };
}

export async function listOfficers(userId: string, userRole?: string) {
  await assertPolicePermission(userId, 'units.view', userRole);
  const officers = await PoliceOfficer.find({ deletedAt: null }).sort({ badgeNumber: 1 });
  return Promise.all(officers.map(formatOfficerWithUser));
}

export async function listUnits(userId: string, userRole?: string) {
  await assertPolicePermission(userId, 'units.view', userRole);
  const units = await PoliceUnit.find({ deletedAt: null });
  return units.map((u) => ({
    unitId: u.unitId,
    code: u.code,
    name: u.name,
    type: u.type,
    status: u.status,
    leaderBadge: u.leaderBadge,
    memberBadges: u.memberBadges,
    latitude: u.latitude,
    longitude: u.longitude,
    district: u.district,
    vehiclePlate: u.vehiclePlate,
    radioChannel: u.radioChannel,
  }));
}

export async function updateOfficerStatus(
  userId: string,
  status: OfficerStatus,
  actorId: string,
  userRole?: string,
  meta?: { latitude?: number; longitude?: number; district?: string; deviceUuid?: string; ipAddress?: string }
) {
  await assertPolicePermission(actorId, 'officer.status.update', userRole);
  const officer = await requireOfficer(actorId);
  officer.status = status;
  officer.lastStatusAt = new Date();
  if (meta?.latitude !== undefined) officer.latitude = meta.latitude;
  if (meta?.longitude !== undefined) officer.longitude = meta.longitude;
  if (meta?.district) officer.district = meta.district;
  if (meta?.deviceUuid) officer.deviceUuid = meta.deviceUuid;
  if (meta?.ipAddress) officer.ipAddress = meta.ipAddress;
  await officer.save();

  await logPoliceAction({
    userId: actorId,
    actorId,
    action: 'officer_status_update',
    resource: 'police_officer',
    resourceId: officer.badgeNumber,
    metadata: { status },
    officerBadge: officer.badgeNumber,
    deviceUuid: meta?.deviceUuid,
    ipAddress: meta?.ipAddress,
  });

  const payload = await formatOfficerWithUser(officer);
  await broadcastPolice('police:officer:status', payload);
  return payload;
}

export async function listDispatches(userId: string, userRole?: string, filters?: { is911?: boolean; status?: string }) {
  await assertPolicePermission(userId, 'dispatch.view', userRole);
  const query: Record<string, unknown> = { deletedAt: null };
  if (filters?.is911) query.is911 = true;
  if (filters?.status) query.status = filters.status;
  const dispatches = await PoliceDispatch.find(query).sort({ priority: 1, createdAt: -1 }).limit(100);
  return dispatches.map(formatDispatch);
}

export async function createDispatch(
  actorId: string,
  data: {
    callType: string;
    priority: number;
    title: string;
    description: string;
    callerPhone?: string;
    address?: string;
    district?: string;
    latitude?: number;
    longitude?: number;
    is911?: boolean;
  },
  userRole?: string,
  meta?: { ipAddress?: string; deviceUuid?: string }
) {
  const perm = data.is911 ? 'calls.911.manage' : 'dispatch.manage';
  await assertPolicePermission(actorId, perm, userRole);
  const officer = await requireOfficer(actorId);

  const dispatch = await PoliceDispatch.create({
    dispatchId: id('DSP'),
    ...data,
    status: 'pending',
    assignedOfficerIds: [],
    assignedBadges: [],
    notes: [],
    createdBy: new Types.ObjectId(actorId),
  });

  await logPoliceAction({
    userId: actorId,
    actorId,
    action: 'dispatch_create',
    resource: 'police_dispatch',
    resourceId: dispatch.dispatchId,
    metadata: { is911: data.is911 },
    officerBadge: officer.badgeNumber,
    ipAddress: meta?.ipAddress,
    deviceUuid: meta?.deviceUuid,
  });

  const formatted = formatDispatch(dispatch);
  await broadcastPolice(data.is911 ? 'police:911:new' : 'police:dispatch:new', formatted);
  await enqueueNotification({
    userId: actorId,
    title: data.is911 ? '911 Call Received' : 'New Dispatch',
    body: data.title,
    priority: data.priority === 1 ? 'critical' : 'high',
    appId: POLICE_APP_BUNDLE,
  });
  return formatted;
}

export async function updateDispatch(
  actorId: string,
  dispatchId: string,
  updates: { status?: DispatchStatus; assignedUnitId?: string; assignedBadges?: string[]; notes?: string },
  userRole?: string
) {
  await assertPolicePermission(actorId, 'dispatch.manage', userRole);
  const officer = await requireOfficer(actorId);
  const dispatch = await PoliceDispatch.findOne({ dispatchId, deletedAt: null });
  if (!dispatch) throw new Error('DISPATCH_NOT_FOUND');

  if (updates.status) dispatch.status = updates.status;
  if (updates.assignedUnitId) dispatch.assignedUnitId = updates.assignedUnitId;
  if (updates.assignedBadges) dispatch.assignedBadges = updates.assignedBadges;
  if (updates.notes) dispatch.notes.push(updates.notes);
  if (updates.status === 'resolved') dispatch.resolvedAt = new Date();
  dispatch.updatedBy = new Types.ObjectId(actorId);
  await dispatch.save();

  await logPoliceAction({
    userId: actorId,
    actorId,
    action: 'dispatch_update',
    resource: 'police_dispatch',
    resourceId: dispatchId,
    metadata: updates,
    officerBadge: officer.badgeNumber,
  });

  const formatted = formatDispatch(dispatch);
  await broadcastPolice('police:dispatch:update', formatted);
  return formatted;
}

export async function listBolos(userId: string, userRole?: string) {
  await assertPolicePermission(userId, 'bolo.view', userRole);
  const bolos = await PoliceBolo.find({ deletedAt: null, status: 'active' }).sort({ createdAt: -1 });
  return bolos.map((b) => ({
    boloId: b.boloId, type: b.type, title: b.title, description: b.description,
    subjectName: b.subjectName, plateNumber: b.plateNumber, dangerLevel: b.dangerLevel,
    status: b.status, issuedByBadge: b.issuedByBadge,
    createdAt: b.createdAt.toISOString(),
  }));
}

export async function createBolo(actorId: string, data: Partial<InstanceType<typeof PoliceBolo>>, userRole?: string) {
  await assertPolicePermission(actorId, 'bolo.create', userRole);
  const officer = await requireOfficer(actorId);
  const bolo = await PoliceBolo.create({
    boloId: id('BOLO'),
    type: data.type ?? 'person',
    title: data.title!,
    description: data.description!,
    subjectName: data.subjectName,
    plateNumber: data.plateNumber,
    vehicleDescription: data.vehicleDescription,
    dangerLevel: data.dangerLevel ?? 'medium',
    status: 'active',
    issuedByOfficerId: officer.userId,
    issuedByBadge: officer.badgeNumber,
    createdBy: new Types.ObjectId(actorId),
  });
  await logPoliceAction({ userId: actorId, actorId, action: 'bolo_create', resource: 'police_bolo', resourceId: bolo.boloId, officerBadge: officer.badgeNumber });
  await broadcastPolice('police:bolo:new', { boloId: bolo.boloId, title: bolo.title });
  return bolo;
}

export async function listWarrants(userId: string, userRole?: string) {
  await assertPolicePermission(userId, 'warrants.view', userRole);
  return PoliceWarrant.find({ deletedAt: null, status: 'active' }).sort({ createdAt: -1 });
}

export async function createWarrant(actorId: string, data: Partial<InstanceType<typeof PoliceWarrant>>, userRole?: string) {
  await assertPolicePermission(actorId, 'warrants.create', userRole);
  const officer = await requireOfficer(actorId);
  const warrant = await PoliceWarrant.create({
    warrantId: id('WAR'),
    type: data.type ?? 'arrest',
    subjectName: data.subjectName!,
    subjectUserId: data.subjectUserId,
    subjectPhone: data.subjectPhone,
    charges: data.charges ?? [],
    description: data.description!,
    issuedBy: officer.badgeNumber,
    status: 'active',
    expiresAt: data.expiresAt ?? new Date(Date.now() + 30 * 86400000),
    createdBy: new Types.ObjectId(actorId),
  });
  await logPoliceAction({ userId: actorId, actorId, action: 'warrant_create', resource: 'police_warrant', resourceId: warrant.warrantId, officerBadge: officer.badgeNumber });
  await broadcastPolice('police:warrant:new', { warrantId: warrant.warrantId, subjectName: warrant.subjectName });
  return warrant;
}

export async function listWanted(userId: string, userRole?: string) {
  await assertPolicePermission(userId, 'wanted.view', userRole);
  return PoliceWanted.find({ deletedAt: null, status: 'active' });
}

export async function listReports(userId: string, userRole?: string, type?: string) {
  await assertPolicePermission(userId, 'cases.view', userRole);
  const query: Record<string, unknown> = { deletedAt: null };
  if (type) query.reportType = type;
  return PoliceReport.find(query).sort({ createdAt: -1 }).limit(100);
}

export async function createReport(actorId: string, data: Partial<InstanceType<typeof PoliceReport>>, userRole?: string) {
  const permMap: Record<string, string> = { incident: 'reports.incident', crime: 'reports.crime', arrest: 'reports.arrest' };
  const perm = permMap[data.reportType ?? 'incident'] ?? 'reports.incident';
  await assertPolicePermission(actorId, perm as never, userRole);
  const officer = await requireOfficer(actorId);
  const report = await PoliceReport.create({
    reportId: id('RPT'),
    reportType: data.reportType ?? 'incident',
    title: data.title!,
    description: data.description!,
    officerId: officer.userId,
    officerBadge: officer.badgeNumber,
    location: data.location,
    district: data.district,
    involvedParties: data.involvedParties ?? [],
    suspectNames: data.suspectNames ?? [],
    status: 'filed',
    createdBy: new Types.ObjectId(actorId),
  });
  await logPoliceAction({ userId: actorId, actorId, action: 'report_create', resource: 'police_report', resourceId: report.reportId, officerBadge: officer.badgeNumber });
  return report;
}

export async function createCitation(actorId: string, data: {
  citationType?: 'citation' | 'warning';
  violatorName: string;
  violatorUserId?: string;
  plateNumber?: string;
  violationCode: string;
  description: string;
  location: string;
  district?: string;
}, userRole?: string) {
  const perm = data.citationType === 'warning' ? 'warnings.create' : 'citations.create';
  await assertPolicePermission(actorId, perm, userRole);
  const officer = await requireOfficer(actorId);
  const fineAmount = data.citationType === 'warning' ? 0 : calculateFine(data.violationCode);
  const jailDays = calculateJailDays(data.violationCode);
  const citation = await PoliceCitation.create({
    citationId: id('CIT'),
    citationType: data.citationType ?? 'citation',
    violatorName: data.violatorName,
    violatorUserId: data.violatorUserId ? new Types.ObjectId(data.violatorUserId) : undefined,
    plateNumber: data.plateNumber,
    violationCode: data.violationCode,
    description: data.description,
    fineAmount,
    jailDays,
    location: data.location,
    district: data.district,
    officerId: officer.userId,
    officerBadge: officer.badgeNumber,
    status: 'issued',
    createdBy: new Types.ObjectId(actorId),
  });
  await logPoliceAction({ userId: actorId, actorId, action: 'citation_create', resource: 'police_citation', resourceId: citation.citationId, officerBadge: officer.badgeNumber });
  return citation;
}

export async function listCases(userId: string, userRole?: string) {
  await assertPolicePermission(userId, 'cases.view', userRole);
  return PoliceCase.find({ deletedAt: null }).sort({ updatedAt: -1 }).limit(100);
}

export async function createCase(actorId: string, data: Partial<InstanceType<typeof PoliceCase>>, userRole?: string) {
  await assertPolicePermission(actorId, 'cases.manage', userRole);
  const officer = await requireOfficer(actorId);
  const caseDoc = await PoliceCase.create({
    caseId: id('CASE'),
    title: data.title!,
    description: data.description!,
    leadOfficerId: officer.userId,
    leadBadge: officer.badgeNumber,
    suspectNames: data.suspectNames ?? [],
    charges: data.charges ?? [],
    timeline: [{ at: new Date(), event: 'Case opened', officerBadge: officer.badgeNumber }],
    createdBy: new Types.ObjectId(actorId),
  });
  await broadcastPolice('police:case:update', { caseId: caseDoc.caseId, status: caseDoc.status });
  return caseDoc;
}

export async function listEvidence(userId: string, userRole?: string) {
  await assertPolicePermission(userId, 'evidence.view', userRole);
  return PoliceEvidence.find({ deletedAt: null }).sort({ createdAt: -1 }).limit(100);
}

export async function createEvidence(actorId: string, data: Partial<InstanceType<typeof PoliceEvidence>>, userRole?: string) {
  await assertPolicePermission(actorId, 'evidence.create', userRole);
  const officer = await requireOfficer(actorId);
  const evidence = await PoliceEvidence.create({
    evidenceId: id('EVD'),
    title: data.title!,
    description: data.description!,
    type: data.type ?? 'photo',
    caseId: data.caseId,
    reportId: data.reportId,
    fileUrl: data.fileUrl,
    lockerNumber: data.lockerNumber,
    collectedByOfficerId: officer.userId,
    collectedByBadge: officer.badgeNumber,
    chainOfCustody: [{ officerId: officer.userId, badge: officer.badgeNumber, action: 'collected', at: new Date() }],
    createdBy: new Types.ObjectId(actorId),
  });
  await broadcastPolice('police:evidence:new', { evidenceId: evidence.evidenceId, title: evidence.title });
  return evidence;
}

export async function performSearch(
  actorId: string,
  searchType: string,
  query: string,
  userRole?: string,
  meta?: { ipAddress?: string; deviceUuid?: string }
) {
  const permMap: Record<string, string> = {
    person: 'search.person', vehicle: 'search.vehicle', plate: 'search.plate',
    property: 'search.property', business: 'search.business', phone: 'search.phone',
    identity: 'search.identity', weapon: 'search.weapon',
  };
  await assertPolicePermission(actorId, permMap[searchType] as never, userRole);
  const officer = await requireOfficer(actorId);

  let results: unknown;
  switch (searchType) {
    case 'person': results = await searchPerson(query); break;
    case 'phone': results = await searchPhone(query); break;
    case 'plate': results = await searchPlate(query); break;
    case 'vehicle': results = await searchVehicle(query); break;
    case 'property': results = await searchProperty(query); break;
    case 'business': results = await searchBusiness(query); break;
    case 'identity': results = await searchIdentity(query); break;
    case 'weapon': results = await searchWeaponLicense(query); break;
    default: throw new Error('INVALID_SEARCH_TYPE');
  }

  const log = await PoliceSearchLog.create({
    searchId: id('SRC'),
    searchType,
    query,
    officerId: officer.userId,
    officerBadge: officer.badgeNumber,
    results: { data: results },
    resultCount: Array.isArray(results) ? results.length : 1,
    ipAddress: meta?.ipAddress,
    deviceUuid: meta?.deviceUuid,
    createdBy: new Types.ObjectId(actorId),
  });

  await logPoliceAction({
    userId: actorId, actorId, action: 'police_search', resource: 'police_search',
    resourceId: log.searchId, metadata: { searchType, query }, officerBadge: officer.badgeNumber,
    ipAddress: meta?.ipAddress, deviceUuid: meta?.deviceUuid,
  });

  return { searchId: log.searchId, searchType, query, results };
}

export async function triggerPanic(actorId: string, userRole?: string, meta?: { latitude?: number; longitude?: number; district?: string; deviceUuid?: string; ipAddress?: string }) {
  await assertPolicePermission(actorId, 'panic.trigger', userRole);
  const officer = await requireOfficer(actorId);
  officer.status = 'panic';
  await officer.save();

  const panic = await PolicePanicEvent.create({
    panicId: id('PANIC'),
    officerId: officer.userId,
    officerBadge: officer.badgeNumber,
    callsign: officer.callsign,
    latitude: meta?.latitude ?? officer.latitude,
    longitude: meta?.longitude ?? officer.longitude,
    district: meta?.district ?? officer.district,
    status: 'active',
    deviceUuid: meta?.deviceUuid,
    ipAddress: meta?.ipAddress,
    createdBy: new Types.ObjectId(actorId),
  });

  await broadcastPolice('police:panic', {
    panicId: panic.panicId,
    officerBadge: officer.badgeNumber,
    callsign: officer.callsign,
    latitude: panic.latitude,
    longitude: panic.longitude,
    district: panic.district,
  });

  await enqueueNotification({
    userId: actorId,
    title: 'OFFICER PANIC',
    body: `${officer.callsign ?? officer.badgeNumber} activated panic button`,
    priority: 'critical',
    appId: POLICE_APP_BUNDLE,
  });

  return panic;
}

export async function getAnalytics(userId: string, userRole?: string) {
  await assertPolicePermission(userId, 'analytics.view', userRole);
  const [dispatches, citations, reports, arrests] = await Promise.all([
    PoliceDispatch.countDocuments({ deletedAt: null }),
    PoliceCitation.countDocuments({ deletedAt: null }),
    PoliceReport.countDocuments({ deletedAt: null }),
    PoliceReport.countDocuments({ reportType: 'arrest', deletedAt: null }),
  ]);

  const byDistrict = await PoliceDispatch.aggregate([
    { $match: { deletedAt: null, district: { $exists: true } } },
    { $group: { _id: '$district', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);

  return {
    totals: { dispatches, citations, reports, arrests },
    heatMap: byDistrict.map((d) => ({ district: d._id, incidents: d.count })),
    crimeStats: {
      clearanceRate: reports > 0 ? Math.round((arrests / reports) * 100) : 0,
      avgResponseTime: '4.2 min',
    },
  };
}

export async function getRbacConfig(userId: string, userRole?: string) {
  await assertPolicePermission(userId, 'rbac.configure', userRole);
  const configs = await (await import('../database/models/PoliceRoleConfig')).PoliceRoleConfig.find();
  return configs.map((c) => ({ role: c.role, permissions: c.permissions }));
}

export async function setRbacConfig(actorId: string, role: PoliceRole, permissions: string[], userRole?: string) {
  await assertPolicePermission(actorId, 'rbac.configure', userRole);
  return updateRolePermissions(role, permissions as never, actorId);
}

export async function listGangs(userId: string, userRole?: string) {
  await assertPolicePermission(userId, 'gangs.view', userRole);
  return PoliceGang.find({ deletedAt: null });
}

export async function listOrganizations(userId: string, userRole?: string) {
  await assertPolicePermission(userId, 'organizations.view', userRole);
  return PoliceOrganization.find({ deletedAt: null });
}

export async function createNote(actorId: string, data: { content: string; subjectType?: string; subjectId?: string }, userRole?: string) {
  await assertPolicePermission(actorId, 'notes.create', userRole);
  const officer = await requireOfficer(actorId);
  return PoliceNote.create({
    noteId: id('NOTE'),
    officerId: officer.userId,
    officerBadge: officer.badgeNumber,
    content: data.content,
    subjectType: (data.subjectType as never) ?? 'general',
    subjectId: data.subjectId,
    createdBy: new Types.ObjectId(actorId),
  });
}

export async function trackTarget(actorId: string, params: Parameters<typeof createTrackingRequest>[2], userRole?: string) {
  await assertPolicePermission(actorId, 'gps.track', userRole);
  return createTrackingRequest(actorId, POLICE_APP_BUNDLE, params, userRole);
}

export async function getCitizenBank(userId: string, targetUserId: string, userRole?: string) {
  await assertPolicePermission(userId, 'fines.calculate', userRole);
  return getBankIntegration(targetUserId);
}

export async function getLiveGps(userId: string, targetUserId: string, userRole?: string) {
  await assertPolicePermission(userId, 'gps.live', userRole);
  return getWorldLocation(targetUserId);
}

export { getRolePermissions, updateRolePermissions, seedPoliceRoleConfigs };
