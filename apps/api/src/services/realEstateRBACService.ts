import { Types } from 'mongoose';
import crypto from 'crypto';
import { PropertyRole } from '../database/models/PropertyRole';
import {
  REAL_ESTATE_APP_BUNDLE,
  REAL_ESTATE_ROLES,
  DEFAULT_REAL_ESTATE_ROLE_PERMISSIONS,
  type RealEstatePermission,
  type RealEstateRole,
} from '../constants/realEstate';
import { checkPermission } from './permissionBrokerService';
import { logAudit } from './auditService';

export async function seedRealEstateRoleConfigs(): Promise<void> {
  for (const role of REAL_ESTATE_ROLES) {
    await PropertyRole.findOneAndUpdate(
      { role },
      { role, permissions: DEFAULT_REAL_ESTATE_ROLE_PERMISSIONS[role] },
      { upsert: true }
    );
  }
}

export async function getRolePermissions(role: RealEstateRole): Promise<RealEstatePermission[]> {
  const config = await PropertyRole.findOne({ role });
  return (config?.permissions ?? DEFAULT_REAL_ESTATE_ROLE_PERMISSIONS[role]) as RealEstatePermission[];
}

export async function updateRolePermissions(
  role: RealEstateRole,
  permissions: RealEstatePermission[],
  actorId: string
): Promise<RealEstatePermission[]> {
  await PropertyRole.findOneAndUpdate(
    { role },
    { role, permissions, updatedBy: new Types.ObjectId(actorId) },
    { upsert: true }
  );
  await logAudit({
    userId: actorId,
    actorId,
    action: 'realestate_rbac_update',
    resource: 'realestate_rbac',
    resourceId: role,
    metadata: { permissions },
  });
  return permissions;
}

export async function checkRealEstatePermission(
  userId: string,
  permission: RealEstatePermission,
  userRole?: string
): Promise<boolean> {
  if (userRole === 'admin') return true;

  const hasApp = await checkPermission(userId, REAL_ESTATE_APP_BUNDLE, 'location');
  if (!hasApp) return false;

  const defaultRole: RealEstateRole = userRole === 'admin' ? 'platform_admin' : 'owner';
  const permissions = await getRolePermissions(defaultRole);
  return permissions.includes(permission);
}

export async function assertRealEstatePermission(
  userId: string,
  permission: RealEstatePermission,
  userRole?: string
): Promise<void> {
  const allowed = await checkRealEstatePermission(userId, permission, userRole);
  if (!allowed) throw new Error('PERMISSION_DENIED');
}

export function createDigitalSignature(actorId: string, payload: string): string {
  return crypto.createHash('sha256').update(`${actorId}:${payload}:${Date.now()}`).digest('hex');
}
