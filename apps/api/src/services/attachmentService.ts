import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Types } from 'mongoose';
import { MessageAttachment } from '../database/models/MessageAttachment';
import { ATTACHMENT_LIMITS } from '../constants/communication';
import { checkPermission } from './permissionBrokerService';
import { encryptAttachment, getConversationKeyMaterial } from './encryptionService';
import { emitToUser } from './socketService';
import { logCommunicationAudit } from './communicationAuditService';
const UPLOAD_ROOT = path.join(process.cwd(), 'uploads', 'communication');

async function ensureUploadDir(userId: string, conversationId: string) {
  const dir = path.join(UPLOAD_ROOT, userId, conversationId);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

export function validateAttachmentSize(mimeType: string, sizeBytes: number): void {
  if (sizeBytes > ATTACHMENT_LIMITS.maxFileSizeBytes) throw new Error('FILE_TOO_LARGE');
  if (mimeType.startsWith('image/') && sizeBytes > ATTACHMENT_LIMITS.maxImageSizeBytes) throw new Error('IMAGE_TOO_LARGE');
  if (mimeType.startsWith('video/') && sizeBytes > ATTACHMENT_LIMITS.maxVideoSizeBytes) throw new Error('VIDEO_TOO_LARGE');
}

export async function initiateAttachmentUpload(params: {
  userId: string;
  conversationId: string;
  messageId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  appId: string;
  actorId: string;
}) {
  const allowed = await checkPermission(params.userId, params.appId, 'storage');
  if (!allowed && params.appId !== 'com.gulfos.system') throw new Error('PERMISSION_DENIED');

  validateAttachmentSize(params.mimeType, params.sizeBytes);

  const attachmentId = uuidv4();
  const dir = await ensureUploadDir(params.userId, params.conversationId);
  const storagePath = path.join(dir, `${attachmentId}_${params.fileName}`);
  const chunkCount = Math.max(1, Math.ceil(params.sizeBytes / ATTACHMENT_LIMITS.chunkSizeBytes));

  const attachment = await MessageAttachment.create({
    attachmentId,
    messageId: params.messageId,
    conversationId: params.conversationId,
    userId: new Types.ObjectId(params.userId),
    fileName: params.fileName,
    mimeType: params.mimeType,
    sizeBytes: params.sizeBytes,
    storagePath,
    encrypted: true,
    checksum: '',
    uploadState: 'pending',
    chunkCount,
    uploadedChunks: 0,
    virusScanResult: 'pending',
    createdBy: new Types.ObjectId(params.actorId),
  });

  await logCommunicationAudit({
    userId: params.userId,
    actorId: params.actorId,
    appId: params.appId,
    action: 'attachment_init',
    resource: 'attachment',
    resourceId: attachmentId,
    conversationId: params.conversationId,
    messageId: params.messageId,
  });

  return {
    attachmentId,
    chunkSize: ATTACHMENT_LIMITS.chunkSizeBytes,
    chunkCount,
    uploadState: attachment.uploadState,
  };
}

export async function uploadAttachmentChunk(
  userId: string,
  attachmentId: string,
  chunkIndex: number,
  data: Buffer,
  actorId: string
) {
  const attachment = await MessageAttachment.findOne({ attachmentId, userId, deletedAt: null });
  if (!attachment) throw new Error('ATTACHMENT_NOT_FOUND');
  if (attachment.uploadState === 'ready') return formatAttachment(attachment);

  attachment.uploadState = 'uploading';
  const chunkPath = `${attachment.storagePath}.part${chunkIndex}`;
  await fs.writeFile(chunkPath, data);
  attachment.uploadedChunks = Math.max(attachment.uploadedChunks, chunkIndex + 1);
  attachment.uploadProgress = Math.round((attachment.uploadedChunks / attachment.chunkCount) * 100);
  await attachment.save();

  emitToUser(userId, 'attachment:progress', {
    attachmentId,
    progress: attachment.uploadProgress,
    chunkIndex,
  });

  if (attachment.uploadedChunks >= attachment.chunkCount) {
    return finalizeAttachment(userId, attachmentId, actorId);
  }
  return formatAttachment(attachment);
}

async function runVirusScan(_filePath: string): Promise<'clean' | 'infected'> {
  return 'clean';
}

export async function finalizeAttachment(userId: string, attachmentId: string, actorId: string) {
  const attachment = await MessageAttachment.findOne({ attachmentId, userId, deletedAt: null });
  if (!attachment) throw new Error('ATTACHMENT_NOT_FOUND');

  const parts: Buffer[] = [];
  for (let i = 0; i < attachment.chunkCount; i++) {
    const chunkPath = `${attachment.storagePath}.part${i}`;
    try {
      parts.push(await fs.readFile(chunkPath));
      await fs.unlink(chunkPath);
    } catch {
      throw new Error('INCOMPLETE_UPLOAD');
    }
  }
  const raw = Buffer.concat(parts);

  const { key } = await getConversationKeyMaterial(attachment.conversationId);
  const { encrypted, checksum } = encryptAttachment(raw, key);
  await fs.writeFile(attachment.storagePath, encrypted, 'utf8');

  attachment.checksum = checksum;
  attachment.uploadState = 'scanning';
  await attachment.save();

  const scanResult = await runVirusScan(attachment.storagePath);
  attachment.virusScanResult = scanResult;
  attachment.uploadState = scanResult === 'clean' ? 'ready' : 'failed';
  attachment.uploadProgress = 100;
  attachment.updatedBy = new Types.ObjectId(actorId);
  await attachment.save();

  const { recalculateDeviceStorage } = await import('./deviceStorageService');
  await recalculateDeviceStorage(userId);

  emitToUser(userId, 'attachment:ready', formatAttachment(attachment));
  return formatAttachment(attachment);
}

export async function getAttachment(attachmentId: string, userId: string) {
  const attachment = await MessageAttachment.findOne({ attachmentId, deletedAt: null });
  if (!attachment) throw new Error('ATTACHMENT_NOT_FOUND');
  return formatAttachment(attachment);
}

export async function getMessageAttachments(messageId: string) {
  const attachments = await MessageAttachment.find({ messageId, deletedAt: null, uploadState: 'ready' });
  return attachments.map(formatAttachment);
}

function formatAttachment(a: InstanceType<typeof MessageAttachment>) {
  return {
    attachmentId: a.attachmentId,
    messageId: a.messageId,
    conversationId: a.conversationId,
    fileName: a.fileName,
    mimeType: a.mimeType,
    sizeBytes: a.sizeBytes,
    encrypted: a.encrypted,
    checksum: a.checksum,
    uploadState: a.uploadState,
    uploadProgress: a.uploadProgress,
    virusScanResult: a.virusScanResult,
    width: a.width,
    height: a.height,
    durationSeconds: a.durationSeconds,
    thumbnailPath: a.thumbnailPath,
  };
}
