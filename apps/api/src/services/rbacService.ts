import type { AuthRequest } from '../api/middleware/auth';
import type { SystemPermissionType } from '@gulfos/shared';
import { checkPermission } from './permissionBrokerService';

export async function requireSystemPermission(
  req: AuthRequest,
  appId: string,
  permission: SystemPermissionType
): Promise<boolean> {
  if (!req.user) return false;
  if (req.user.role === 'admin') return true;
  return checkPermission(req.user.userId, appId, permission);
}

export function isAdmin(req: AuthRequest): boolean {
  return req.user?.role === 'admin';
}

export function getActorId(req: AuthRequest): string {
  return req.user?.userId ?? 'system';
}
