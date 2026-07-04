'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PermissionType, PermissionGrant } from '@/types';

export interface PendingPermissionRequest {
  appId: string;
  permission: PermissionType;
}

interface PermissionState {
  grants: PermissionGrant[];
  pending: PendingPermissionRequest | null;
  requestPermission: (appId: string, permission: PermissionType) => Promise<boolean>;
  grantPermission: (appId: string, permission: PermissionType) => void;
  denyPermission: () => void;
  revokePermission: (appId: string, permission: PermissionType) => void;
  hasPermission: (appId: string, permission: PermissionType) => boolean;
  getAppPermissions: (appId: string) => PermissionGrant[];
}

const pendingRequests = new Map<string, (granted: boolean) => void>();

export const usePermissionStore = create<PermissionState>()(
  persist(
    (set, get) => ({
      grants: [],
      pending: null,

      requestPermission: (appId, permission) =>
        new Promise((resolve) => {
          if (get().hasPermission(appId, permission)) {
            resolve(true);
            return;
          }
          const key = `${appId}:${permission}`;
          pendingRequests.set(key, resolve);
          set({ pending: { appId, permission } });
        }),

      grantPermission: async (appId, permission) => {
        set((s) => {
          const existing = s.grants.find(
            (g) => g.appId === appId && g.permission === permission
          );
          if (existing) {
            return {
              pending: null,
              grants: s.grants.map((g) =>
                g.appId === appId && g.permission === permission
                  ? { ...g, granted: true, grantedAt: new Date().toISOString() }
                  : g
              ),
            };
          }
          return {
            pending: null,
            grants: [
              ...s.grants,
              {
                appId,
                permission,
                granted: true,
                grantedAt: new Date().toISOString(),
              },
            ],
          };
        });

        try {
          const { systemService } = await import('@/services/systemService');
          await systemService.grantPermission(appId, permission);
        } catch { /* offline */ }

        const key = `${appId}:${permission}`;
        const resolver = pendingRequests.get(key);
        if (resolver) {
          resolver(true);
          pendingRequests.delete(key);
        }
      },

      denyPermission: () => {
        const pending = get().pending;
        if (pending) {
          const key = `${pending.appId}:${pending.permission}`;
          const resolver = pendingRequests.get(key);
          if (resolver) {
            resolver(false);
            pendingRequests.delete(key);
          }
        }
        set({ pending: null });
      },

      revokePermission: async (appId, permission) => {
        set((s) => ({
          grants: s.grants.map((g) =>
            g.appId === appId && g.permission === permission
              ? { ...g, granted: false }
              : g
          ),
        }));
        try {
          const { systemService } = await import('@/services/systemService');
          await systemService.revokePermission(appId, permission);
        } catch { /* offline */ }
      },

      hasPermission: (appId, permission) =>
        get().grants.some(
          (g) => g.appId === appId && g.permission === permission && g.granted
        ),

      getAppPermissions: (appId) =>
        get().grants.filter((g) => g.appId === appId),
    }),
    { name: 'bananaos-permissions' }
  )
);

export function resolvePermissionRequest(
  appId: string,
  permission: PermissionType,
  granted: boolean
): void {
  const key = `${appId}:${permission}`;
  const resolver = pendingRequests.get(key);
  if (resolver) {
    resolver(granted);
    pendingRequests.delete(key);
  }
}
