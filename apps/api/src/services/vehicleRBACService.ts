import { Types } from 'mongoose';
import crypto from 'crypto';
import { VehicleRoleModel } from '../database/models/VehicleRole';
import {
  VEHICLES_APP_BUNDLE,
  VEHICLE_ROLES,
  DEFAULT_VEHICLE_ROLE_PERMISSIONS,
  type VehiclePermission,
  type VehicleRole,
} from '../constants/vehicles';
import { checkPermission } from './permissionBrokerService';
import { logAudit } from './auditService';

export async function seedVehicleRoleConfigs(): Promise<void> {
  for (const role of VEHICLE_ROLES) {
    await VehicleRoleModel.findOneAndUpdate(
      { role },
      { role, permissions: DEFAULT_VEHICLE_ROLE_PERMISSIONS[role] },
      { upsert: true }
    );
  }
}

export async function getRolePermissions(role: VehicleRole): Promise<VehiclePermission[]> {
  const config = await VehicleRoleModel.findOne({ role });
  return (config?.permissions ?? DEFAULT_VEHICLE_ROLE_PERMISSIONS[role]) as VehiclePermission[];
}

export async function updateRolePermissions(
  role: VehicleRole,
  permissions: VehiclePermission[],
  actorId: string
): Promise<VehiclePermission[]> {
  await VehicleRoleModel.findOneAndUpdate(
    { role },
    { role, permissions, updatedBy: new Types.ObjectId(actorId) },
    { upsert: true }
  );
  await logAudit({
    userId: actorId,
    actorId,
    action: 'vehicles_rbac_update',
    resource: 'vehicles_rbac',
    resourceId: role,
    metadata: { permissions },
  });
  return permissions;
}

export async function checkVehiclePermission(
  userId: string,
  permission: VehiclePermission,
  userRole?: string
): Promise<boolean> {
  if (userRole === 'admin') return true;
  const hasApp = await checkPermission(userId, VEHICLES_APP_BUNDLE, 'location');
  if (!hasApp) return false;
  const defaultRole: VehicleRole = userRole === 'admin' ? 'platform_admin' : 'buyer';
  const permissions = await getRolePermissions(defaultRole);
  return permissions.includes(permission);
}

export async function assertVehiclePermission(
  userId: string,
  permission: VehiclePermission,
  userRole?: string
): Promise<void> {
  const allowed = await checkVehiclePermission(userId, permission, userRole);
  if (!allowed) throw new Error('PERMISSION_DENIED');
}

export function createDigitalSignature(actorId: string, payload: string): string {
  return crypto.createHash('sha256').update(`${actorId}:${payload}:${Date.now()}`).digest('hex');
}
