import crypto from 'crypto';
import { env } from '../config/env';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer | null {
  const raw = env.TOKEN_ENCRYPTION_KEY;
  if (!raw) return null;
  return crypto.createHash('sha256').update(raw).digest();
}

export function isTokenEncryptionConfigured(): boolean {
  return Boolean(env.TOKEN_ENCRYPTION_KEY);
}

export function encryptSecret(plaintext: string): string {
  const key = getEncryptionKey();
  if (!key) throw new Error('TOKEN_ENCRYPTION_NOT_CONFIGURED');
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
}

export function decryptSecret(ciphertext: string): string {
  const key = getEncryptionKey();
  if (!key) throw new Error('TOKEN_ENCRYPTION_NOT_CONFIGURED');
  const data = Buffer.from(ciphertext, 'base64');
  const iv = data.subarray(0, IV_LENGTH);
  const authTag = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

export function hashServiceToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
