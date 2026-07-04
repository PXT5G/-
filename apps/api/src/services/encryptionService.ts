import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { Types } from 'mongoose';
import { ConversationKey } from '../database/models/ConversationKey';

const MASTER_SECRET = process.env.COMMUNICATION_MASTER_KEY ?? 'bananaos-communication-master-key-v1';

export function generateConversationKey(conversationId: string): { keyId: string; key: Buffer } {
  const keyId = uuidv4();
  const key = crypto.createHmac('sha256', MASTER_SECRET).update(`${conversationId}:${keyId}`).digest();
  return { keyId, key };
}

export function encryptMessage(body: string, key: Buffer): { encrypted: string; signature: string } {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(body, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  const payload = Buffer.concat([iv, tag, encrypted]).toString('base64');
  const signature = crypto.createHmac('sha256', key).update(payload).digest('hex');
  return { encrypted: payload, signature };
}

export function decryptMessage(encrypted: string, key: Buffer, signature: string): string {
  const expected = crypto.createHmac('sha256', key).update(encrypted).digest('hex');
  if (expected !== signature) throw new Error('INTEGRITY_FAILED');
  const buf = Buffer.from(encrypted, 'base64');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const data = buf.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

export async function ensureConversationKey(conversationId: string, actorId?: string) {
  let record = await ConversationKey.findOne({ conversationId, deletedAt: null }).sort({ version: -1 });
  if (record) return record;

  const { keyId, key } = generateConversationKey(conversationId);
  const wrapped = crypto.createHmac('sha256', MASTER_SECRET).update(key).digest('hex');

  record = await ConversationKey.create({
    conversationId,
    keyId,
    encryptedKey: wrapped,
    algorithm: 'AES-256-GCM',
    version: 1,
    trustedDeviceIds: [],
    createdBy: actorId ? new Types.ObjectId(actorId) : undefined,
  });
  return record;
}

export async function getConversationKeyMaterial(conversationId: string): Promise<{ keyId: string; key: Buffer }> {
  const record = await ensureConversationKey(conversationId);
  const key = crypto.createHmac('sha256', MASTER_SECRET).update(record.encryptedKey).digest();
  return { keyId: record.keyId, key };
}

export function encryptAttachment(data: Buffer, key: Buffer): { encrypted: string; checksum: string } {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  const tag = cipher.getAuthTag();
  const payload = Buffer.concat([iv, tag, encrypted]);
  const checksum = crypto.createHash('sha256').update(payload).digest('hex');
  return { encrypted: payload.toString('base64'), checksum };
}

export function validateSession(deviceId: string, trustedDeviceIds: string[]): boolean {
  if (trustedDeviceIds.length === 0) return true;
  return trustedDeviceIds.includes(deviceId);
}

export async function registerTrustedDevice(conversationId: string, deviceId: string, actorId: string) {
  const record = await ensureConversationKey(conversationId, actorId);
  if (!record.trustedDeviceIds.includes(deviceId)) {
    record.trustedDeviceIds.push(deviceId);
    record.updatedBy = new Types.ObjectId(actorId);
    await record.save();
  }
  return record;
}
