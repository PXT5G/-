import { Types } from 'mongoose';
import { BrowserProfile } from '../database/models/BrowserProfile';
import { BrowserRoleConfig } from '../database/models/BrowserRoleConfig';
import {
  BROWSER_APP_BUNDLE,
  BROWSER_ROLES,
  DEFAULT_BROWSER_ROLE_PERMISSIONS,
  type BrowserPermission,
  type BrowserRole,
} from '../constants/browser';
import { checkPermission } from './permissionBrokerService';
import { logAudit } from './auditService';

export async function seedBrowserRoleConfigs(): Promise<void> {
  for (const role of BROWSER_ROLES) {
    await BrowserRoleConfig.findOneAndUpdate(
      { role },
      { role, permissions: DEFAULT_BROWSER_ROLE_PERMISSIONS[role] },
      { upsert: true }
    );
  }
}

export async function getBrowserProfile(userId: string) {
  return BrowserProfile.findOne({ userId, deletedAt: null });
}

export async function requireBrowserProfile(userId: string) {
  const profile = await getBrowserProfile(userId);
  if (!profile) throw new Error('BROWSER_NOT_INITIALIZED');
  return profile;
}

export async function getRolePermissions(role: BrowserRole): Promise<BrowserPermission[]> {
  const config = await BrowserRoleConfig.findOne({ role });
  return (config?.permissions ?? DEFAULT_BROWSER_ROLE_PERMISSIONS[role]) as BrowserPermission[];
}

export async function updateRolePermissions(
  role: BrowserRole,
  permissions: BrowserPermission[],
  actorId: string
): Promise<BrowserPermission[]> {
  await BrowserRoleConfig.findOneAndUpdate(
    { role },
    { role, permissions, updatedBy: new Types.ObjectId(actorId) },
    { upsert: true }
  );
  await logAudit({
    userId: actorId,
    actorId,
    action: 'browser_rbac_update',
    resource: 'browser_rbac',
    resourceId: role,
    metadata: { permissions },
  });
  return permissions;
}

export async function checkBrowserPermission(
  userId: string,
  permission: BrowserPermission,
  userRole?: string
): Promise<boolean> {
  if (userRole === 'admin') return true;

  const hasApp = await checkPermission(userId, BROWSER_APP_BUNDLE, 'network');
  if (!hasApp) return false;

  const profile = await getBrowserProfile(userId);
  if (!profile) return false;

  const permissions = await getRolePermissions(profile.role);
  return permissions.includes(permission);
}

export async function assertBrowserPermission(
  userId: string,
  permission: BrowserPermission,
  userRole?: string
): Promise<void> {
  const ok = await checkBrowserPermission(userId, permission, userRole);
  if (!ok) throw new Error('PERMISSION_DENIED');
}

export function formatBrowserProfile(profile: InstanceType<typeof BrowserProfile>) {
  return {
    userId: profile.userId.toString(),
    role: profile.role,
    defaultSearchEngine: profile.defaultSearchEngine,
    desktopModeDefault: profile.desktopModeDefault,
    blockPopups: profile.blockPopups,
    doNotTrack: profile.doNotTrack,
    saveHistory: profile.saveHistory,
    syncTabs: profile.syncTabs,
    syncBookmarks: profile.syncBookmarks,
    readerModeDefault: profile.readerModeDefault,
    homePageUrl: profile.homePageUrl,
  };
}
