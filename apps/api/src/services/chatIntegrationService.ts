import crypto from 'crypto';
import { CHAT_APP_BUNDLE } from '../constants/chat';
import { checkPermission } from './permissionBrokerService';
import { logAudit } from './auditService';
import { emitToUser } from './socketService';

export async function getIntegrationStatus(userId: string): Promise<Record<string, boolean>> {
  const bundles = {
    communication: 'com.gulfos.communication',
    identity: 'com.gulfos.identity',
    contacts: 'com.gulfos.contacts',
    phone: 'com.gulfos.phone',
    browser: 'com.gulfos.browser',
    files: 'com.gulfos.files',
    gallery: 'com.gulfos.gallery',
    camera: 'com.gulfos.camera',
    recorder: 'com.gulfos.recorder',
    maps: 'com.gulfos.maps',
    bank: 'com.gulfos.bank',
  };
  const entries = await Promise.all(
    Object.entries(bundles).map(async ([key, bundle]) => [key, await checkPermission(userId, bundle, 'network')])
  );
  return Object.fromEntries(entries);
}

export async function logChatAction(
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
    metadata: { appId: CHAT_APP_BUNDLE, ...metadata },
  });
}

export function sendChatNotification(userId: string, title: string, body: string, data?: Record<string, unknown>) {
  emitToUser(userId, 'chat:notification' as never, {
    title,
    body,
    ...data,
    timestamp: new Date().toISOString(),
  });
}

export function generateInviteCode(): string {
  return crypto.randomBytes(6).toString('hex');
}

export async function verifyTrustedDevice(userId: string, deviceUuid: string, deviceName: string) {
  return { deviceUuid, deviceName, verified: true };
}

export function buildContactCard(userId: string, displayName: string, phone?: string) {
  return { type: 'contact', userId, displayName, phone, deepLink: `gulfos://chat/user/${userId}` };
}

export function buildIdentityCard(userId: string, displayName: string, verified: boolean) {
  return { type: 'identity_card', userId, displayName, verified, issuer: 'GULF Identity' };
}

export function buildBankTransferCard(amount: number, currency: string, reference: string) {
  return { type: 'bank_transfer', amount, currency, reference, appBundle: 'com.gulfos.bank' };
}

export function buildLocationShare(latitude: number, longitude: number, label?: string) {
  return { type: 'location', latitude, longitude, label, mapsDeepLink: `gulfos://maps?lat=${latitude}&lng=${longitude}` };
}

export function buildQrMessage(payload: string) {
  return { type: 'qr', payload };
}

export function mapChatRoleToConversationRole(role: string): 'owner' | 'admin' | 'moderator' | 'member' | 'viewer' {
  if (role === 'guest') return 'viewer';
  if (['owner', 'admin', 'moderator', 'member', 'viewer'].includes(role)) {
    return role as 'owner' | 'admin' | 'moderator' | 'member' | 'viewer';
  }
  return 'member';
}

export function mapConversationRoleToChat(role: string): string {
  if (role === 'viewer') return 'guest';
  return role;
}
