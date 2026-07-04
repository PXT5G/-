import { v4 as uuidv4 } from 'uuid';
import { Types } from 'mongoose';
import { User } from '../database/models/User';
import { WorldState } from '../database/models/WorldState';
import { Carrier } from '../database/models/Carrier';
import { NetworkState } from '../database/models/NetworkState';
import { DeviceProfile } from '../database/models/DeviceProfile';
import { PoliceCase } from '../database/models/PoliceCase';
import { PoliceWarrant } from '../database/models/PoliceWarrant';
import { PoliceReport } from '../database/models/PoliceReport';
import { PoliceCitation } from '../database/models/PoliceCitation';
import { PoliceEvidence } from '../database/models/PoliceEvidence';
import { JusticeCase } from '../database/models/JusticeCase';
import { JusticeEvidence } from '../database/models/JusticeEvidence';
import { JusticeDutyLog } from '../database/models/JusticeDutyLog';
import { logAudit } from './auditService';
import {
  searchIdentity,
  searchPhone,
  searchPlate,
  searchVehicle,
  searchProperty,
  searchBusiness,
  searchWeaponLicense,
  getBankIntegration,
  getWorldLocation,
} from './policeIntegrationService';

export async function logJusticeAction(params: {
  userId: string;
  actorId: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  deviceUuid?: string;
  employeeId?: string;
  signatureHash?: string;
}) {
  await logAudit({
    userId: params.userId,
    actorId: params.actorId,
    action: params.action,
    resource: params.resource,
    resourceId: params.resourceId,
    metadata: {
      ...params.metadata,
      deviceUuid: params.deviceUuid,
      employeeId: params.employeeId,
      signatureHash: params.signatureHash,
    },
    ipAddress: params.ipAddress,
  });

  if (params.employeeId) {
    await JusticeDutyLog.create({
      logId: `LOG-${uuidv4().slice(0, 8).toUpperCase()}`,
      officialId: new Types.ObjectId(params.actorId),
      employeeId: params.employeeId,
      action: params.action,
      details: params.resourceId ?? params.resource,
      resourceType: params.resource,
      resourceId: params.resourceId,
      deviceUuid: params.deviceUuid,
      ipAddress: params.ipAddress,
      signatureHash: params.signatureHash,
      createdBy: new Types.ObjectId(params.actorId),
    });
  }
}

export async function searchCitizen(query: string) {
  return searchIdentity(query);
}

export async function searchCaseNumber(query: string) {
  const cases = await JusticeCase.find({
    $or: [
      { caseNumber: new RegExp(query, 'i') },
      { caseId: new RegExp(query, 'i') },
      { defendantName: new RegExp(query, 'i') },
      { title: new RegExp(query, 'i') },
    ],
    deletedAt: null,
  }).limit(20);

  return cases.map((c) => ({
    caseId: c.caseId,
    caseNumber: c.caseNumber,
    title: c.title,
    status: c.status,
    defendantName: c.defendantName,
    policeCaseId: c.policeCaseId,
    judgeEmployeeId: c.judgeEmployeeId,
    filedAt: c.filedAt.toISOString(),
  }));
}

export async function searchJusticeEvidence(query: string) {
  const evidence = await JusticeEvidence.find({
    $or: [
      { evidenceId: new RegExp(query, 'i') },
      { title: new RegExp(query, 'i') },
      { caseNumber: new RegExp(query, 'i') },
    ],
    deletedAt: null,
  }).limit(20);

  const policeEvidence = await PoliceEvidence.find({
    $or: [
      { evidenceId: new RegExp(query, 'i') },
      { title: new RegExp(query, 'i') },
    ],
    deletedAt: null,
  }).limit(10);

  return {
    courtEvidence: evidence.map((e) => ({
      evidenceId: e.evidenceId,
      title: e.title,
      type: e.type,
      caseNumber: e.caseNumber,
      admitted: e.admitted,
    })),
    policeEvidence: policeEvidence.map((e) => ({
      evidenceId: e.evidenceId,
      title: e.title,
      type: e.type,
      caseId: e.caseId,
      lockerNumber: e.lockerNumber,
    })),
  };
}

export async function searchPoliceReports(query: string) {
  const reports = await PoliceReport.find({
    $or: [
      { reportId: new RegExp(query, 'i') },
      { title: new RegExp(query, 'i') },
      { suspectNames: new RegExp(query, 'i') },
    ],
    deletedAt: null,
  }).limit(20);

  return reports.map((r) => ({
    reportId: r.reportId,
    reportType: r.reportType,
    title: r.title,
    status: r.status,
    suspectNames: r.suspectNames,
    officerBadge: r.officerBadge,
    district: r.district,
    createdAt: (r as unknown as { createdAt: Date }).createdAt?.toISOString(),
  }));
}

export async function searchBankRecords(userId: string) {
  return getBankIntegration(userId);
}

export async function getPendingPoliceCases() {
  return PoliceCase.find({ status: 'pending_court', deletedAt: null }).sort({ updatedAt: -1 }).limit(50);
}

export async function getPendingWarrants() {
  const activeWarrants = await PoliceWarrant.find({
    status: 'active',
    deletedAt: null,
    $or: [{ judgeName: { $exists: false } }, { judgeName: '' }, { judgeName: null }],
  }).sort({ createdAt: -1 }).limit(50);

  return activeWarrants;
}

export async function getContestedCitations() {
  return PoliceCitation.find({ status: 'contested', deletedAt: null }).sort({ updatedAt: -1 }).limit(50);
}

export async function syncPoliceWarrantReview(policeWarrantId: string, judgeName: string, approved: boolean) {
  const warrant = await PoliceWarrant.findOne({ warrantId: policeWarrantId, deletedAt: null });
  if (!warrant) return null;

  if (approved) {
    warrant.judgeName = judgeName;
    warrant.status = 'active';
  } else {
    warrant.status = 'revoked';
  }
  await warrant.save();
  return warrant;
}

export async function getCommunicationLogs(userId: string) {
  const user = await User.findById(userId);
  if (!user) return { found: false, logs: [] };

  const { Conversation } = await import('../database/models/Conversation');
  const { Message } = await import('../database/models/Message');

  const conversations = await Conversation.find({
    participantIds: user._id,
    deletedAt: null,
  }).limit(10);

  const logs = await Promise.all(conversations.map(async (conv) => {
    const messages = await Message.find({ conversationId: conv._id, deletedAt: null })
      .sort({ createdAt: -1 }).limit(5);
    return {
      conversationId: conv._id.toString(),
      type: conv.type,
      title: conv.title,
      messageCount: messages.length,
      recentMessages: messages.map((m) => ({
        messageId: m.messageId,
        type: m.messageType,
        preview: m.body?.slice(0, 100),
        sentAt: m.createdAt.toISOString(),
      })),
    };
  }));

  return { found: true, userId, displayName: user.displayName, logs };
}

export async function getGpsRecord(userId: string) {
  return getWorldLocation(userId);
}

export async function getPhoneRecord(phone: string) {
  return searchPhone(phone);
}

export { searchIdentity, searchPhone, searchPlate, searchVehicle, searchProperty, searchBusiness, searchWeaponLicense };
