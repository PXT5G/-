import { v4 as uuidv4 } from 'uuid';
import { Types } from 'mongoose';
import { PhoneCall } from '../database/models/PhoneCall';
import { BlockedNumber } from '../database/models/BlockedNumber';
import {
  PHONE_APP_BUNDLE,
  PHONE_SOCKET_EVENTS,
  EMERGENCY_NUMBERS,
  type CallStatus,
  type AudioRoute,
} from '../constants/telephony';
import { checkPermission } from './permissionBrokerService';
import { emitToUser } from './socketService';
import { logAudit } from './auditService';
import { createLiveActivity, endLiveActivity } from './liveActivityService';
import { enqueueNotification } from './notificationBrokerService';

function callId() {
  return `CALL-${uuidv4().slice(0, 8).toUpperCase()}`;
}

function formatCall(doc: InstanceType<typeof PhoneCall>) {
  return {
    callId: doc.callId,
    direction: doc.direction,
    status: doc.status,
    callType: doc.callType,
    fromNumber: doc.fromNumber,
    toNumber: doc.toNumber,
    contactId: doc.contactId,
    contactName: doc.contactName,
    durationSeconds: doc.durationSeconds,
    isHdVoice: doc.isHdVoice,
    isSpam: doc.isSpam,
    isBlocked: doc.isBlocked,
    isEmergency: doc.isEmergency,
    isConference: doc.isConference,
    conferenceId: doc.conferenceId,
    recordingEnabled: doc.recordingEnabled,
    notes: doc.notes,
    tags: doc.tags,
    audioRoute: doc.audioRoute,
    muted: doc.muted,
    onHold: doc.onHold,
    signalStrength: doc.signalStrength,
    simSlot: doc.simSlot,
    startedAt: doc.startedAt?.toISOString(),
    connectedAt: doc.connectedAt?.toISOString(),
    endedAt: doc.endedAt?.toISOString(),
    createdAt: doc.createdAt.toISOString(),
  };
}

async function assertPhone(userId: string) {
  const allowed = await checkPermission(userId, PHONE_APP_BUNDLE, 'phone');
  if (!allowed) throw new Error('PHONE_PERMISSION_DENIED');
}

async function isNumberBlocked(userId: string, number: string): Promise<boolean> {
  const block = await BlockedNumber.findOne({ userId: new Types.ObjectId(userId), number, deletedAt: null });
  return !!block;
}

export async function initiateCall(
  userId: string,
  input: {
    toNumber: string;
    fromNumber?: string;
    contactId?: string;
    contactName?: string;
    callType?: 'voice' | 'video' | 'conference' | 'emergency';
    simSlot?: string;
  },
  actorId: string
) {
  await assertPhone(userId);

  const isEmergency = EMERGENCY_NUMBERS.includes(input.toNumber as typeof EMERGENCY_NUMBERS[number])
    || input.callType === 'emergency';

  if (!isEmergency && await isNumberBlocked(userId, input.toNumber)) {
    throw new Error('NUMBER_BLOCKED');
  }

  const id = callId();
  const now = new Date();
  const doc = await PhoneCall.create({
    callId: id,
    userId: new Types.ObjectId(userId),
    direction: 'outgoing',
    status: 'connecting',
    callType: input.callType ?? 'voice',
    fromNumber: input.fromNumber ?? '+971500000001',
    toNumber: input.toNumber,
    contactId: input.contactId,
    contactName: input.contactName,
    isEmergency,
    isHdVoice: true,
    simSlot: input.simSlot,
    startedAt: now,
    createdBy: new Types.ObjectId(actorId),
  });

  emitToUser(userId, 'phone:status', { call: formatCall(doc), event: 'connecting' });

  await logAudit({
    userId,
    actorId,
    action: 'phone_call_initiate',
    resource: 'phone_call',
    resourceId: id,
    metadata: { toNumber: input.toNumber, callType: input.callType },
  });

  return formatCall(doc);
}

export async function answerCall(userId: string, callIdParam: string, actorId: string) {
  await assertPhone(userId);
  const doc = await PhoneCall.findOne({ callId: callIdParam, userId: new Types.ObjectId(userId), deletedAt: null });
  if (!doc) throw new Error('CALL_NOT_FOUND');

  doc.status = 'connected';
  doc.connectedAt = new Date();
  doc.updatedBy = new Types.ObjectId(actorId);
  await doc.save();

  emitToUser(userId, 'phone:connected', { call: formatCall(doc) });

  await createLiveActivity(
    userId,
    {
      type: 'incoming_call',
      title: doc.contactName ?? doc.fromNumber,
      subtitle: 'On call',
      icon: '📞',
      appId: PHONE_APP_BUNDLE,
      dynamicIsland: true,
      lockScreen: true,
    },
    actorId
  );

  return formatCall(doc);
}

export async function endCall(
  userId: string,
  callIdParam: string,
  status: CallStatus,
  actorId: string
) {
  await assertPhone(userId);
  const doc = await PhoneCall.findOne({ callId: callIdParam, userId: new Types.ObjectId(userId), deletedAt: null });
  if (!doc) throw new Error('CALL_NOT_FOUND');

  const now = new Date();
  doc.status = status;
  doc.endedAt = now;
  if (doc.connectedAt) {
    doc.durationSeconds = Math.floor((now.getTime() - doc.connectedAt.getTime()) / 1000);
  }
  doc.updatedBy = new Types.ObjectId(actorId);
  await doc.save();

  emitToUser(userId, 'phone:ended', { call: formatCall(doc) });

  const activities = await import('../database/models/LiveActivity').then((m) =>
    m.LiveActivity.find({ userId: new Types.ObjectId(userId), appId: PHONE_APP_BUNDLE, state: 'active' })
  );
  for (const activity of activities) {
    await endLiveActivity(userId, activity.activityId, actorId);
  }

  return formatCall(doc);
}

export async function updateCallState(
  userId: string,
  callIdParam: string,
  updates: { muted?: boolean; onHold?: boolean; audioRoute?: AudioRoute; recordingEnabled?: boolean; notes?: string; tags?: string[] },
  actorId: string
) {
  await assertPhone(userId);
  const doc = await PhoneCall.findOne({ callId: callIdParam, userId: new Types.ObjectId(userId), deletedAt: null });
  if (!doc) throw new Error('CALL_NOT_FOUND');

  Object.assign(doc, updates);
  doc.updatedBy = new Types.ObjectId(actorId);
  await doc.save();

  emitToUser(userId, 'phone:status', { call: formatCall(doc) });
  return formatCall(doc);
}

export async function simulateIncomingCall(
  userId: string,
  input: { fromNumber: string; contactName?: string; contactId?: string },
  actorId: string
) {
  await assertPhone(userId);

  if (await isNumberBlocked(userId, input.fromNumber)) {
    return null;
  }

  const id = callId();
  const doc = await PhoneCall.create({
    callId: id,
    userId: new Types.ObjectId(userId),
    direction: 'incoming',
    status: 'ringing',
    callType: 'voice',
    fromNumber: input.fromNumber,
    toNumber: '+971500000001',
    contactId: input.contactId,
    contactName: input.contactName,
    isHdVoice: true,
    startedAt: new Date(),
    createdBy: new Types.ObjectId(actorId),
  });

  const call = formatCall(doc);

  emitToUser(userId, 'phone:incoming', { call });

  await createLiveActivity(
    userId,
    {
      type: 'incoming_call',
      title: input.contactName ?? input.fromNumber,
      subtitle: 'Incoming call',
      icon: '📞',
      appId: PHONE_APP_BUNDLE,
      payload: { callId: id },
      dynamicIsland: true,
      lockScreen: true,
    },
    actorId
  );

  await enqueueNotification({
    userId,
    appId: PHONE_APP_BUNDLE,
    title: input.contactName ?? input.fromNumber,
    body: 'Incoming call',
    priority: 'critical',
    headsUp: true,
    lockScreen: true,
    dynamicIsland: true,
    deepLink: `gulfos://phone/call/${id}`,
    actorId,
    actions: [
      { id: 'accept', label: 'Accept' },
      { id: 'decline', label: 'Decline' },
    ],
  });

  return call;
}

export async function getCallHistory(
  userId: string,
  options: { status?: CallStatus; limit?: number; offset?: number; search?: string } = {}
) {
  await assertPhone(userId);
  const filter: Record<string, unknown> = {
    userId: new Types.ObjectId(userId),
    deletedAt: null,
  };
  if (options.status) filter.status = options.status;
  if (options.search) {
    const regex = new RegExp(options.search, 'i');
    filter.$or = [{ contactName: regex }, { toNumber: regex }, { fromNumber: regex }];
  }

  const limit = Math.min(options.limit ?? 50, 100);
  const offset = options.offset ?? 0;

  const [calls, total] = await Promise.all([
    PhoneCall.find(filter).sort({ createdAt: -1 }).skip(offset).limit(limit),
    PhoneCall.countDocuments(filter),
  ]);

  return { calls: calls.map(formatCall), total, limit, offset };
}

export async function getCallStatistics(userId: string) {
  await assertPhone(userId);
  const uid = new Types.ObjectId(userId);
  const [total, missed, outgoing, incoming, totalDuration] = await Promise.all([
    PhoneCall.countDocuments({ userId: uid, deletedAt: null }),
    PhoneCall.countDocuments({ userId: uid, status: 'missed', deletedAt: null }),
    PhoneCall.countDocuments({ userId: uid, direction: 'outgoing', deletedAt: null }),
    PhoneCall.countDocuments({ userId: uid, direction: 'incoming', deletedAt: null }),
    PhoneCall.aggregate([
      { $match: { userId: uid, deletedAt: null, durationSeconds: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: '$durationSeconds' } } },
    ]),
  ]);

  return {
    total,
    missed,
    outgoing,
    incoming,
    totalDurationSeconds: totalDuration[0]?.total ?? 0,
  };
}

export async function cleanupStaleCalls(): Promise<number> {
  const cutoff = new Date(Date.now() - 2 * 60 * 1000);
  const result = await PhoneCall.updateMany(
    { status: 'ringing', startedAt: { $lt: cutoff }, deletedAt: null },
    { status: 'missed', endedAt: new Date() }
  );
  return result.modifiedCount;
}

export { PHONE_SOCKET_EVENTS, formatCall };
