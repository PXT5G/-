import { Types } from 'mongoose';
import { PoliceOfficer, IPoliceOfficer, generateBadgeNumber } from '../database/models/PoliceOfficer';
import { PolicePermission, PolicePermissionName, RANK_PERMISSIONS, PoliceRank } from '../database/models/PolicePermission';
import { PoliceAuditLog } from '../database/models/PoliceAuditLog';
import { PoliceRankHistory } from '../database/models/PoliceRankHistory';
import { PoliceCase, IPoliceCase, generateCaseNumber } from '../database/models/PoliceCase';
import { PoliceReport, IPoliceReport, generateReportNumber } from '../database/models/PoliceReport';
import { PoliceEvidence, IPoliceEvidence } from '../database/models/PoliceEvidence';
import { PoliceDispatch, IPoliceDispatch, generateDispatchNumber } from '../database/models/PoliceDispatch';
import { PoliceVehicle, IPoliceVehicle } from '../database/models/PoliceVehicle';
import { PoliceProperty, IPoliceProperty } from '../database/models/PoliceProperty';
import { PoliceChatMessage, POLICE_CHANNELS } from '../database/models/PoliceChatMessage';
import { Identity } from '../database/models/Identity';
import { Contact } from '../database/models/Contact';
import { PhoneNumber } from '../database/models/PhoneNumber';
import { User } from '../database/models/User';
import {
  auditService,
  eventBusService,
  notificationService,
  permissionEngineService,
  BANANAOS_APP_IDS,
} from '../platform';

const POLICE_APP_ID = BANANAOS_APP_IDS.POLICE;

const RANK_ORDER: PoliceRank[] = ['cadet', 'officer', 'sergeant', 'lieutenant', 'captain', 'chief'];

export interface AuditContext {
  performedBy: string;
  performedByRole: string;
  permission: PolicePermissionName;
  deviceId?: string;
  ipAddress?: string;
  reason?: string;
}

export async function hasPermission(userId: string, permission: PolicePermissionName, userRole: 'user' | 'admin'): Promise<boolean> {
  const result = await permissionEngineService.hasPermission(POLICE_APP_ID, userId, permission, userRole);
  return result.granted;
}

export async function requirePermission(userId: string, permission: PolicePermissionName, userRole: 'user' | 'admin'): Promise<void> {
  const allowed = await hasPermission(userId, permission, userRole);
  if (!allowed) throw new Error(`Permission denied: ${permission}`);
}

export async function grantRankPermissions(userId: string, rank: PoliceRank, grantedBy: string): Promise<void> {
  const perms = RANK_PERMISSIONS[rank] ?? RANK_PERMISSIONS.officer;
  await permissionEngineService.grantPermissions(POLICE_APP_ID, userId, perms, grantedBy, { rank });
}

export async function logPoliceAudit(
  targetUserId: string,
  action: string,
  entityType: string,
  ctx: AuditContext,
  options?: { entityId?: string; officerId?: string; query?: string; oldValue?: string; newValue?: string; reason?: string }
): Promise<void> {
  await auditService.log({
    appId: POLICE_APP_ID,
    userId: targetUserId,
    action,
    entityType,
    entityId: options?.entityId,
    ctx,
    query: options?.query,
    oldValue: options?.oldValue,
    newValue: options?.newValue,
    reason: options?.reason,
    metadata: options?.officerId ? { officerId: options.officerId } : undefined,
  });

  await PoliceAuditLog.create({
    userId: targetUserId,
    officerId: options?.officerId ? new Types.ObjectId(options.officerId) : undefined,
    action,
    entityType,
    entityId: options?.entityId ? new Types.ObjectId(options.entityId) : undefined,
    performedBy: new Types.ObjectId(ctx.performedBy),
    performedByRole: ctx.performedByRole,
    permission: ctx.permission,
    deviceId: ctx.deviceId,
    ipAddress: ctx.ipAddress,
    query: options?.query,
    oldValue: options?.oldValue,
    newValue: options?.newValue,
    reason: options?.reason ?? ctx.reason,
  });
}

async function notify(userId: string, title: string, body: string, priority: 'low' | 'normal' | 'high' | 'critical' = 'normal'): Promise<void> {
  await notificationService.send({ userId, appId: POLICE_APP_ID, title, body, priority });
}

export async function getOfficerByUserId(userId: string): Promise<IPoliceOfficer | null> {
  return PoliceOfficer.findOne({ userId });
}

export async function provisionOfficer(userId: string, data: { firstName: string; lastName: string; rank?: PoliceRank }, ctx: AuditContext): Promise<IPoliceOfficer> {
  const existing = await PoliceOfficer.findOne({ userId });
  if (existing) return existing;

  const badgeNumber = generateBadgeNumber();
  const rank = data.rank ?? 'officer';
  const officer = await PoliceOfficer.create({
    userId,
    badgeNumber,
    firstName: data.firstName,
    lastName: data.lastName,
    fullName: `${data.firstName} ${data.lastName}`.trim(),
    rank,
    unit: 'Patrol',
    points: 0,
    status: 'off_duty',
    isOnline: true,
    lastActiveAt: new Date(),
    createdBy: ctx.performedBy,
    updatedBy: ctx.performedBy,
  });

  await grantRankPermissions(userId, rank, ctx.performedBy);
  await logPoliceAudit(userId, 'officer_provisioned', 'PoliceOfficer', ctx, { entityId: officer._id.toString(), officerId: officer._id.toString(), newValue: badgeNumber });
  eventBusService.emitToUser(userId, 'police:officer:provisioned', { officerId: officer._id.toString(), badgeNumber });
  await notify(userId, 'Welcome Officer', `Badge ${badgeNumber} assigned. Stay safe.`, 'high');
  return officer;
}

export async function getDashboard(userId: string) {
  const officer = await getOfficerByUserId(userId);
  const [officersOnline, activeCases, activeDispatches, pendingReports, alerts] = await Promise.all([
    PoliceOfficer.countDocuments({ isOnline: true, status: { $in: ['on_duty', 'en_route', 'on_scene'] } }),
    PoliceCase.countDocuments({ status: { $in: ['open', 'assigned', 'investigating'] } }),
    PoliceDispatch.countDocuments({ status: { $in: ['pending', 'assigned', 'en_route', 'on_scene'] } }),
    PoliceReport.countDocuments({ status: { $in: ['submitted', 'under_review'] } }),
    PoliceDispatch.find({ status: { $in: ['pending', 'assigned'] }, priority: 1 }).limit(5).lean(),
  ]);

  return {
    officer: officer ? formatOfficer(officer) : null,
    officersOnline,
    activeCases,
    activeDispatches,
    pendingReports,
    priorityAlerts: alerts.map(formatDispatch),
  };
}

export async function mdtSearchPersons(query: string, userId: string, ctx: AuditContext) {
  await requirePermission(userId, 'access_mdt', ctx.performedByRole as 'user' | 'admin');
  const regex = new RegExp(query.trim(), 'i');
  const limit = 20;

  const [identities, contacts] = await Promise.all([
    Identity.find({ $or: [{ fullName: regex }, { nationalId: regex }, { username: regex }] }).limit(limit).lean(),
    Contact.find({ $or: [{ fullName: regex }, { identityNumber: regex }, { 'phoneNumbers.number': regex }] }).limit(limit).lean(),
  ]);

  await logPoliceAudit(userId, 'mdt_person_search', 'MDT', ctx, { query, newValue: `${identities.length + contacts.length} results` });

  return {
    identities: identities.map((i) => ({
      source: 'identity',
      fullName: i.fullName,
      nationalId: i.nationalId,
      username: i.username,
      status: i.status,
      verified: i.verified,
    })),
    contacts: contacts.map((c) => ({
      source: 'contacts',
      id: c._id.toString(),
      fullName: c.fullName,
      identityNumber: c.identityNumber,
      phoneNumbers: c.phoneNumbers,
    })),
  };
}

export async function mdtSearchVehicles(query: string, userId: string, ctx: AuditContext) {
  await requirePermission(userId, 'access_mdt', ctx.performedByRole as 'user' | 'admin');
  const regex = new RegExp(query.trim(), 'i');
  const vehicles = await PoliceVehicle.find({
    $or: [{ plateNumber: regex }, { ownerName: regex }, { ownerIdentityNumber: regex }],
  }).limit(20).lean();

  await logPoliceAudit(userId, 'mdt_vehicle_search', 'MDT', ctx, { query, newValue: `${vehicles.length} results` });
  return vehicles.map(formatVehicle);
}

export async function mdtSearchProperties(query: string, userId: string, ctx: AuditContext) {
  await requirePermission(userId, 'access_mdt', ctx.performedByRole as 'user' | 'admin');
  const regex = new RegExp(query.trim(), 'i');
  const properties = await PoliceProperty.find({
    $or: [{ address: regex }, { ownerName: regex }, { propertyId: regex }],
  }).limit(20).lean();

  await logPoliceAudit(userId, 'mdt_property_search', 'MDT', ctx, { query, newValue: `${properties.length} results` });
  return properties.map(formatProperty);
}

export async function mdtCaseLookup(query: string, userId: string, ctx: AuditContext) {
  await requirePermission(userId, 'access_mdt', ctx.performedByRole as 'user' | 'admin');
  const regex = new RegExp(query.trim(), 'i');
  const cases = await PoliceCase.find({
    $or: [{ caseNumber: regex }, { title: regex }, { involvedParties: regex }],
  }).limit(20).lean();

  await logPoliceAudit(userId, 'mdt_case_lookup', 'MDT', ctx, { query, newValue: `${cases.length} results` });
  return cases.map(formatCase);
}

export async function getAuditLogs(userId: string, limit = 50) {
  const logs = await PoliceAuditLog.find().sort({ createdAt: -1 }).limit(Math.min(limit, 100)).lean();
  return logs.map((l) => ({
    id: l._id.toString(),
    action: l.action,
    entityType: l.entityType,
    query: l.query,
    permission: l.permission,
    ipAddress: l.ipAddress,
    createdAt: l.createdAt.toISOString(),
  }));
}

// Reports
export async function createReport(userId: string, officerId: string, data: Partial<IPoliceReport>, ctx: AuditContext) {
  await requirePermission(userId, 'create_report', ctx.performedByRole as 'user' | 'admin');
  const report = await PoliceReport.create({
    reportNumber: generateReportNumber(),
    officerId,
    userId,
    type: data.type ?? 'incident',
    title: data.title!,
    description: data.description!,
    location: data.location!,
    involvedParties: data.involvedParties ?? [],
    caseId: data.caseId,
    status: 'submitted',
    createdBy: ctx.performedBy,
    updatedBy: ctx.performedBy,
  });
  await logPoliceAudit(userId, 'report_created', 'PoliceReport', ctx, { entityId: report._id.toString(), newValue: report.reportNumber });
  eventBusService.emitToUser(userId, 'police:report:created', { reportId: report._id.toString() });
  return report;
}

export async function listReports(userId: string, page = 0, limit = 20) {
  const reports = await PoliceReport.find().sort({ createdAt: -1 }).skip(page * limit).limit(limit).lean();
  return reports.map(formatReport);
}

export async function reviewReport(userId: string, reportId: string, approve: boolean, note: string | undefined, ctx: AuditContext) {
  await requirePermission(userId, 'approve_report', ctx.performedByRole as 'user' | 'admin');
  const report = await PoliceReport.findById(reportId);
  if (!report) throw new Error('Report not found');
  report.status = approve ? 'approved' : 'rejected';
  report.reviewNote = note;
  report.reviewedBy = new Types.ObjectId(ctx.performedBy);
  report.reviewedAt = new Date();
  report.updatedBy = new Types.ObjectId(ctx.performedBy);
  await report.save();
  await logPoliceAudit(userId, approve ? 'report_approved' : 'report_rejected', 'PoliceReport', ctx, { entityId: reportId, reason: note });
  eventBusService.emitToUser(report.userId.toString(), 'police:report:reviewed', { reportId, status: report.status });
  return report;
}

// Rankings
export async function addPoints(userId: string, officerId: string, points: number, reason: string, ctx: AuditContext) {
  await requirePermission(userId, 'manage_rankings', ctx.performedByRole as 'user' | 'admin');
  const officer = await PoliceOfficer.findById(officerId);
  if (!officer) throw new Error('Officer not found');
  const oldPoints = officer.points;
  officer.points += points;
  officer.updatedBy = new Types.ObjectId(ctx.performedBy);
  await officer.save();
  await logPoliceAudit(officer.userId.toString(), 'points_awarded', 'PoliceOfficer', ctx, { entityId: officerId, oldValue: String(oldPoints), newValue: String(officer.points), reason });
  return officer;
}

export async function promoteOfficer(userId: string, officerId: string, newRank: PoliceRank, reason: string, ctx: AuditContext) {
  await requirePermission(userId, 'manage_rankings', ctx.performedByRole as 'user' | 'admin');
  const officer = await PoliceOfficer.findById(officerId);
  if (!officer) throw new Error('Officer not found');
  const oldRank = officer.rank;
  officer.rank = newRank;
  officer.updatedBy = new Types.ObjectId(ctx.performedBy);
  await officer.save();
  await PoliceRankHistory.create({
    officerId: officer._id,
    userId: officer.userId,
    previousRank: oldRank,
    newRank,
    reason,
    performedBy: ctx.performedBy,
  });
  await grantRankPermissions(officer.userId.toString(), newRank, ctx.performedBy);
  await logPoliceAudit(officer.userId.toString(), 'officer_promoted', 'PoliceOfficer', ctx, { entityId: officerId, oldValue: oldRank, newValue: newRank, reason });
  eventBusService.emitToUser(officer.userId.toString(), 'police:rank:changed', { rank: newRank });
  return officer;
}

export async function getRankHistory(officerId: string, limit = 20) {
  const history = await PoliceRankHistory.find({ officerId }).sort({ createdAt: -1 }).limit(limit).lean();
  return history.map((h) => ({
    id: h._id.toString(),
    previousRank: h.previousRank,
    newRank: h.newRank,
    pointsChange: h.pointsChange,
    reason: h.reason,
    createdAt: h.createdAt.toISOString(),
  }));
}

// Officers
export async function listOfficers(page = 0, limit = 20) {
  const officers = await PoliceOfficer.find().sort({ rank: -1, points: -1 }).skip(page * limit).limit(limit).lean();
  return officers.map(formatOfficer);
}

export async function updateOfficerStatus(userId: string, officerId: string, status: IPoliceOfficer['status'], ctx: AuditContext) {
  const officer = await PoliceOfficer.findById(officerId);
  if (!officer) throw new Error('Officer not found');
  if (officer.userId.toString() !== userId && !(await hasPermission(userId, 'manage_officers', ctx.performedByRole as 'user' | 'admin'))) {
    throw new Error('Permission denied');
  }
  const oldStatus = officer.status;
  officer.status = status;
  officer.isOnline = status !== 'off_duty';
  officer.lastActiveAt = new Date();
  officer.updatedBy = new Types.ObjectId(ctx.performedBy);
  await officer.save();
  await logPoliceAudit(officer.userId.toString(), 'officer_status_changed', 'PoliceOfficer', ctx, { entityId: officerId, oldValue: oldStatus, newValue: status });
  eventBusService.emitToUser(officer.userId.toString(), 'police:officer:status', { status });
  return officer;
}

// Dispatch
export async function createDispatch(userId: string, data: Partial<IPoliceDispatch>, ctx: AuditContext) {
  await requirePermission(userId, 'manage_dispatch', ctx.performedByRole as 'user' | 'admin');
  const dispatch = await PoliceDispatch.create({
    dispatchNumber: generateDispatchNumber(),
    priority: data.priority ?? 2,
    type: data.type!,
    description: data.description!,
    location: data.location!,
    assignedOfficerIds: data.assignedOfficerIds ?? [],
    assignedUnit: data.assignedUnit,
    status: 'pending',
    createdBy: ctx.performedBy,
    updatedBy: ctx.performedBy,
  });
  await logPoliceAudit(userId, 'dispatch_created', 'PoliceDispatch', ctx, { entityId: dispatch._id.toString(), newValue: dispatch.dispatchNumber });
  eventBusService.emitToUser(userId, 'police:dispatch:created', { dispatchId: dispatch._id.toString() });
  return dispatch;
}

export async function listDispatches(status?: string, page = 0, limit = 20) {
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  else filter.status = { $in: ['pending', 'assigned', 'en_route', 'on_scene'] };
  const dispatches = await PoliceDispatch.find(filter).sort({ priority: 1, createdAt: -1 }).skip(page * limit).limit(limit).lean();
  return dispatches.map(formatDispatch);
}

export async function assignDispatch(userId: string, dispatchId: string, officerIds: string[], ctx: AuditContext) {
  await requirePermission(userId, 'manage_dispatch', ctx.performedByRole as 'user' | 'admin');
  const dispatch = await PoliceDispatch.findById(dispatchId);
  if (!dispatch) throw new Error('Dispatch not found');
  dispatch.assignedOfficerIds = officerIds.map((id) => new Types.ObjectId(id));
  dispatch.status = 'assigned';
  dispatch.updatedBy = new Types.ObjectId(ctx.performedBy);
  await dispatch.save();
  await logPoliceAudit(userId, 'dispatch_assigned', 'PoliceDispatch', ctx, { entityId: dispatchId, newValue: officerIds.join(',') });
  for (const oid of officerIds) {
    const officer = await PoliceOfficer.findById(oid);
    if (officer) eventBusService.emitToUser(officer.userId.toString(), 'police:dispatch:assigned', { dispatchId });
  }
  return dispatch;
}

export async function updateDispatchStatus(userId: string, dispatchId: string, status: IPoliceDispatch['status'], ctx: AuditContext) {
  const dispatch = await PoliceDispatch.findById(dispatchId);
  if (!dispatch) throw new Error('Dispatch not found');
  const oldStatus = dispatch.status;
  dispatch.status = status;
  if (status === 'resolved') dispatch.resolvedAt = new Date();
  dispatch.updatedBy = new Types.ObjectId(ctx.performedBy);
  await dispatch.save();
  await logPoliceAudit(userId, 'dispatch_status_updated', 'PoliceDispatch', ctx, { entityId: dispatchId, oldValue: oldStatus, newValue: status });
  eventBusService.emitToUser(userId, 'police:dispatch:updated', { dispatchId, status });
  return dispatch;
}

// Cases
export async function createCase(userId: string, data: Partial<IPoliceCase>, ctx: AuditContext) {
  await requirePermission(userId, 'manage_cases', ctx.performedByRole as 'user' | 'admin');
  const policeCase = await PoliceCase.create({
    caseNumber: generateCaseNumber(),
    title: data.title!,
    description: data.description!,
    priority: data.priority ?? 2,
    involvedParties: data.involvedParties ?? [],
    location: data.location,
    status: 'open',
    createdBy: ctx.performedBy,
    updatedBy: ctx.performedBy,
  });
  await logPoliceAudit(userId, 'case_created', 'PoliceCase', ctx, { entityId: policeCase._id.toString(), newValue: policeCase.caseNumber });
  eventBusService.emitToUser(userId, 'police:case:created', { caseId: policeCase._id.toString() });
  return policeCase;
}

export async function listCases(page = 0, limit = 20, status?: string) {
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  const cases = await PoliceCase.find(filter).sort({ createdAt: -1 }).skip(page * limit).limit(limit).lean();
  return cases.map(formatCase);
}

export async function assignCase(userId: string, caseId: string, officerIds: string[], leadOfficerId: string | undefined, ctx: AuditContext) {
  await requirePermission(userId, 'manage_cases', ctx.performedByRole as 'user' | 'admin');
  const policeCase = await PoliceCase.findById(caseId);
  if (!policeCase) throw new Error('Case not found');
  policeCase.assignedOfficerIds = officerIds.map((id) => new Types.ObjectId(id));
  policeCase.leadOfficerId = leadOfficerId ? new Types.ObjectId(leadOfficerId) : undefined;
  policeCase.status = 'assigned';
  policeCase.updatedBy = new Types.ObjectId(ctx.performedBy);
  await policeCase.save();
  await logPoliceAudit(userId, 'case_assigned', 'PoliceCase', ctx, { entityId: caseId, newValue: officerIds.join(',') });
  return policeCase;
}

export async function getCaseEvidence(caseId: string) {
  const evidence = await PoliceEvidence.find({ caseId }).sort({ createdAt: -1 }).limit(50).lean();
  return evidence.map(formatEvidence);
}

export async function addEvidence(userId: string, data: Partial<IPoliceEvidence>, officerId: string, ctx: AuditContext) {
  await requirePermission(userId, 'manage_evidence', ctx.performedByRole as 'user' | 'admin');
  const evidence = await PoliceEvidence.create({
    caseId: data.caseId,
    reportId: data.reportId,
    title: data.title!,
    description: data.description,
    type: data.type ?? 'document',
    fileUrl: data.fileUrl,
    collectedBy: officerId,
    chainOfCustody: [{ officerId: new Types.ObjectId(officerId), action: 'collected', timestamp: new Date() }],
    createdBy: ctx.performedBy,
    updatedBy: ctx.performedBy,
  });
  await logPoliceAudit(userId, 'evidence_added', 'PoliceEvidence', ctx, { entityId: evidence._id.toString(), newValue: data.title });
  return evidence;
}

// Vehicles
export async function registerVehicle(userId: string, data: Partial<IPoliceVehicle>, ctx: AuditContext) {
  await requirePermission(userId, 'manage_vehicles', ctx.performedByRole as 'user' | 'admin');
  const vehicle = await PoliceVehicle.create({
    plateNumber: data.plateNumber!.toUpperCase(),
    make: data.make!,
    vehicleModel: data.vehicleModel ?? (data as { model?: string }).model!,
    year: data.year!,
    color: data.color!,
    ownerName: data.ownerName!,
    ownerIdentityNumber: data.ownerIdentityNumber,
    ownerPhone: data.ownerPhone,
    history: [{ action: 'registered', timestamp: new Date() }],
    createdBy: ctx.performedBy,
    updatedBy: ctx.performedBy,
  });
  await logPoliceAudit(userId, 'vehicle_registered', 'PoliceVehicle', ctx, { entityId: vehicle._id.toString(), newValue: vehicle.plateNumber });
  return vehicle;
}

export async function searchVehicles(query: string, page = 0, limit = 20) {
  const regex = new RegExp(query.trim(), 'i');
  const vehicles = await PoliceVehicle.find({
    $or: [{ plateNumber: regex }, { ownerName: regex }],
  }).skip(page * limit).limit(limit).lean();
  return vehicles.map(formatVehicle);
}

// Chat
const RANK_LEVEL: Record<PoliceRank, number> = { cadet: 0, officer: 1, sergeant: 2, lieutenant: 3, captain: 4, chief: 5 };

export async function sendChatMessage(userId: string, officerId: string, channel: string, message: string, ctx: AuditContext) {
  await requirePermission(userId, 'internal_chat', ctx.performedByRole as 'user' | 'admin');
  const officer = await PoliceOfficer.findById(officerId);
  if (!officer) throw new Error('Officer not found');
  if (!POLICE_CHANNELS.includes(channel as typeof POLICE_CHANNELS[number])) throw new Error('Invalid channel');

  const minRank: PoliceRank = channel === 'command' ? 'lieutenant' : channel === 'investigations' ? 'sergeant' : 'officer';
  if (RANK_LEVEL[officer.rank] < RANK_LEVEL[minRank]) throw new Error('Insufficient rank for channel');

  const msg = await PoliceChatMessage.create({
    channel,
    minRank,
    senderOfficerId: officerId,
    senderUserId: userId,
    senderName: officer.fullName,
    message,
    encrypted: true,
  });
  await logPoliceAudit(userId, 'chat_message_sent', 'PoliceChat', ctx, { query: channel, newValue: message.slice(0, 50) });
  eventBusService.emitToUser(userId, 'police:chat:message', { channel, messageId: msg._id.toString() });
  return msg;
}

export async function getChatMessages(channel: string, page = 0, limit = 50) {
  const messages = await PoliceChatMessage.find({ channel })
    .sort({ createdAt: -1 })
    .skip(page * limit)
    .limit(limit)
    .lean();
  return messages.reverse().map((m) => ({
    id: m._id.toString(),
    channel: m.channel,
    senderName: m.senderName,
    message: m.message,
    createdAt: m.createdAt.toISOString(),
  }));
}

// Seed department data
export async function seedDepartmentData(userId: string, ctx: AuditContext): Promise<void> {
  const count = await PoliceVehicle.countDocuments();
  if (count > 0) return;

  await PoliceVehicle.create([
    { plateNumber: 'BNA-4521', make: 'Tesla', vehicleModel: 'Model 3', year: 2024, color: 'White', ownerName: 'John Smith', ownerIdentityNumber: 'BNA-ID-001', createdBy: ctx.performedBy, updatedBy: ctx.performedBy, history: [{ action: 'seeded', timestamp: new Date() }] },
    { plateNumber: 'BNA-8899', make: 'Ford', vehicleModel: 'Explorer', year: 2023, color: 'Black', ownerName: 'Jane Doe', status: 'flagged', createdBy: ctx.performedBy, updatedBy: ctx.performedBy, history: [{ action: 'seeded', timestamp: new Date() }] },
  ]);

  await PoliceProperty.create([
    { propertyId: 'PROP-1001', address: '100 Banana Blvd, Banana City', ownerName: 'John Smith', type: 'residential', createdBy: ctx.performedBy, updatedBy: ctx.performedBy },
    { propertyId: 'PROP-2002', address: '500 Commerce St, Banana City', ownerName: 'Acme Corp', type: 'commercial', status: 'under_surveillance', createdBy: ctx.performedBy, updatedBy: ctx.performedBy },
  ]);

  await logPoliceAudit(userId, 'department_data_seeded', 'Police', ctx, { newValue: 'vehicles+properties' });
}

// Formatters
export function formatOfficer(o: IPoliceOfficer | Record<string, unknown>) {
  const doc = o as IPoliceOfficer;
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    badgeNumber: doc.badgeNumber,
    fullName: doc.fullName,
    firstName: doc.firstName,
    lastName: doc.lastName,
    rank: doc.rank,
    unit: doc.unit,
    points: doc.points,
    status: doc.status,
    isOnline: doc.isOnline,
    location: doc.location,
    lastActiveAt: doc.lastActiveAt?.toISOString(),
  };
}

function formatCase(c: IPoliceCase | Record<string, unknown>) {
  const doc = c as IPoliceCase;
  return {
    id: doc._id.toString(),
    caseNumber: doc.caseNumber,
    title: doc.title,
    description: doc.description,
    status: doc.status,
    priority: doc.priority,
    location: doc.location,
    involvedParties: doc.involvedParties,
    assignedOfficerIds: doc.assignedOfficerIds?.map((id) => id.toString()) ?? [],
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : undefined,
  };
}

function formatReport(r: IPoliceReport | Record<string, unknown>) {
  const doc = r as IPoliceReport;
  return {
    id: doc._id.toString(),
    reportNumber: doc.reportNumber,
    type: doc.type,
    title: doc.title,
    description: doc.description,
    location: doc.location,
    status: doc.status,
    reviewNote: doc.reviewNote,
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : undefined,
  };
}

function formatDispatch(d: IPoliceDispatch | Record<string, unknown>) {
  const doc = d as IPoliceDispatch;
  const loc = doc.location;
  const locationStr = typeof loc === 'object' && loc?.address ? loc.address : String(loc ?? '');
  return {
    id: doc._id.toString(),
    dispatchNumber: doc.dispatchNumber,
    priority: doc.priority,
    type: doc.type,
    description: doc.description,
    location: locationStr,
    status: doc.status,
    assignedOfficerIds: doc.assignedOfficerIds?.map((id) => id.toString()) ?? [],
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : undefined,
  };
}

function formatVehicle(v: IPoliceVehicle | Record<string, unknown>) {
  const doc = v as IPoliceVehicle;
  return {
    id: doc._id.toString(),
    plateNumber: doc.plateNumber,
    make: doc.make,
    model: doc.vehicleModel,
    year: doc.year,
    color: doc.color,
    ownerName: doc.ownerName,
    ownerIdentityNumber: doc.ownerIdentityNumber,
    status: doc.status,
  };
}

function formatProperty(p: IPoliceProperty | Record<string, unknown>) {
  const doc = p as IPoliceProperty;
  return {
    id: doc._id.toString(),
    propertyId: doc.propertyId,
    address: doc.address,
    ownerName: doc.ownerName,
    type: doc.type,
    status: doc.status,
  };
}

function formatEvidence(e: IPoliceEvidence | Record<string, unknown>) {
  const doc = e as IPoliceEvidence;
  return {
    id: doc._id.toString(),
    title: doc.title,
    type: doc.type,
    description: doc.description,
    fileUrl: doc.fileUrl,
    caseId: doc.caseId?.toString(),
    reportId: doc.reportId?.toString(),
    createdAt: doc.createdAt?.toISOString?.(),
  };
}

export async function getAdminStats() {
  const [officers, cases, dispatches, reports, audits] = await Promise.all([
    PoliceOfficer.countDocuments(),
    PoliceCase.countDocuments(),
    PoliceDispatch.countDocuments(),
    PoliceReport.countDocuments(),
    PoliceAuditLog.countDocuments(),
  ]);
  return { officers, cases, dispatches, reports, auditLogCount: audits };
}
