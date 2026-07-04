import { Types } from 'mongoose';
import { PoliceOfficer } from '../database/models/PoliceOfficer';
import { PoliceRoleConfig } from '../database/models/PoliceRoleConfig';
import {
  POLICE_APP_BUNDLE,
  POLICE_ROLES,
  DEFAULT_ROLE_PERMISSIONS,
  type PolicePermission,
  type PoliceRole,
} from '../constants/police';
import { checkPermission } from './permissionBrokerService';
import { logAudit } from './auditService';

export async function seedPoliceRoleConfigs(): Promise<void> {
  for (const role of POLICE_ROLES) {
    await PoliceRoleConfig.findOneAndUpdate(
      { role },
      { role, permissions: DEFAULT_ROLE_PERMISSIONS[role] },
      { upsert: true }
    );
  }
}

export async function getOfficerProfile(userId: string) {
  return PoliceOfficer.findOne({ userId, deletedAt: null });
}

export async function requireOfficer(userId: string) {
  const officer = await getOfficerProfile(userId);
  if (!officer) throw new Error('NOT_AN_OFFICER');
  return officer;
}

export async function getRolePermissions(role: PoliceRole): Promise<PolicePermission[]> {
  const config = await PoliceRoleConfig.findOne({ role });
  return (config?.permissions ?? DEFAULT_ROLE_PERMISSIONS[role]) as PolicePermission[];
}

export async function updateRolePermissions(
  role: PoliceRole,
  permissions: PolicePermission[],
  actorId: string
): Promise<PolicePermission[]> {
  await PoliceRoleConfig.findOneAndUpdate(
    { role },
    { role, permissions, updatedBy: new Types.ObjectId(actorId) },
    { upsert: true }
  );
  await logAudit({
    userId: actorId,
    actorId,
    action: 'police_rbac_update',
    resource: 'police_rbac',
    resourceId: role,
    metadata: { permissions },
  });
  return permissions;
}

export async function checkPolicePermission(
  userId: string,
  permission: PolicePermission,
  userRole?: string
): Promise<boolean> {
  if (userRole === 'admin') return true;

  const hasApp = await checkPermission(userId, POLICE_APP_BUNDLE, 'location');
  if (!hasApp) return false;

  const officer = await getOfficerProfile(userId);
  if (!officer) return false;

  const permissions = await getRolePermissions(officer.role);
  return permissions.includes(permission);
}

export async function assertPolicePermission(
  userId: string,
  permission: PolicePermission,
  userRole?: string
): Promise<void> {
  const allowed = await checkPolicePermission(userId, permission, userRole);
  if (!allowed) throw new Error('PERMISSION_DENIED');
}

export function formatOfficer(officer: InstanceType<typeof PoliceOfficer>, user?: { displayName?: string; username?: string; avatar?: string }) {
  return {
    userId: officer.userId.toString(),
    badgeNumber: officer.badgeNumber,
    role: officer.role,
    rank: officer.rank,
    unitId: officer.unitId,
    unitCode: officer.unitCode,
    status: officer.status,
    callsign: officer.callsign,
    latitude: officer.latitude,
    longitude: officer.longitude,
    district: officer.district,
    street: officer.street,
    postalCode: officer.postalCode,
    points: officer.points,
    displayName: user?.displayName,
    username: user?.username,
    avatar: user?.avatar,
    lastStatusAt: officer.lastStatusAt?.toISOString(),
  };
}
