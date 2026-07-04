import crypto from 'crypto';
import { Types } from 'mongoose';
import { BROWSER_APP_BUNDLE } from '../constants/browser';
import { checkPermission } from './permissionBrokerService';
import { logAudit } from './auditService';
import { emitToUser } from './socketService';

const MASTER_SECRET = process.env.BROWSER_MASTER_KEY ?? process.env.COMMUNICATION_MASTER_KEY ?? 'gulfos-browser-master-key-v1';

function userKey(userId: string): Buffer {
  return crypto.createHmac('sha256', MASTER_SECRET).update(`browser:${userId}`).digest();
}

export function encryptBrowserSecret(userId: string, value: string): string {
  const key = userKey(userId);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

export function decryptBrowserSecret(userId: string, payload: string): string {
  const key = userKey(userId);
  const buf = Buffer.from(payload, 'base64');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const data = buf.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

export async function canAccessIdentity(userId: string): Promise<boolean> {
  const { checkBrowserPermission } = await import('./browserRBACService');
  return checkBrowserPermission(userId, 'portal.government');
}

export async function canAccessBank(userId: string): Promise<boolean> {
  return checkPermission(userId, 'com.gulfos.bank', 'network');
}

export async function canAccessPolice(userId: string): Promise<boolean> {
  return checkPermission(userId, 'com.gulfos.police', 'network');
}

export async function canAccessJustice(userId: string): Promise<boolean> {
  const { checkBrowserPermission } = await import('./browserRBACService');
  return checkBrowserPermission(userId, 'portal.justice');
}

export async function canAccessDarkWeb(userId: string): Promise<boolean> {
  return checkBrowserPortal(userId, 'portal.dark_web');
}

export async function canUseVpn(userId: string): Promise<boolean> {
  const { checkBrowserPermission } = await import('./browserRBACService');
  return checkBrowserPermission(userId, 'browser.access');
}

async function checkBrowserPortal(userId: string, permission: string): Promise<boolean> {
  const { checkBrowserPermission } = await import('./browserRBACService');
  return checkBrowserPermission(userId, permission as never);
}

export async function getIntegrationStatus(userId: string): Promise<Record<string, boolean>> {
  const [identity, bank, police, justice, darkWeb, vpn] = await Promise.all([
    canAccessIdentity(userId),
    canAccessBank(userId),
    canAccessPolice(userId),
    canAccessJustice(userId),
    canAccessDarkWeb(userId),
    canUseVpn(userId),
  ]);
  return { identity, bank, police, justice, darkWeb, vpn };
}

export async function logBrowserAction(
  userId: string,
  action: string,
  resource: string,
  resourceId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await logAudit({
    userId,
    actorId: userId,
    action,
    resource,
    resourceId,
    metadata,
  });
}

export function sendBrowserNotification(userId: string, title: string, body: string, data?: Record<string, unknown>) {
  emitToUser(userId, 'browser:notification' as never, {
    title,
    body,
    ...data,
    timestamp: new Date().toISOString(),
  });
}

export function validateHttps(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || url.startsWith('about:');
  } catch {
    return false;
  }
}

export function normalizeOrigin(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return url;
  }
}

export function inferDownloadType(mimeType: string, filename: string): string {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.includes('zip') || filename.endsWith('.zip')) return 'zip';
  if (mimeType.includes('document') || filename.match(/\.(doc|docx|txt|rtf)$/i)) return 'document';
  if (mimeType.includes('application')) return 'application';
  return 'other';
}

export function generateQrPayload(url: string): { dataUrl: string; payload: string } {
  const payload = url;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#fff"/><text x="50" y="55" text-anchor="middle" font-size="8" fill="#000">QR</text></svg>`;
  const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  return { dataUrl, payload };
}

export function parseQrScanResult(raw: string): { url: string; valid: boolean } {
  try {
    const parsed = new URL(raw);
    return { url: parsed.href, valid: parsed.protocol === 'https:' || parsed.protocol === 'http:' };
  } catch {
    return { url: raw, valid: false };
  }
}

export function translatePageContent(content: string, targetLang: string): string {
  const header = `> Translated to **${targetLang}** via GULF Translate\n\n`;
  return header + content;
}

export function findInPageContent(content: string, query: string): { matches: number; highlights: string } {
  if (!query.trim()) return { matches: 0, highlights: content };
  const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  const matches = (content.match(regex) ?? []).length;
  const highlights = content.replace(regex, (m) => `**${m}**`);
  return { matches, highlights };
}

export function buildReaderModeContent(title: string, content: string): string {
  return `# ${title}\n\n${content.replace(/^#+\s*/gm, '')}`;
}

export function buildSharePayload(url: string, title: string) {
  return {
    url,
    title,
    text: `Check out ${title} on GULF Browser`,
    deepLink: `gulfos://browser/open?url=${encodeURIComponent(url)}`,
  };
}

export async function resolveDeepLink(url: string): Promise<{ appBundle?: string; nativeUrl?: string }> {
  if (url.includes('bank.gulfos')) return { appBundle: 'com.gulfos.bank', nativeUrl: 'gulfos://bank' };
  if (url.includes('police.gulfos')) return { appBundle: 'com.gulfos.police', nativeUrl: 'gulfos://police' };
  if (url.includes('justice.gulfos')) return { appBundle: 'com.gulfos.justice', nativeUrl: 'gulfos://justice' };
  if (url.includes('maps.gulfos') || url.startsWith('geo:')) return { appBundle: 'com.gulfos.maps', nativeUrl: 'gulfos://maps' };
  if (url.includes('chat.gulfos')) return { appBundle: 'com.gulfos.chat', nativeUrl: 'gulfos://chat' };
  return {};
}
