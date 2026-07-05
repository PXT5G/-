import { Types } from 'mongoose';
import crypto from 'crypto';
import { AircraftRoleModel } from '../database/models/AircraftRole';
import {
  AVIATION_APP_BUNDLE,
  AVIATION_ROLES,
  DEFAULT_AVIATION_ROLE_PERMISSIONS,
  type AviationPermission,
  type AviationRole,
} from '../constants/aviation';
import { checkPermission } from './permissionBrokerService';
import { logAudit } from './auditService';

export async function seedAviationRoleConfigs(): Promise<void> {
  for (const role of AVIATION_ROLES) {
    await AircraftRoleModel.findOneAndUpdate(
      { role },
      { role, permissions: DEFAULT_AVIATION_ROLE_PERMISSIONS[role] },
      { upsert: true }
    );
  }
}

export async function getRolePermissions(role: AviationRole): Promise<AviationPermission[]> {
  const config = await AircraftRoleModel.findOne({ role });
  return (config?.permissions ?? DEFAULT_AVIATION_ROLE_PERMISSIONS[role]) as AviationPermission[];
}

export async function updateRolePermissions(
  role: AviationRole,
  permissions: AviationPermission[],
  actorId: string
): Promise<AviationPermission[]> {
  await AircraftRoleModel.findOneAndUpdate(
    { role },
    { role, permissions, updatedBy: new Types.ObjectId(actorId) },
    { upsert: true }
  );
  await logAudit({
    userId: actorId,
    actorId,
    action: 'aviation_rbac_update',
    resource: 'aviation_rbac',
    resourceId: role,
    metadata: { permissions },
  });
  return permissions;
}

export async function checkAviationPermission(
  userId: string,
  permission: AviationPermission,
  userRole?: string
): Promise<boolean> {
  if (userRole === 'admin') return true;
  const hasApp = await checkPermission(userId, AVIATION_APP_BUNDLE, 'location');
  if (!hasApp) return false;
  const defaultRole: AviationRole = userRole === 'admin' ? 'platform_admin' : 'buyer';
  const permissions = await getRolePermissions(defaultRole);
  return permissions.includes(permission);
}

export async function assertAviationPermission(
  userId: string,
  permission: AviationPermission,
  userRole?: string
): Promise<void> {
  const allowed = await checkAviationPermission(userId, permission, userRole);
  if (!allowed) throw new Error('PERMISSION_DENIED');
}

export function createDigitalSignature(actorId: string, payload: string): string {
  return crypto.createHash('sha256').update(`${actorId}:${payload}:${Date.now()}`).digest('hex');
}
