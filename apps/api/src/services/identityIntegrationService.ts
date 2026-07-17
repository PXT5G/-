import { IDENTITY_APP_BUNDLE } from '../constants/identity';
import { enqueueNotification } from './notificationBrokerService';
import { emitToUser } from './socketService';

export async function notifyIdentityUpdate(userId: string, data: Record<string, unknown>): Promise<void> {
  emitToUser(userId, 'identity:update', data);
}

export async function notifyIdentityVerified(userId: string, identityId: string): Promise<void> {
  await enqueueNotification({
    userId,
    appId: IDENTITY_APP_BUNDLE,
    title: 'Identity Verified',
    body: 'Your digital identity has been verified successfully.',
    priority: 'high',
    groupId: `identity-${identityId}`,
  });
  emitToUser(userId, 'identity:verified', { identityId });
}

export async function notifyDocumentAdded(userId: string, document: Record<string, unknown>): Promise<void> {
  emitToUser(userId, 'identity:document:added', document);
  await enqueueNotification({
    userId,
    appId: IDENTITY_APP_BUNDLE,
    title: 'Document Added',
    body: `New document: ${document.title}`,
    priority: 'normal',
    groupId: `identity-doc-${document.documentId}`,
  });
}

export async function notifyVerificationCompleted(userId: string, method: string, success: boolean): Promise<void> {
  emitToUser(userId, 'identity:verification:completed', { method, success });
}

export function buildIdentityCard(identity: {
  identityId: string;
  fullName: string;
  nationalId: string;
  status: string;
}): Record<string, unknown> {
  return {
    type: 'identity',
    identityId: identity.identityId,
    fullName: identity.fullName,
    nationalId: identity.nationalId,
    status: identity.status,
    appId: IDENTITY_APP_BUNDLE,
  };
}

export function buildQrVerificationPayload(identity: {
  identityId: string;
  fullName: string;
  nationalId: string;
  qrCode: string;
}): Record<string, unknown> {
  return {
    type: 'identity_qr',
    identityId: identity.identityId,
    fullName: identity.fullName,
    nationalId: identity.nationalId,
    qrCode: identity.qrCode,
    verifiedAt: new Date().toISOString(),
    appId: IDENTITY_APP_BUNDLE,
  };
}
