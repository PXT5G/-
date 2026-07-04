import { Types } from 'mongoose';
import { CorePermission } from '../../database/models/platform/CorePermission';
import { PolicePermission } from '../../database/models/PolicePermission';
import { SIMPermission } from '../../database/models/SIMPermission';
import { ContactPermission } from '../../database/models/ContactPermission';
import { IdentityPermission } from '../../database/models/IdentityPermission';
import { BANANAOS_APP_IDS, type PermissionCheckResult } from '../types';
import { auditService } from './auditService';

type UserRole = 'user' | 'admin';

async function checkLegacyPermission(appId: string, userId: string, permission: string): Promise<boolean> {
  switch (appId) {
    case BANANAOS_APP_IDS.POLICE:
      return !!(await PolicePermission.findOne({ userId, permission, granted: true }));
    case BANANAOS_APP_IDS.SIM:
      return !!(await SIMPermission.findOne({ userId, permission, granted: true }));
    case BANANAOS_APP_IDS.CONTACTS:
      return !!(await ContactPermission.findOne({ userId, permission, granted: true }));
    case BANANAOS_APP_IDS.IDENTITY:
      return !!(await IdentityPermission.findOne({ userId, permission, granted: true }));
    case BANANAOS_APP_IDS.JUSTICE:
      return false;
  }
  return false;
}

async function grantLegacyPermission(
  appId: string,
  userId: string,
  permission: string,
  grantedBy: string
): Promise<void> {
  const update = { granted: true, grantedBy, grantedAt: new Date(), revokedAt: undefined };

  switch (appId) {
    case BANANAOS_APP_IDS.POLICE:
      await PolicePermission.findOneAndUpdate({ userId, permission }, update, { upsert: true });
      break;
    case BANANAOS_APP_IDS.SIM:
      await SIMPermission.findOneAndUpdate({ userId, permission }, update, { upsert: true });
      break;
    case BANANAOS_APP_IDS.CONTACTS:
      await ContactPermission.findOneAndUpdate({ userId, permission }, update, { upsert: true });
      break;
    case BANANAOS_APP_IDS.IDENTITY:
      await IdentityPermission.findOneAndUpdate(
        { userId, appId: permission, permission: 'access' },
        { granted: true, grantedAt: new Date() },
        { upsert: true }
      );
      break;
    default:
      break;
  }
}

export async function hasPermission(
  appId: string,
  userId: string,
  permission: string,
  userRole: UserRole
): Promise<PermissionCheckResult> {
  if (userRole === 'admin') {
    return { granted: true, source: 'admin' };
  }

  const core = await CorePermission.findOne({ appId, userId, permission, granted: true });
  if (core) {
    return { granted: true, source: 'core' };
  }

  const legacy = await checkLegacyPermission(appId, userId, permission);
  if (legacy) {
    return { granted: true, source: 'legacy' };
  }

  return { granted: false, source: 'denied' };
}

export async function requirePermission(
  appId: string,
  userId: string,
  permission: string,
  userRole: UserRole
): Promise<void> {
  const result = await hasPermission(appId, userId, permission, userRole);
  if (!result.granted) {
    throw new Error(`Permission denied: ${appId}:${permission}`);
  }
}

export async function grantPermissions(
  appId: string,
  userId: string,
  permissions: string[],
  grantedBy: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  for (const permission of permissions) {
    await CorePermission.findOneAndUpdate(
      { appId, userId, permission },
      {
        granted: true,
        grantedBy: new Types.ObjectId(grantedBy),
        grantedAt: new Date(),
        revokedAt: undefined,
        metadata,
      },
      { upsert: true }
    );
    await grantLegacyPermission(appId, userId, permission, grantedBy);
  }

  await auditService.log({
    appId,
    userId,
    action: 'permissions_granted',
    entityType: 'CorePermission',
    ctx: { performedBy: grantedBy, performedByRole: 'admin', permission: 'manage_permissions' },
    metadata: { permissions },
  });
}

export async function revokePermission(
  appId: string,
  userId: string,
  permission: string,
  revokedBy: string
): Promise<void> {
  await CorePermission.findOneAndUpdate(
    { appId, userId, permission },
    { granted: false, revokedAt: new Date() }
  );

  switch (appId) {
    case BANANAOS_APP_IDS.POLICE:
      await PolicePermission.findOneAndUpdate({ userId, permission }, { granted: false, revokedAt: new Date() });
      break;
    case BANANAOS_APP_IDS.SIM:
      await SIMPermission.findOneAndUpdate({ userId, permission }, { granted: false, revokedAt: new Date() });
      break;
    case BANANAOS_APP_IDS.CONTACTS:
      await ContactPermission.findOneAndUpdate({ userId, permission }, { granted: false, revokedAt: new Date() });
      break;
    default:
      break;
  }

  await auditService.log({
    appId,
    userId,
    action: 'permission_revoked',
    entityType: 'CorePermission',
    ctx: { performedBy: revokedBy, performedByRole: 'admin' },
    metadata: { permission },
  });
}

export async function listPermissions(appId: string, userId: string): Promise<string[]> {
  const [core, legacy] = await Promise.all([
    CorePermission.find({ appId, userId, granted: true }).lean(),
    (async () => {
      switch (appId) {
        case BANANAOS_APP_IDS.POLICE:
          return PolicePermission.find({ userId, granted: true }).lean();
        case BANANAOS_APP_IDS.SIM:
          return SIMPermission.find({ userId, granted: true }).lean();
        case BANANAOS_APP_IDS.CONTACTS:
          return ContactPermission.find({ userId, granted: true }).lean();
        default:
          return [];
      }
    })(),
  ]);

  const perms = new Set<string>();
  core.forEach((p) => perms.add(p.permission));
  legacy.forEach((p) => perms.add((p as { permission: string }).permission));
  return Array.from(perms);
}

export async function syncLegacyToCore(appId: string, userId: string, grantedBy: string): Promise<number> {
  const legacyPerms = await listPermissions(appId, userId);
  await grantPermissions(appId, userId, legacyPerms, grantedBy);
  return legacyPerms.length;
}

export const permissionEngineService = {
  hasPermission,
  requirePermission,
  grantPermissions,
  revokePermission,
  listPermissions,
  syncLegacyToCore,
};
