import crypto from 'crypto';
import { Types } from 'mongoose';
import {
  BANK_APP_BUNDLE,
  BANK_ROLES,
  DEFAULT_BANK_ROLE_PERMISSIONS,
  type BankPermission,
  type BankRole,
} from '../constants/bank';
import { checkPermission } from './permissionBrokerService';
import { logAudit } from './auditService';

export async function assertBankAccess(userId: string): Promise<void> {
  const allowed = await checkPermission(userId, BANK_APP_BUNDLE, 'bank');
  if (!allowed) throw new Error('BANK_PERMISSION_DENIED');
}

export async function getUserBankRole(_userId: string): Promise<BankRole> {
  return 'account_holder';
}

export async function getBankPermissions(userId: string): Promise<BankPermission[]> {
  const role = await getUserBankRole(userId);
  return DEFAULT_BANK_ROLE_PERMISSIONS[role];
}

export async function requireBankPermission(userId: string, permission: BankPermission): Promise<void> {
  await assertBankAccess(userId);
  const permissions = await getBankPermissions(userId);
  if (!permissions.includes(permission)) throw new Error('BANK_RBAC_DENIED');
}

export function generatePersonalIBAN(userId: string): string {
  const hash = crypto.createHash('sha256').update(`personal:${userId}`).digest('hex').slice(0, 18).toUpperCase();
  return `GULF${hash}`;
}

export function generateWalletId(userId: string): string {
  const seq = userId.replace(/\D/g, '').padStart(6, '0').slice(-6);
  return `WLT-P${seq}-${crypto.randomInt(100000, 999999)}`;
}

export function generateAccountNumber(userId: string): string {
  const seq = userId.replace(/\D/g, '').padStart(8, '0').slice(-8);
  return `6200${seq}${crypto.randomInt(1000, 9999)}`;
}

export function generateCardLastFour(): string {
  return String(crypto.randomInt(1000, 9999));
}

export async function seedBankRoleConfigs(): Promise<void> {
  await logAudit({
    userId: 'system',
    actorId: 'system',
    action: 'bank_rbac_seed',
    resource: 'bank_rbac',
    metadata: { roles: BANK_ROLES },
  });
}

export function createTransferSignature(transferId: string, amount: number, userId: string): string {
  return crypto.createHmac('sha256', userId).update(`${transferId}:${amount}`).digest('hex');
}

export async function verifyBiometricApproval(userId: string, signature: string, transferId: string, amount: number): Promise<boolean> {
  const expected = createTransferSignature(transferId, amount, userId);
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export { BANK_ROLES, DEFAULT_BANK_ROLE_PERMISSIONS };
