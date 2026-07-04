import { Types } from 'mongoose';
import { Call, ICall } from '../database/models/Call';
import { CallHistory } from '../database/models/CallHistory';
import { ActiveCall, IActiveCall } from '../database/models/ActiveCall';
import { CallRecordingMetadata } from '../database/models/CallRecordingMetadata';
import { PhoneBlockedNumber } from '../database/models/PhoneBlockedNumber';
import { SIMProfile } from '../database/models/SIMProfile';
import {
  AuditContext,
  requirePermission,
  logPhoneAudit,
  notify,
  getUserPhoneNumber,
  resolveUserByPhone,
  resolveContactDisplay,
  normalizePhone,
  isNumberBlocked,
  ensurePhoneSettings,
  eventBusService,
} from './phoneService';

const EMERGENCY_NUMBERS = ['911', '112', '999', '+1911', '+112', '+1999'];

function isEmergencyNumber(phone: string): boolean {
  const n = phone.replace(/[^\d+]/g, '');
  return EMERGENCY_NUMBERS.some((e) => n === e || n.endsWith(e.replace('+', '')));
}

function formatCall(c: ICall) {
  return {
    id: c._id.toString(),
    phoneNumber: c.phoneNumber,
    remoteNumber: c.remoteNumber,
    remoteUserId: c.remoteUserId?.toString(),
    contactId: c.contactId?.toString(),
    direction: c.direction,
    status: c.status,
    isEmergency: c.isEmergency,
    isConference: c.isConference,
    conferenceId: c.conferenceId,
    startedAt: c.startedAt?.toISOString(),
    connectedAt: c.connectedAt?.toISOString(),
    endedAt: c.endedAt?.toISOString(),
    durationSeconds: c.durationSeconds,
    isMuted: c.isMuted,
    isSpeaker: c.isSpeaker,
    isOnHold: c.isOnHold,
    createdAt: c.createdAt.toISOString(),
  };
}

function formatActiveCall(ac: IActiveCall) {
  return {
    id: ac._id.toString(),
    callId: ac.callId.toString(),
    phoneNumber: ac.phoneNumber,
    remoteNumber: ac.remoteNumber,
    remoteUserId: ac.remoteUserId?.toString(),
    contactId: ac.contactId?.toString(),
    displayName: ac.displayName,
    direction: ac.direction,
    state: ac.state,
    isEmergency: ac.isEmergency,
    isMuted: ac.isMuted,
    isSpeaker: ac.isSpeaker,
    isOnHold: ac.isOnHold,
    isConference: ac.isConference,
    conferenceId: ac.conferenceId,
    participants: ac.participants,
    startedAt: ac.startedAt.toISOString(),
    connectedAt: ac.connectedAt?.toISOString(),
  };
}

function formatHistory(h: {
  _id: Types.ObjectId;
  callId: Types.ObjectId;
  displayName: string;
  phoneNumber: string;
  remoteNumber: string;
  direction: string;
  status: string;
  isEmergency: boolean;
  durationSeconds: number;
  startedAt: Date;
  endedAt: Date;
  contactId?: Types.ObjectId;
}) {
  return {
    id: h._id.toString(),
    callId: h.callId.toString(),
    displayName: h.displayName,
    phoneNumber: h.phoneNumber,
    remoteNumber: h.remoteNumber,
    contactId: h.contactId?.toString(),
    direction: h.direction,
    status: h.status,
    isEmergency: h.isEmergency,
    durationSeconds: h.durationSeconds,
    startedAt: h.startedAt.toISOString(),
    endedAt: h.endedAt.toISOString(),
  };
}

async function ensureSimActive(userId: string): Promise<string> {
  const sim = await SIMProfile.findOne({ userId, isPrimary: true, status: 'active' });
  if (!sim) throw new Error('Active SIM required to place calls');
  const phoneNumber = await getUserPhoneNumber(userId);
  if (!phoneNumber) throw new Error('No phone number assigned');
  return phoneNumber;
}

async function finalizeCall(
  call: ICall,
  status: ICall['status'],
  userId: string,
  ctx: AuditContext,
  displayName?: string
) {
  const now = new Date();
  call.status = status;
  call.endedAt = now;
  if (call.connectedAt) {
    call.durationSeconds = Math.floor((now.getTime() - call.connectedAt.getTime()) / 1000);
  }
  call.updatedBy = new Types.ObjectId(userId);
  await call.save();

  await ActiveCall.deleteMany({ callId: call._id });

  const resolved = displayName
    ? { displayName }
    : await resolveContactDisplay(userId, call.remoteNumber, call.contactId?.toString());
  await CallHistory.create({
    userId: call.userId,
    callId: call._id,
    remoteUserId: call.remoteUserId,
    contactId: call.contactId,
    displayName: resolved.displayName,
    phoneNumber: call.phoneNumber,
    remoteNumber: call.remoteNumber,
    direction: call.direction,
    status,
    isEmergency: call.isEmergency,
    isConference: call.isConference,
    durationSeconds: call.durationSeconds,
    startedAt: call.startedAt ?? now,
    endedAt: now,
    createdBy: userId,
    updatedBy: userId,
  });

  await logPhoneAudit(userId, `call_${status}`, 'Call', ctx, {
    callId: call._id.toString(),
    phoneNumber: call.remoteNumber,
    newValue: `${call.durationSeconds}s`,
  });

  return formatCall(call);
}

export async function getActiveCall(userId: string) {
  const ac = await ActiveCall.findOne({ ownerUserId: userId });
  return ac ? formatActiveCall(ac) : null;
}

export async function listCallHistory(
  userId: string,
  filters?: { direction?: string; status?: string; page?: number; limit?: number }
) {
  const filter: Record<string, unknown> = { userId };
  if (filters?.direction) filter.direction = filters.direction;
  if (filters?.status) filter.status = filters.status;

  const page = filters?.page ?? 0;
  const limit = Math.min(filters?.limit ?? 50, 100);

  const [items, total] = await Promise.all([
    CallHistory.find(filter).sort({ endedAt: -1 }).skip(page * limit).limit(limit).lean(),
    CallHistory.countDocuments(filter),
  ]);

  return { total, page, limit, items: items.map(formatHistory) };
}

export async function getMissedCalls(userId: string, limit = 20) {
  const items = await CallHistory.find({ userId, direction: 'incoming', status: 'missed' })
    .sort({ endedAt: -1 })
    .limit(limit)
    .lean();
  return items.map(formatHistory);
}

export async function makeCall(
  userId: string,
  data: { phoneNumber: string; contactId?: string },
  ctx: AuditContext
) {
  await requirePermission(userId, 'make_call', ctx.performedByRole as 'user' | 'admin');

  const existing = await ActiveCall.findOne({ ownerUserId: userId });
  if (existing) throw new Error('Already on an active call');

  const myNumber = await ensureSimActive(userId);
  const remoteNumber = normalizePhone(data.phoneNumber);
  const emergency = isEmergencyNumber(remoteNumber);

  if (!emergency) {
    if (await isNumberBlocked(userId, remoteNumber)) {
      throw new Error('Number is blocked');
    }
  }

  const settings = await ensurePhoneSettings(userId);
  const { displayName, contactId, avatar } = await resolveContactDisplay(userId, remoteNumber, data.contactId);
  const remoteUserId = await resolveUserByPhone(remoteNumber);

  const call = await Call.create({
    userId,
    remoteUserId: remoteUserId ? new Types.ObjectId(remoteUserId) : undefined,
    contactId: contactId ? new Types.ObjectId(contactId) : (data.contactId ? new Types.ObjectId(data.contactId) : undefined),
    phoneNumber: myNumber,
    remoteNumber,
    direction: 'outgoing',
    status: 'ringing',
    isEmergency: emergency,
    startedAt: new Date(),
    createdBy: userId,
    updatedBy: userId,
  });

  const activeCall = await ActiveCall.create({
    callId: call._id,
    ownerUserId: userId,
    remoteUserId: remoteUserId ? new Types.ObjectId(remoteUserId) : undefined,
    contactId: contactId ? new Types.ObjectId(contactId) : undefined,
    phoneNumber: myNumber,
    remoteNumber,
    displayName,
    direction: 'outgoing',
    state: 'ringing',
    isEmergency: emergency,
    startedAt: new Date(),
    createdBy: userId,
    updatedBy: userId,
  });

  await logPhoneAudit(userId, 'call_initiated', 'Call', ctx, { callId: call._id.toString(), phoneNumber: remoteNumber });

  const payload = {
    callId: call._id.toString(),
    activeCallId: activeCall._id.toString(),
    phoneNumber: myNumber,
    remoteNumber,
    displayName,
    direction: 'outgoing' as const,
    isEmergency: emergency,
    avatar,
  };

  eventBusService.emitToUser(userId, 'phone:ringing', payload);

  if (remoteUserId && remoteUserId !== userId) {
    const calleeBlocked = await isNumberBlocked(remoteUserId, myNumber);
    if (!calleeBlocked) {
      const calleeCall = await Call.create({
        userId: remoteUserId,
        remoteUserId: new Types.ObjectId(userId),
        phoneNumber: remoteNumber,
        remoteNumber: myNumber,
        direction: 'incoming',
        status: 'ringing',
        isEmergency: emergency,
        startedAt: new Date(),
        createdBy: userId,
        updatedBy: userId,
      });

      const callerInfo = await resolveContactDisplay(remoteUserId, myNumber);
      await ActiveCall.create({
        callId: calleeCall._id,
        ownerUserId: remoteUserId,
        remoteUserId: new Types.ObjectId(userId),
        phoneNumber: remoteNumber,
        remoteNumber: myNumber,
        displayName: callerInfo.displayName,
        direction: 'incoming',
        state: 'ringing',
        isEmergency: emergency,
        startedAt: new Date(),
        createdBy: userId,
        updatedBy: userId,
      });

      eventBusService.emitToUser(remoteUserId, 'phone:ringing', {
        callId: calleeCall._id.toString(),
        phoneNumber: remoteNumber,
        remoteNumber: myNumber,
        displayName: callerInfo.displayName,
        direction: 'incoming',
        isEmergency: emergency,
        avatar: callerInfo.avatar,
      });

      await notify(remoteUserId, 'Incoming Call', `Call from ${callerInfo.displayName}`, 'high');
    }
  }

  if (emergency) {
    await notify(userId, 'Emergency Call', `Connecting to emergency services: ${remoteNumber}`, 'critical');
  }

  return { call: formatCall(call), activeCall: formatActiveCall(activeCall) };
}

export async function acceptCall(userId: string, callId: string, ctx: AuditContext) {
  await requirePermission(userId, 'receive_call', ctx.performedByRole as 'user' | 'admin');

  const call = await Call.findOne({ _id: callId, userId });
  if (!call) throw new Error('Call not found');
  if (!['ringing', 'connecting'].includes(call.status)) throw new Error('Call cannot be accepted');

  const now = new Date();
  call.status = 'active';
  call.connectedAt = now;
  call.updatedBy = new Types.ObjectId(userId);
  await call.save();

  const ac = await ActiveCall.findOne({ callId: call._id, ownerUserId: userId });
  if (ac) {
    ac.state = 'active';
    ac.connectedAt = now;
    ac.updatedBy = new Types.ObjectId(userId);
    await ac.save();
  }

  await logPhoneAudit(userId, 'call_accepted', 'Call', ctx, { callId, phoneNumber: call.remoteNumber });

  const payload = { callId, remoteNumber: call.remoteNumber, connectedAt: now.toISOString() };
  eventBusService.emitToUser(userId, 'phone:accepted', payload);

  if (call.remoteUserId) {
    const remoteCall = await Call.findOne({
      userId: call.remoteUserId,
      remoteNumber: call.phoneNumber,
      status: 'ringing',
    });
    if (remoteCall) {
      remoteCall.status = 'active';
      remoteCall.connectedAt = now;
      await remoteCall.save();
      await ActiveCall.findOneAndUpdate(
        { callId: remoteCall._id },
        { state: 'active', connectedAt: now }
      );
      eventBusService.emitToUser(call.remoteUserId.toString(), 'phone:accepted', {
        callId: remoteCall._id.toString(),
        remoteNumber: call.phoneNumber,
        connectedAt: now.toISOString(),
      });
    }
  }

  return formatCall(call);
}

export async function rejectCall(userId: string, callId: string, ctx: AuditContext) {
  await requirePermission(userId, 'receive_call', ctx.performedByRole as 'user' | 'admin');

  const call = await Call.findOne({ _id: callId, userId });
  if (!call) throw new Error('Call not found');

  const status = call.direction === 'incoming' ? 'rejected' : 'ended';
  const result = await finalizeCall(call, status, userId, ctx);

  eventBusService.emitToUser(userId, 'phone:ended', { callId, status });

  if (call.remoteUserId) {
    const remoteCall = await Call.findOne({
      userId: call.remoteUserId,
      remoteNumber: call.phoneNumber,
      status: { $in: ['ringing', 'active', 'connecting'] },
    });
    if (remoteCall) {
      const remoteStatus = remoteCall.direction === 'incoming' ? 'missed' : 'ended';
      await finalizeCall(remoteCall, remoteStatus, call.remoteUserId.toString(), ctx);
      eventBusService.emitToUser(call.remoteUserId.toString(), remoteStatus === 'missed' ? 'phone:missed' : 'phone:ended', {
        callId: remoteCall._id.toString(),
        status: remoteStatus,
      });
    }
  }

  return result;
}

export async function endCall(userId: string, callId: string, ctx: AuditContext) {
  await requirePermission(userId, 'end_call', ctx.performedByRole as 'user' | 'admin');

  const call = await Call.findOne({ _id: callId, userId });
  if (!call) throw new Error('Call not found');

  const result = await finalizeCall(call, 'ended', userId, ctx);
  eventBusService.emitToUser(userId, 'phone:ended', { callId, status: 'ended', durationSeconds: call.durationSeconds });

  if (call.remoteUserId) {
    const remoteCall = await Call.findOne({
      userId: call.remoteUserId,
      remoteNumber: call.phoneNumber,
      status: { $in: ['ringing', 'active', 'on_hold', 'connecting'] },
    });
    if (remoteCall) {
      await finalizeCall(remoteCall, 'ended', call.remoteUserId.toString(), ctx);
      eventBusService.emitToUser(call.remoteUserId.toString(), 'phone:ended', {
        callId: remoteCall._id.toString(),
        status: 'ended',
      });
    }
  }

  return result;
}

export async function holdCall(userId: string, callId: string, ctx: AuditContext) {
  await requirePermission(userId, 'end_call', ctx.performedByRole as 'user' | 'admin');

  const call = await Call.findOne({ _id: callId, userId, status: 'active' });
  if (!call) throw new Error('No active call to hold');

  call.status = 'on_hold';
  call.isOnHold = true;
  call.updatedBy = new Types.ObjectId(userId);
  await call.save();

  await ActiveCall.findOneAndUpdate({ callId }, { state: 'on_hold', isOnHold: true, updatedBy: userId });
  await logPhoneAudit(userId, 'call_hold', 'Call', ctx, { callId });

  eventBusService.emitToUser(userId, 'phone:hold', { callId });
  return formatCall(call);
}

export async function resumeCall(userId: string, callId: string, ctx: AuditContext) {
  await requirePermission(userId, 'end_call', ctx.performedByRole as 'user' | 'admin');

  const call = await Call.findOne({ _id: callId, userId, status: 'on_hold' });
  if (!call) throw new Error('No held call to resume');

  call.status = 'active';
  call.isOnHold = false;
  call.updatedBy = new Types.ObjectId(userId);
  await call.save();

  await ActiveCall.findOneAndUpdate({ callId }, { state: 'active', isOnHold: false, updatedBy: userId });
  await logPhoneAudit(userId, 'call_resume', 'Call', ctx, { callId });

  eventBusService.emitToUser(userId, 'phone:resume', { callId });
  return formatCall(call);
}

export async function muteCall(userId: string, callId: string, muted: boolean, ctx: AuditContext) {
  await requirePermission(userId, 'end_call', ctx.performedByRole as 'user' | 'admin');

  const call = await Call.findOne({ _id: callId, userId });
  if (!call) throw new Error('Call not found');

  call.isMuted = muted;
  call.updatedBy = new Types.ObjectId(userId);
  await call.save();

  await ActiveCall.findOneAndUpdate({ callId }, { isMuted: muted, updatedBy: userId });
  await logPhoneAudit(userId, muted ? 'call_muted' : 'call_unmuted', 'Call', ctx, { callId });

  eventBusService.emitToUser(userId, 'phone:mute', { callId, muted });
  return formatCall(call);
}

export async function speakerCall(userId: string, callId: string, speaker: boolean, ctx: AuditContext) {
  await requirePermission(userId, 'end_call', ctx.performedByRole as 'user' | 'admin');

  const call = await Call.findOne({ _id: callId, userId });
  if (!call) throw new Error('Call not found');

  call.isSpeaker = speaker;
  call.updatedBy = new Types.ObjectId(userId);
  await call.save();

  await ActiveCall.findOneAndUpdate({ callId }, { isSpeaker: speaker, updatedBy: userId });
  await logPhoneAudit(userId, speaker ? 'speaker_on' : 'speaker_off', 'Call', ctx, { callId });

  eventBusService.emitToUser(userId, 'phone:speaker', { callId, speaker });
  return formatCall(call);
}

export async function addConferenceParticipant(
  userId: string,
  callId: string,
  data: { phoneNumber: string; contactId?: string },
  ctx: AuditContext
) {
  await requirePermission(userId, 'conference_call', ctx.performedByRole as 'user' | 'admin');

  const call = await Call.findOne({ _id: callId, userId, status: { $in: ['active', 'on_hold'] } });
  if (!call) throw new Error('No active call for conference');

  const remoteNumber = normalizePhone(data.phoneNumber);
  const { displayName, contactId } = await resolveContactDisplay(userId, remoteNumber, data.contactId);
  const conferenceId = call.conferenceId ?? `conf-${call._id.toString()}`;

  call.isConference = true;
  call.conferenceId = conferenceId;
  call.updatedBy = new Types.ObjectId(userId);
  await call.save();

  const ac = await ActiveCall.findOne({ callId });
  if (ac) {
    ac.isConference = true;
    ac.conferenceId = conferenceId;
    ac.state = 'conference';
    ac.participants.push({
      phoneNumber: remoteNumber,
      displayName,
      contactId: contactId ? new Types.ObjectId(contactId) : undefined,
      isMuted: false,
      joinedAt: new Date(),
    });
    ac.updatedBy = new Types.ObjectId(userId);
    await ac.save();
  }

  await logPhoneAudit(userId, 'conference_participant_added', 'Call', ctx, { callId, phoneNumber: remoteNumber });
  eventBusService.emitToUser(userId, 'phone:accepted', { callId, conference: true, participant: displayName });

  return formatCall(call);
}

export async function startRecording(userId: string, callId: string, ctx: AuditContext) {
  await requirePermission(userId, 'record_call', ctx.performedByRole as 'user' | 'admin');

  const call = await Call.findOne({ _id: callId, userId, status: 'active' });
  if (!call) throw new Error('No active call to record');

  const existing = await CallRecordingMetadata.findOne({ callId });
  if (existing) return { id: existing._id.toString(), callId };

  const now = new Date();
  const recording = await CallRecordingMetadata.create({
    userId,
    callId,
    durationSeconds: 0,
    fileSizeBytes: 0,
    storageKey: `recordings/${userId}/${callId}.webm`,
    startedAt: now,
    endedAt: now,
    createdBy: userId,
    updatedBy: userId,
  });

  call.recordingId = recording._id;
  await call.save();
  await logPhoneAudit(userId, 'recording_started', 'CallRecordingMetadata', ctx, { callId, entityId: recording._id.toString() });

  return { id: recording._id.toString(), callId };
}

export { formatCall, formatActiveCall, formatHistory };
