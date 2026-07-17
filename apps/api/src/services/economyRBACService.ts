import { Types } from 'mongoose';
import crypto from 'crypto';
import { EconomyRoleModel } from '../database/models/EconomyRole';
import {
  ECONOMY_APP_BUNDLE,
  ECONOMY_ROLES,
  DEFAULT_ECONOMY_ROLE_PERMISSIONS,
  type EconomyPermission,
  type EconomyRole,
} from '../constants/economy';
import { checkPermission } from './permissionBrokerService';
import { logAudit } from './auditService';

export async function seedEconomyRoleConfigs(): Promise<void> {
  for (const role of ECONOMY_ROLES) {
    await EconomyRoleModel.findOneAndUpdate(
      { roleId: `EROLE-${role}` },
      { roleId: `EROLE-${role}`, role, permissions: DEFAULT_ECONOMY_ROLE_PERMISSIONS[role], isSystem: true },
      { upsert: true }
    );
  }
}

export async function getRolePermissions(role: EconomyRole): Promise<EconomyPermission[]> {
  const config = await EconomyRoleModel.findOne({ role });
  return (config?.permissions ?? DEFAULT_ECONOMY_ROLE_PERMISSIONS[role]) as EconomyPermission[];
}

export async function updateRolePermissions(
  role: EconomyRole,
  permissions: EconomyPermission[],
  actorId: string
): Promise<EconomyPermission[]> {
  await EconomyRoleModel.findOneAndUpdate(
    { role },
    { roleId: `EROLE-${role}`, role, permissions, updatedBy: new Types.ObjectId(actorId) },
    { upsert: true }
  );
  await logAudit({
    userId: actorId,
    actorId,
    action: 'economy_rbac_update',
    resource: 'economy_rbac',
    resourceId: role,
    metadata: { permissions },
  });
  return permissions;
}

export async function checkEconomyPermission(
  userId: string,
  permission: EconomyPermission,
  userRole?: string
): Promise<boolean> {
  if (userRole === 'admin') return true;
  const hasApp = await checkPermission(userId, ECONOMY_APP_BUNDLE, 'location');
  if (!hasApp) return false;
  const defaultRole: EconomyRole = 'analyst';
  const permissions = await getRolePermissions(defaultRole);
  return permissions.includes(permission);
}

export async function assertEconomyPermission(
  userId: string,
  permission: EconomyPermission,
  userRole?: string
): Promise<void> {
  const allowed = await checkEconomyPermission(userId, permission, userRole);
  if (!allowed) throw new Error('PERMISSION_DENIED');
}

export function createDigitalSignature(actorId: string, payload: string): string {
  return crypto.createHash('sha256').update(`${actorId}:${payload}:${Date.now()}`).digest('hex');
}
