import { v4 as uuidv4 } from 'uuid';
import { Types } from 'mongoose';
import { PhoneFavorite } from '../database/models/PhoneFavorite';
import { BlockedNumber } from '../database/models/BlockedNumber';
import { Voicemail } from '../database/models/Voicemail';
import { PHONE_APP_BUNDLE, GOVERNMENT_DIRECTORY } from '../constants/telephony';
import { checkPermission } from './permissionBrokerService';
import { logAudit } from './auditService';
import * as callEngine from './callEngineService';

function favId() {
  return `FAV-${uuidv4().slice(0, 8).toUpperCase()}`;
}

function blockId() {
  return `BLK-${uuidv4().slice(0, 8).toUpperCase()}`;
}

function vmId() {
  return `VM-${uuidv4().slice(0, 8).toUpperCase()}`;
}

async function assertPhone(userId: string) {
  const allowed = await checkPermission(userId, PHONE_APP_BUNDLE, 'phone');
  if (!allowed) throw new Error('PHONE_PERMISSION_DENIED');
}

export async function initializePhone(userId: string, actorId: string) {
  await assertPhone(userId);
  const favCount = await PhoneFavorite.countDocuments({ userId: new Types.ObjectId(userId), deletedAt: null });
  if (favCount === 0) {
    await PhoneFavorite.create({
      favoriteId: favId(),
      userId: new Types.ObjectId(userId),
      label: 'Emergency',
      number: '911',
      speedDialIndex: 1,
      createdBy: new Types.ObjectId(actorId),
    });
  }
  await logAudit({ userId, actorId, action: 'phone_initialize', resource: 'phone' });
  return { initialized: true, governmentDirectory: GOVERNMENT_DIRECTORY };
}

export const initiateCall = callEngine.initiateCall;
export const answerCall = callEngine.answerCall;
export const endCall = callEngine.endCall;
export const updateCallState = callEngine.updateCallState;
export const getCallHistory = callEngine.getCallHistory;
export const getCallStatistics = callEngine.getCallStatistics;

export async function listFavorites(userId: string) {
  await assertPhone(userId);
  const favorites = await PhoneFavorite.find({ userId: new Types.ObjectId(userId), deletedAt: null }).sort({ speedDialIndex: 1 });
  return favorites.map((f) => ({
    favoriteId: f.favoriteId,
    contactId: f.contactId,
    label: f.label,
    number: f.number,
    speedDialIndex: f.speedDialIndex,
  }));
}

export async function addFavorite(userId: string, input: { label: string; number: string; contactId?: string; speedDialIndex?: number }, actorId: string) {
  await assertPhone(userId);
  const doc = await PhoneFavorite.create({
    favoriteId: favId(),
    userId: new Types.ObjectId(userId),
    label: input.label,
    number: input.number,
    contactId: input.contactId,
    speedDialIndex: input.speedDialIndex,
    createdBy: new Types.ObjectId(actorId),
  });
  return { favoriteId: doc.favoriteId, label: doc.label, number: doc.number, speedDialIndex: doc.speedDialIndex };
}

export async function removeFavorite(userId: string, favoriteIdParam: string, actorId: string) {
  await assertPhone(userId);
  const doc = await PhoneFavorite.findOne({ favoriteId: favoriteIdParam, userId: new Types.ObjectId(userId), deletedAt: null });
  if (!doc) throw new Error('FAVORITE_NOT_FOUND');
  doc.deletedAt = new Date();
  await doc.save();
  return { deleted: true };
}

export async function listBlockedNumbers(userId: string) {
  await assertPhone(userId);
  const blocks = await BlockedNumber.find({ userId: new Types.ObjectId(userId), deletedAt: null });
  return blocks.map((b) => ({ blockId: b.blockId, number: b.number, contactId: b.contactId, reason: b.reason }));
}

export async function blockNumber(userId: string, number: string, reason?: string, actorId?: string) {
  await assertPhone(userId);
  const existing = await BlockedNumber.findOne({ userId: new Types.ObjectId(userId), number, deletedAt: null });
  if (existing) return { blockId: existing.blockId, number: existing.number };
  const doc = await BlockedNumber.create({
    blockId: blockId(),
    userId: new Types.ObjectId(userId),
    number,
    reason,
    createdBy: actorId ? new Types.ObjectId(actorId) : undefined,
  });
  return { blockId: doc.blockId, number: doc.number };
}

export async function unblockNumber(userId: string, blockIdParam: string) {
  await assertPhone(userId);
  const doc = await BlockedNumber.findOne({ blockId: blockIdParam, userId: new Types.ObjectId(userId), deletedAt: null });
  if (!doc) throw new Error('BLOCK_NOT_FOUND');
  doc.deletedAt = new Date();
  await doc.save();
  return { deleted: true };
}

export async function listVoicemail(userId: string) {
  await assertPhone(userId);
  const messages = await Voicemail.find({ userId: new Types.ObjectId(userId), deletedAt: null }).sort({ receivedAt: -1 });
  return messages.map((v) => ({
    voicemailId: v.voicemailId,
    fromNumber: v.fromNumber,
    contactName: v.contactName,
    durationSeconds: v.durationSeconds,
    transcription: v.transcription,
    isRead: v.isRead,
    isPinned: v.isPinned,
    receivedAt: v.receivedAt.toISOString(),
  }));
}

export async function markVoicemailRead(userId: string, voicemailIdParam: string) {
  await assertPhone(userId);
  const doc = await Voicemail.findOne({ voicemailId: voicemailIdParam, userId: new Types.ObjectId(userId), deletedAt: null });
  if (!doc) throw new Error('VOICEMAIL_NOT_FOUND');
  doc.isRead = true;
  await doc.save();
  return { voicemailId: doc.voicemailId, isRead: true };
}

export async function getGovernmentDirectory() {
  return GOVERNMENT_DIRECTORY;
}

export async function exportCallHistory(userId: string) {
  const { calls } = await getCallHistory(userId, { limit: 1000 });
  return {
    exportedAt: new Date().toISOString(),
    count: calls.length,
    calls,
  };
}
