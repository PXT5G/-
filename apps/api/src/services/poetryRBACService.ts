import { Types } from 'mongoose';
import { PoetryProfile } from '../database/models/PoetryProfile';
import { PoetryRoleConfig } from '../database/models/PoetryRoleConfig';
import {
  POETRY_APP_BUNDLE,
  POETRY_ROLES,
  DEFAULT_ROLE_PERMISSIONS,
  type PoetryPermission,
  type PoetryRole,
} from '../constants/poetry';
import { checkPermission } from './permissionBrokerService';
import { logAudit } from './auditService';

export async function seedPoetryRoleConfigs(): Promise<void> {
  for (const role of POETRY_ROLES) {
    await PoetryRoleConfig.findOneAndUpdate(
      { role },
      { role, permissions: DEFAULT_ROLE_PERMISSIONS[role] },
      { upsert: true }
    );
  }
}

export async function getPoetProfile(userId: string) {
  return PoetryProfile.findOne({ userId, deletedAt: null });
}

export async function requirePoet(userId: string) {
  const profile = await getPoetProfile(userId);
  if (!profile) throw new Error('NOT_A_POET');
  return profile;
}

export async function getRolePermissions(role: PoetryRole): Promise<PoetryPermission[]> {
  const config = await PoetryRoleConfig.findOne({ role });
  return (config?.permissions ?? DEFAULT_ROLE_PERMISSIONS[role]) as PoetryPermission[];
}

export async function updateRolePermissions(
  role: PoetryRole,
  permissions: PoetryPermission[],
  actorId: string
): Promise<PoetryPermission[]> {
  await PoetryRoleConfig.findOneAndUpdate(
    { role },
    { role, permissions, updatedBy: new Types.ObjectId(actorId) },
    { upsert: true }
  );
  await logAudit({
    userId: actorId,
    actorId,
    action: 'poetry_rbac_update',
    resource: 'poetry_rbac',
    resourceId: role,
    metadata: { permissions },
  });
  return permissions;
}

export async function checkPoetryPermission(
  userId: string,
  permission: PoetryPermission,
  userRole?: string
): Promise<boolean> {
  if (userRole === 'admin') return true;

  const hasApp = await checkPermission(userId, POETRY_APP_BUNDLE, 'network');
  if (!hasApp) return false;

  const profile = await getPoetProfile(userId);
  if (!profile) return false;

  const permissions = await getRolePermissions(profile.role);
  return permissions.includes(permission);
}

export async function assertPoetryPermission(
  userId: string,
  permission: PoetryPermission,
  userRole?: string
): Promise<void> {
  const allowed = await checkPoetryPermission(userId, permission, userRole);
  if (!allowed) throw new Error('PERMISSION_DENIED');
}

export function formatPoetProfile(
  profile: InstanceType<typeof PoetryProfile>,
  user?: { displayName?: string; username?: string; avatar?: string }
) {
  return {
    userId: profile.userId.toString(),
    role: profile.role,
    displayName: profile.displayName || user?.displayName,
    username: user?.username,
    avatar: profile.avatarUrl || user?.avatar,
    bio: profile.bio,
    verified: profile.verified,
    isServerPoet: profile.isServerPoet,
    badges: profile.badges,
    achievements: profile.achievements,
    awards: profile.awards,
    followerCount: profile.followerCount,
    followingCount: profile.followingCount,
    poemCount: profile.poemCount,
    totalLikes: profile.totalLikes,
    totalViews: profile.totalViews,
    coverImageUrl: profile.coverImageUrl,
    website: profile.website,
  };
}
