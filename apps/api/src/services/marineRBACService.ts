import { Types } from 'mongoose';
import crypto from 'crypto';
import { MarineRoleModel } from '../database/models/MarineRole';
import {
  MARINE_APP_BUNDLE,
  MARINE_ROLES,
  DEFAULT_MARINE_ROLE_PERMISSIONS,
  type MarinePermission,
  type MarineRole,
} from '../constants/marine';
import { checkPermission } from './permissionBrokerService';
import { logAudit } from './auditService';

export async function seedMarineRoleConfigs(): Promise<void> {
  for (const role of MARINE_ROLES) {
    await MarineRoleModel.findOneAndUpdate(
      { role },
      { role, permissions: DEFAULT_MARINE_ROLE_PERMISSIONS[role] },
      { upsert: true }
    );
  }
}

export async function getRolePermissions(role: MarineRole): Promise<MarinePermission[]> {
  const config = await MarineRoleModel.findOne({ role });
  return (config?.permissions ?? DEFAULT_MARINE_ROLE_PERMISSIONS[role]) as MarinePermission[];
}

export async function updateRolePermissions(
  role: MarineRole,
  permissions: MarinePermission[],
  actorId: string
): Promise<MarinePermission[]> {
  await MarineRoleModel.findOneAndUpdate(
    { role },
    { role, permissions, updatedBy: new Types.ObjectId(actorId) },
    { upsert: true }
  );
  await logAudit({
    userId: actorId,
    actorId,
    action: 'marine_rbac_update',
    resource: 'marine_rbac',
    resourceId: role,
    metadata: { permissions },
  });
  return permissions;
}

export async function checkMarinePermission(
  userId: string,
  permission: MarinePermission,
  userRole?: string
): Promise<boolean> {
  if (userRole === 'admin') return true;
  const hasApp = await checkPermission(userId, MARINE_APP_BUNDLE, 'location');
  if (!hasApp) return false;
  const defaultRole: MarineRole = userRole === 'admin' ? 'platform_admin' : 'buyer';
  const permissions = await getRolePermissions(defaultRole);
  return permissions.includes(permission);
}

export async function assertMarinePermission(
  userId: string,
  permission: MarinePermission,
  userRole?: string
): Promise<void> {
  const allowed = await checkMarinePermission(userId, permission, userRole);
  if (!allowed) throw new Error('PERMISSION_DENIED');
}

export function createDigitalSignature(actorId: string, payload: string): string {
  return crypto.createHash('sha256').update(`${actorId}:${payload}:${Date.now()}`).digest('hex');
}
