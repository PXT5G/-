import { Types } from 'mongoose';
import crypto from 'crypto';
import { ExchangeRoleModel } from '../database/models/ExchangeRole';
import {
  EXCHANGE_APP_BUNDLE,
  EXCHANGE_ROLES,
  DEFAULT_EXCHANGE_ROLE_PERMISSIONS,
  type ExchangePermission,
  type ExchangeRole,
} from '../constants/exchange';
import { checkPermission } from './permissionBrokerService';
import { logAudit } from './auditService';

export async function seedExchangeRoleConfigs(): Promise<void> {
  for (const role of EXCHANGE_ROLES) {
    await ExchangeRoleModel.findOneAndUpdate(
      { roleId: `XROLE-${role}` },
      { roleId: `XROLE-${role}`, role, permissions: DEFAULT_EXCHANGE_ROLE_PERMISSIONS[role], isSystem: true },
      { upsert: true }
    );
  }
}

export async function getRolePermissions(role: ExchangeRole): Promise<ExchangePermission[]> {
  const config = await ExchangeRoleModel.findOne({ role });
  return (config?.permissions ?? DEFAULT_EXCHANGE_ROLE_PERMISSIONS[role]) as ExchangePermission[];
}

export async function checkExchangePermission(
  userId: string,
  permission: ExchangePermission,
  userRole?: string
): Promise<boolean> {
  if (userRole === 'admin') return true;
  const hasApp = await checkPermission(userId, EXCHANGE_APP_BUNDLE, 'location');
  if (!hasApp) return false;
  const permissions = await getRolePermissions('investor');
  return permissions.includes(permission);
}

export async function assertExchangePermission(
  userId: string,
  permission: ExchangePermission,
  userRole?: string
): Promise<void> {
  const allowed = await checkExchangePermission(userId, permission, userRole);
  if (!allowed) throw new Error('PERMISSION_DENIED');
}

export function createDigitalSignature(actorId: string, payload: string): string {
  return crypto.createHash('sha256').update(`${actorId}:${payload}:${Date.now()}`).digest('hex');
}
