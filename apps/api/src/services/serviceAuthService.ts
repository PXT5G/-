import { timingSafeEqual } from 'crypto';
import { env } from '../config/env';
import { hashServiceToken } from './tokenEncryptionService';

export function isServiceAuthConfigured(): boolean {
  return Boolean(env.SERVICE_AUTH_TOKEN);
}

export function verifyServiceToken(token: string | undefined): boolean {
  if (!token) return false;
  const current = env.SERVICE_AUTH_TOKEN;
  const previous = env.SERVICE_AUTH_TOKEN_PREVIOUS;
  if (!current && !previous) return false;
  if (current && safeEqual(token, current)) return true;
  if (previous && safeEqual(token, previous)) return true;
  return false;
}

function safeEqual(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function getServiceAuthFingerprint(): string | null {
  const current = env.SERVICE_AUTH_TOKEN;
  if (!current) return null;
  return hashServiceToken(current).slice(0, 12);
}
