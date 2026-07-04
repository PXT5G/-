import { Types } from 'mongoose';
import crypto from 'crypto';
import { JusticeOfficial } from '../database/models/JusticeOfficial';
import { JusticeRoleConfig } from '../database/models/JusticeRoleConfig';
import {
  JUSTICE_APP_BUNDLE,
  JUSTICE_ROLES,
  DEFAULT_JUSTICE_ROLE_PERMISSIONS,
  type JusticePermission,
  type JusticeRole,
} from '../constants/justice';
import { checkPermission } from './permissionBrokerService';
import { logAudit } from './auditService';

export async function seedJusticeRoleConfigs(): Promise<void> {
  for (const role of JUSTICE_ROLES) {
    await JusticeRoleConfig.findOneAndUpdate(
      { role },
      { role, permissions: DEFAULT_JUSTICE_ROLE_PERMISSIONS[role] },
      { upsert: true }
    );
  }
}

export async function getOfficialProfile(userId: string) {
  return JusticeOfficial.findOne({ userId, deletedAt: null });
}

export async function requireOfficial(userId: string) {
  const official = await getOfficialProfile(userId);
  if (!official) throw new Error('NOT_A_COURT_OFFICIAL');
  return official;
}

export async function getRolePermissions(role: JusticeRole): Promise<JusticePermission[]> {
  const config = await JusticeRoleConfig.findOne({ role });
  return (config?.permissions ?? DEFAULT_JUSTICE_ROLE_PERMISSIONS[role]) as JusticePermission[];
}

export async function updateRolePermissions(
  role: JusticeRole,
  permissions: JusticePermission[],
  actorId: string
): Promise<JusticePermission[]> {
  await JusticeRoleConfig.findOneAndUpdate(
    { role },
    { role, permissions, updatedBy: new Types.ObjectId(actorId) },
    { upsert: true }
  );
  await logAudit({
    userId: actorId,
    actorId,
    action: 'justice_rbac_update',
    resource: 'justice_rbac',
    resourceId: role,
    metadata: { permissions },
  });
  return permissions;
}

export async function checkJusticePermission(
  userId: string,
  permission: JusticePermission,
  userRole?: string
): Promise<boolean> {
  if (userRole === 'admin') return true;

  const hasApp = await checkPermission(userId, JUSTICE_APP_BUNDLE, 'location');
  if (!hasApp) return false;

  const official = await getOfficialProfile(userId);
  if (!official) return false;

  const permissions = await getRolePermissions(official.role);
  return permissions.includes(permission);
}

export async function assertJusticePermission(
  userId: string,
  permission: JusticePermission,
  userRole?: string
): Promise<void> {
  const allowed = await checkJusticePermission(userId, permission, userRole);
  if (!allowed) throw new Error('PERMISSION_DENIED');
}

export function createDigitalSignature(employeeId: string, payload: string): string {
  return crypto.createHash('sha256').update(`${employeeId}:${payload}:${Date.now()}`).digest('hex');
}

export function formatOfficial(
  official: InstanceType<typeof JusticeOfficial>,
  user?: { displayName?: string; username?: string; avatar?: string }
) {
  return {
    userId: official.userId.toString(),
    employeeId: official.employeeId,
    role: official.role,
    title: official.title,
    department: official.department,
    courtroomId: official.courtroomId,
    status: official.status,
    barNumber: official.barNumber,
    displayName: user?.displayName,
    username: user?.username,
    avatar: user?.avatar,
    lastStatusAt: official.lastStatusAt?.toISOString(),
  };
}
