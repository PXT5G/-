import { Types } from 'mongoose';
import { ChatProfile } from '../database/models/ChatProfile';
import { ChatRoleConfig } from '../database/models/ChatRoleConfig';
import {
  CHAT_APP_BUNDLE,
  CHAT_ROLES,
  DEFAULT_CHAT_ROLE_PERMISSIONS,
  type ChatPermission,
  type ChatRole,
} from '../constants/chat';
import { checkPermission } from './permissionBrokerService';
import { logAudit } from './auditService';

export async function seedChatRoleConfigs(): Promise<void> {
  for (const role of CHAT_ROLES) {
    await ChatRoleConfig.findOneAndUpdate(
      { role },
      { role, permissions: DEFAULT_CHAT_ROLE_PERMISSIONS[role] },
      { upsert: true }
    );
  }
}

export async function getChatProfile(userId: string) {
  return ChatProfile.findOne({ userId, deletedAt: null });
}

export async function requireChatProfile(userId: string) {
  const profile = await getChatProfile(userId);
  if (!profile) throw new Error('CHAT_NOT_INITIALIZED');
  return profile;
}

export async function getRolePermissions(role: ChatRole): Promise<ChatPermission[]> {
  const config = await ChatRoleConfig.findOne({ role });
  return (config?.permissions ?? DEFAULT_CHAT_ROLE_PERMISSIONS[role]) as ChatPermission[];
}

export async function updateRolePermissions(
  role: ChatRole,
  permissions: ChatPermission[],
  actorId: string
): Promise<ChatPermission[]> {
  await ChatRoleConfig.findOneAndUpdate(
    { role },
    { role, permissions, updatedBy: new Types.ObjectId(actorId) },
    { upsert: true }
  );
  await logAudit({
    userId: actorId,
    actorId,
    action: 'chat_rbac_update',
    resource: 'chat_rbac',
    resourceId: role,
    metadata: { permissions },
  });
  return permissions;
}

export async function checkChatPermission(
  userId: string,
  permission: ChatPermission,
  userRole?: string
): Promise<boolean> {
  if (userRole === 'admin') return true;

  const hasApp = await checkPermission(userId, CHAT_APP_BUNDLE, 'network');
  if (!hasApp) return false;

  const profile = await getChatProfile(userId);
  if (!profile) return false;

  const permissions = await getRolePermissions(profile.role);
  return permissions.includes(permission);
}

export async function assertChatPermission(
  userId: string,
  permission: ChatPermission,
  userRole?: string
): Promise<void> {
  const ok = await checkChatPermission(userId, permission, userRole);
  if (!ok) throw new Error('PERMISSION_DENIED');
}

export function formatChatProfile(profile: InstanceType<typeof ChatProfile>) {
  return {
    userId: profile.userId.toString(),
    role: profile.role,
    displayName: profile.displayName,
    about: profile.about,
    avatarUrl: profile.avatarUrl,
    biometricLock: profile.biometricLock,
    initialized: profile.initialized,
  };
}
