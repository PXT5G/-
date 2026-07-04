import { Types } from 'mongoose';
import { PhoneVoicemail, IPhoneVoicemail } from '../database/models/PhoneVoicemail';
import { Call } from '../database/models/Call';
import {
  AuditContext,
  requirePermission,
  logPhoneAudit,
  notify,
  resolveContactDisplay,
  normalizePhone,
  ensurePhoneSettings,
  eventBusService,
} from './phoneService';
import { endCall } from './callService';

function formatVoicemailEntry(v: Pick<IPhoneVoicemail, '_id' | 'callId' | 'fromNumber' | 'fromName' | 'contactId' | 'durationSeconds' | 'transcript' | 'isRead' | 'isUrgent' | 'audioUrl' | 'receivedAt'>) {
  return {
    id: v._id.toString(),
    callId: v.callId?.toString(),
    fromNumber: v.fromNumber,
    fromName: v.fromName,
    contactId: v.contactId?.toString(),
    durationSeconds: v.durationSeconds,
    transcript: v.transcript,
    isRead: v.isRead,
    isUrgent: v.isUrgent,
    audioUrl: v.audioUrl,
    receivedAt: v.receivedAt.toISOString(),
  };
}

export async function listVoicemails(userId: string, page = 0, limit = 30) {
  const items = await PhoneVoicemail.find({ userId, deletedAt: { $exists: false } })
    .sort({ receivedAt: -1 })
    .skip(page * limit)
    .limit(limit)
    .lean();

  const unread = await PhoneVoicemail.countDocuments({ userId, isRead: false, deletedAt: { $exists: false } });
  return { unread, items: items.map((v) => formatVoicemailEntry(v)) };
}

export async function getVoicemail(userId: string, voicemailId: string) {
  const v = await PhoneVoicemail.findOne({ _id: voicemailId, userId, deletedAt: { $exists: false } });
  if (!v) throw new Error('Voicemail not found');
  return formatVoicemailEntry(v);
}

export async function markVoicemailRead(userId: string, voicemailId: string, ctx: AuditContext) {
  await requirePermission(userId, 'view_voicemail', ctx.performedByRole as 'user' | 'admin');

  const v = await PhoneVoicemail.findOneAndUpdate(
    { _id: voicemailId, userId },
    { isRead: true, updatedBy: userId },
    { new: true }
  );
  if (!v) throw new Error('Voicemail not found');

  await logPhoneAudit(userId, 'voicemail_read', 'PhoneVoicemail', ctx, { entityId: voicemailId });
  return formatVoicemailEntry(v);
}

export async function deleteVoicemail(userId: string, voicemailId: string, ctx: AuditContext) {
  await requirePermission(userId, 'manage_voicemail', ctx.performedByRole as 'user' | 'admin');

  const v = await PhoneVoicemail.findOneAndUpdate(
    { _id: voicemailId, userId },
    { deletedAt: new Date(), updatedBy: userId },
    { new: true }
  );
  if (!v) throw new Error('Voicemail not found');

  await logPhoneAudit(userId, 'voicemail_deleted', 'PhoneVoicemail', ctx, { entityId: voicemailId });
}

export async function sendToVoicemail(userId: string, callId: string, ctx: AuditContext) {
  await requirePermission(userId, 'manage_voicemail', ctx.performedByRole as 'user' | 'admin');

  const settings = await ensurePhoneSettings(userId);
  if (!settings.voicemailEnabled) throw new Error('Voicemail is disabled');

  const call = await Call.findOne({ _id: callId, userId });
  if (!call) throw new Error('Call not found');

  const { displayName, contactId } = await resolveContactDisplay(userId, call.remoteNumber, call.contactId?.toString());

  const vm = await PhoneVoicemail.create({
    userId,
    callId: call._id,
    fromNumber: call.remoteNumber,
    fromName: displayName,
    contactId: contactId ? new Types.ObjectId(contactId) : undefined,
    durationSeconds: 0,
    transcript: `Voicemail from ${displayName} at ${new Date().toLocaleString()}`,
    isRead: false,
    receivedAt: new Date(),
    createdBy: userId,
    updatedBy: userId,
  });

  await endCall(userId, callId, ctx);

  await logPhoneAudit(userId, 'voicemail_received', 'PhoneVoicemail', ctx, {
    entityId: vm._id.toString(),
    callId,
    phoneNumber: call.remoteNumber,
  });

  await notify(userId, 'New Voicemail', `Message from ${displayName}`, 'normal');
  eventBusService.emitToUser(userId, 'phone:voicemail', {
    voicemailId: vm._id.toString(),
    fromName: displayName,
    fromNumber: call.remoteNumber,
  });

  return formatVoicemailEntry(vm);
}

export async function createVoicemailGreeting(
  userId: string,
  greeting: string,
  ctx: AuditContext
) {
  await requirePermission(userId, 'manage_voicemail', ctx.performedByRole as 'user' | 'admin');
  const settings = await ensurePhoneSettings(userId);
  settings.voicemailGreeting = greeting;
  settings.updatedBy = new Types.ObjectId(userId);
  await settings.save();
  await logPhoneAudit(userId, 'voicemail_greeting_updated', 'PhoneCallSettings', ctx);
  return { greeting };
}

export { formatVoicemailEntry as formatVoicemail };
