import crypto from 'crypto';
import { Types } from 'mongoose';
import {
  IDENTITY_APP_BUNDLE,
  IDENTITY_ROLES,
  DEFAULT_IDENTITY_ROLE_PERMISSIONS,
  type IdentityPermission,
  type IdentityRole,
} from '../constants/identity';
import { checkPermission } from './permissionBrokerService';
import { logAudit } from './auditService';

export async function assertIdentityAccess(userId: string): Promise<void> {
  const allowed = await checkPermission(userId, IDENTITY_APP_BUNDLE, 'identity');
  if (!allowed) throw new Error('IDENTITY_PERMISSION_DENIED');
}

export async function getUserIdentityRole(_userId: string): Promise<IdentityRole> {
  return 'citizen';
}

export async function getIdentityPermissions(userId: string): Promise<IdentityPermission[]> {
  const role = await getUserIdentityRole(userId);
  return DEFAULT_IDENTITY_ROLE_PERMISSIONS[role];
}

export async function requireIdentityPermission(userId: string, permission: IdentityPermission): Promise<void> {
  await assertIdentityAccess(userId);
  const permissions = await getIdentityPermissions(userId);
  if (!permissions.includes(permission)) throw new Error('IDENTITY_RBAC_DENIED');
}

export function generateNationalId(userId: string): string {
  const hash = crypto.createHash('sha256').update(userId).digest('hex').slice(0, 10).toUpperCase();
  return `GULF-${hash}`;
}

export function generateQrCode(identityId: string): string {
  return crypto.createHash('sha256').update(`qr:${identityId}:${Date.now()}`).digest('hex');
}

export function generateNfcTagId(identityId: string): string {
  return `NFC-${identityId.replace('ID-', '')}`;
}

export function createDigitalSignature(identityId: string, data: string): string {
  return crypto.createHmac('sha256', identityId).update(data).digest('hex');
}

export async function verifyQrCode(qrCode: string, identityId: string): Promise<boolean> {
  const identity = await import('../database/models/CitizenIdentity').then((m) =>
    m.CitizenIdentity.findOne({ identityId, qrCode, deletedAt: null })
  );
  return !!identity;
}

export { IDENTITY_ROLES, DEFAULT_IDENTITY_ROLE_PERMISSIONS };
