import { Types } from 'mongoose';
import crypto from 'crypto';
import { EmsPersonnel } from '../database/models/EmsPersonnel';
import { EmsRoleConfig } from '../database/models/EmsRoleConfig';
import {
  EMS_APP_BUNDLE,
  EMS_ROLES,
  DEFAULT_EMS_ROLE_PERMISSIONS,
  type EmsPermission,
  type EmsRole,
} from '../constants/ems';
import { checkPermission } from './permissionBrokerService';
import { logAudit } from './auditService';

export async function seedEmsRoleConfigs(): Promise<void> {
  for (const role of EMS_ROLES) {
    await EmsRoleConfig.findOneAndUpdate(
      { role },
      { role, permissions: DEFAULT_EMS_ROLE_PERMISSIONS[role] },
      { upsert: true }
    );
  }
}

export async function getPersonnelProfile(userId: string) {
  return EmsPersonnel.findOne({ userId, deletedAt: null });
}

export async function requirePersonnel(userId: string) {
  const personnel = await getPersonnelProfile(userId);
  if (!personnel) throw new Error('NOT_EMS_PERSONNEL');
  return personnel;
}

export async function getRolePermissions(role: EmsRole): Promise<EmsPermission[]> {
  const config = await EmsRoleConfig.findOne({ role });
  return (config?.permissions ?? DEFAULT_EMS_ROLE_PERMISSIONS[role]) as EmsPermission[];
}

export async function updateRolePermissions(
  role: EmsRole,
  permissions: EmsPermission[],
  actorId: string
): Promise<EmsPermission[]> {
  await EmsRoleConfig.findOneAndUpdate(
    { role },
    { role, permissions, updatedBy: new Types.ObjectId(actorId) },
    { upsert: true }
  );
  await logAudit({
    userId: actorId,
    actorId,
    action: 'ems_rbac_update',
    resource: 'ems_rbac',
    resourceId: role,
    metadata: { permissions },
  });
  return permissions;
}

export async function checkEmsPermission(
  userId: string,
  permission: EmsPermission,
  userRole?: string
): Promise<boolean> {
  if (userRole === 'admin') return true;

  const hasApp = await checkPermission(userId, EMS_APP_BUNDLE, 'location');
  if (!hasApp) return false;

  const personnel = await getPersonnelProfile(userId);
  if (!personnel) return false;

  const permissions = await getRolePermissions(personnel.role);
  return permissions.includes(permission);
}

export async function assertEmsPermission(
  userId: string,
  permission: EmsPermission,
  userRole?: string
): Promise<void> {
  const allowed = await checkEmsPermission(userId, permission, userRole);
  if (!allowed) throw new Error('PERMISSION_DENIED');
}

export function createDigitalSignature(badgeNumber: string, payload: string): string {
  return crypto.createHash('sha256').update(`${badgeNumber}:${payload}:${Date.now()}`).digest('hex');
}

export function formatPersonnel(
  personnel: InstanceType<typeof EmsPersonnel>,
  user?: { displayName?: string; username?: string; avatar?: string }
) {
  return {
    userId: personnel.userId.toString(),
    badgeNumber: personnel.badgeNumber,
    role: personnel.role,
    title: personnel.title,
    department: personnel.department,
    hospitalId: personnel.hospitalId,
    unitId: personnel.unitId,
    status: personnel.status,
    licenseNumber: personnel.licenseNumber,
    latitude: personnel.latitude,
    longitude: personnel.longitude,
    district: personnel.district,
    displayName: user?.displayName,
    username: user?.username,
    avatar: user?.avatar,
    lastStatusAt: personnel.lastStatusAt?.toISOString(),
  };
}
