import { Types } from 'mongoose';
import type { SystemPermissionType } from '@gulfos/shared';
import { resolveBundleId } from '../utils/bundleIdMigration';
import { PermissionGrant } from '../database/models/PermissionGrant';
import { emitToUser } from './socketService';
import { logAudit } from './auditService';
import { publishEvent } from './eventBusService';

const SYSTEM_APP = 'com.gulfos.system';

export async function checkPermission(
  userId: string,
  appId: string,
  permission: SystemPermissionType
): Promise<boolean> {
  const canonicalId = resolveBundleId(appId);
  const grant = await PermissionGrant.findOne({
    userId,
    appId: { $in: [canonicalId, appId] },
    permission,
    granted: true,
    deletedAt: null,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  });
  if (grant) return true;

  if (appId === SYSTEM_APP) return true;
  if (permission === 'notifications') return true;

  return false;
}

export async function getPermissions(userId: string, appId?: string) {
  const filter: Record<string, unknown> = { userId, deletedAt: null };
  if (appId) filter.appId = appId;

  const grants = await PermissionGrant.find(filter).sort({ appId: 1, permission: 1 });
  return grants.map((g) => ({
    appId: g.appId,
    permission: g.permission,
    granted: g.granted,
    grantedAt: g.grantedAt?.toISOString(),
    revokedAt: g.revokedAt?.toISOString(),
    expiresAt: g.expiresAt?.toISOString(),
  }));
}

export async function grantPermission(
  userId: string,
  appId: string,
  permission: SystemPermissionType,
  actorId: string
) {
  const grant = await PermissionGrant.findOneAndUpdate(
    { userId, appId, permission },
    {
      userId: new Types.ObjectId(userId),
      appId,
      permission,
      granted: true,
      grantedAt: new Date(),
      revokedAt: undefined,
      updatedBy: new Types.ObjectId(actorId),
      deletedAt: null,
    },
    { upsert: true, new: true }
  );

  await logAudit({
    userId,
    actorId,
    action: 'grant',
    resource: 'permission',
    resourceId: `${appId}:${permission}`,
  });

  const data = { appId, permission, granted: true, grantedAt: grant.grantedAt?.toISOString() };
  emitToUser(userId, 'permission:update', data);
  await publishEvent({
    userId,
    namespace: 'system.permissions',
    event: 'permission:granted',
    payload: data,
    source: 'permissionBroker',
  });

  return data;
}

export async function revokePermission(
  userId: string,
  appId: string,
  permission: SystemPermissionType,
  actorId: string
) {
  const grant = await PermissionGrant.findOneAndUpdate(
    { userId, appId, permission },
    {
      granted: false,
      revokedAt: new Date(),
      updatedBy: new Types.ObjectId(actorId),
    },
    { new: true }
  );

  await logAudit({
    userId,
    actorId,
    action: 'revoke',
    resource: 'permission',
    resourceId: `${appId}:${permission}`,
  });

  const data = { appId, permission, granted: false };
  emitToUser(userId, 'permission:update', data);
  return data;
}

export async function requestPermission(
  userId: string,
  appId: string,
  permission: SystemPermissionType,
  actorId: string
): Promise<{ granted: boolean; requiresApproval: boolean }> {
  const existing = await checkPermission(userId, appId, permission);
  if (existing) return { granted: true, requiresApproval: false };

  await PermissionGrant.findOneAndUpdate(
    { userId, appId, permission },
    {
      userId: new Types.ObjectId(userId),
      appId,
      permission,
      granted: false,
      createdBy: new Types.ObjectId(actorId),
    },
    { upsert: true }
  );

  return { granted: false, requiresApproval: true };
}

export async function seedSystemPermissions(userId: string) {
  const systemPerms: SystemPermissionType[] = [
    'location', 'network', 'storage', 'notifications', 'phone', 'contacts',
  ];
  for (const permission of systemPerms) {
    await grantPermission(userId, SYSTEM_APP, permission, userId);
  }
}
