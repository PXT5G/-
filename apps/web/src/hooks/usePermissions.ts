'use client';

import { useCallback } from 'react';
import { usePermissionStore, resolvePermissionRequest } from '@/stores/permissionStore';
import type { PermissionType } from '@/types';

export function usePermissions(appId: string) {
  const { hasPermission, grantPermission, revokePermission, requestPermission, getAppPermissions } =
    usePermissionStore();

  const request = useCallback(
    async (permission: PermissionType): Promise<boolean> => {
      if (hasPermission(appId, permission)) return true;
      return requestPermission(appId, permission);
    },
    [appId, hasPermission, requestPermission]
  );

  const grant = useCallback(
    (permission: PermissionType) => {
      grantPermission(appId, permission);
      resolvePermissionRequest(appId, permission, true);
    },
    [appId, grantPermission]
  );

  const deny = useCallback(
    (permission: PermissionType) => {
      resolvePermissionRequest(appId, permission, false);
    },
    [appId]
  );

  const revoke = useCallback(
    (permission: PermissionType) => revokePermission(appId, permission),
    [appId, revokePermission]
  );

  const check = useCallback(
    (permission: PermissionType) => hasPermission(appId, permission),
    [appId, hasPermission]
  );

  return {
    request,
    grant,
    deny,
    revoke,
    check,
    permissions: getAppPermissions(appId),
  };
}
