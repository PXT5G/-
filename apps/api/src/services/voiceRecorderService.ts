import { v4 as uuidv4 } from 'uuid';
import { Types } from 'mongoose';
import { VoiceRecording } from '../database/models/VoiceRecording';
import { SYSTEM_APP_BUNDLES } from '../constants/systemApps';
import { logSystemAppAudit } from './systemAppsAuditService';
import { validateVoiceNote } from './voiceService';
import { emitToUser } from './socketService';
import { checkPermission } from './permissionBrokerService';

function formatRecording(r: InstanceType<typeof VoiceRecording>) {
  return {
    recordingId: r.recordingId,
    name: r.name,
    durationSeconds: r.durationSeconds,
    sizeBytes: r.sizeBytes,
    noiseReduction: r.noiseReduction,
    bookmarks: r.bookmarks,
    trimStart: r.trimStart,
    trimEnd: r.trimEnd,
    createdAt: r.createdAt.toISOString(),
  };
}

export async function listRecordings(userId: string) {
  const items = await VoiceRecording.find({ userId, deletedAt: null }).sort({ createdAt: -1 });
  return items.map(formatRecording);
}

export async function createRecording(
  userId: string,
  params: { name?: string; durationSeconds: number; noiseReduction?: boolean },
  actorId: string
) {
  const allowed = await checkPermission(userId, SYSTEM_APP_BUNDLES.voiceRecorder, 'microphone');
  if (!allowed) throw new Error('PERMISSION_DENIED');

  validateVoiceNote({ durationSeconds: params.durationSeconds, mimeType: 'audio/ogg' });

  const recordingId = uuidv4();
  const sizeBytes = Math.floor(params.durationSeconds * 16_000);
  const { growAppCache } = await import('./storageService');
  await growAppCache(userId, SYSTEM_APP_BUNDLES.voiceRecorder, sizeBytes);

  const recording = await VoiceRecording.create({
    userId: new Types.ObjectId(userId),
    recordingId,
    name: params.name ?? `Recording ${new Date().toLocaleString()}`,
    durationSeconds: params.durationSeconds,
    sizeBytes,
    noiseReduction: params.noiseReduction ?? true,
    createdBy: new Types.ObjectId(actorId),
  });

  await logSystemAppAudit({ userId, actorId, appId: SYSTEM_APP_BUNDLES.voiceRecorder, action: 'recording_create', resourceId: recordingId });
  emitToUser(userId, 'voice-recorder:update', { action: 'created', recordingId });
  return formatRecording(recording);
}

export async function addBookmark(userId: string, recordingId: string, seconds: number, label: string, actorId: string) {
  const rec = await VoiceRecording.findOne({ userId, recordingId, deletedAt: null });
  if (!rec) throw new Error('RECORDING_NOT_FOUND');
  rec.bookmarks.push({ seconds, label });
  await rec.save();
  return formatRecording(rec);
}

export async function trimRecording(userId: string, recordingId: string, trimStart: number, trimEnd: number, actorId: string) {
  const rec = await VoiceRecording.findOne({ userId, recordingId, deletedAt: null });
  if (!rec) throw new Error('RECORDING_NOT_FOUND');
  rec.trimStart = trimStart;
  rec.trimEnd = trimEnd;
  rec.durationSeconds = trimEnd - trimStart;
  await rec.save();
  await logSystemAppAudit({ userId, actorId, appId: SYSTEM_APP_BUNDLES.voiceRecorder, action: 'recording_trim', resourceId: recordingId });
  return formatRecording(rec);
}

export async function deleteRecording(userId: string, recordingId: string, actorId: string) {
  await VoiceRecording.findOneAndUpdate({ userId, recordingId }, { deletedAt: new Date() });
  emitToUser(userId, 'voice-recorder:update', { action: 'deleted', recordingId });
  return { deleted: true };
}
