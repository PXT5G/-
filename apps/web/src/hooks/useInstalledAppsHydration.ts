'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
import { gulfStoreService } from '@/apps/banana-app/services/gulfStoreService';
import type { InstalledApp } from '@/types';

export function useInstalledAppsHydration() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.getAccessToken());
  const setInstalledApps = useAppStore((s) => s.setInstalledApps);

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    let cancelled = false;

    (async () => {
      try {
        const { apps, registry } = await gulfStoreService.getInstalled();
        if (cancelled) return;

        const registryMap = new Map(registry.map((r) => [r.bundleId, r]));
        const osApps: InstalledApp[] = apps.map((app) => {
          const entry = registryMap.get(app.bundleId);
          return {
            id: app.bundleId,
            bundleId: app.bundleId,
            name: app.name,
            version: app.installedVersion,
            description: '',
            icon: app.icon,
            category: (entry?.category ?? 'utilities') as InstalledApp['category'],
            permissions: (app.permissions ?? []) as InstalledApp['permissions'],
            minOSVersion: '1.0.0',
            isSystemApp: app.isSystemApp,
            route: entry?.route,
            installedAt: app.installedAt,
          };
        });

        setInstalledApps(osApps);
      } catch (err) {
        console.error('[OS] Failed to hydrate installed apps:', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, token, setInstalledApps]);
}
