'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { realtimeService } from '@/services/realtimeService';
import { useNotificationStore } from '@/stores/notificationStore';
import { useAppStore } from '@/stores/appStore';
import { updateFromServer } from '@/hooks/useSettings';
import type { OSNotification, InstalledApp, UserSettings } from '@/types';

export function useRealtime() {
  const token = useAuthStore((s) => s.getAccessToken());
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      realtimeService.disconnect();
      return;
    }

    realtimeService.connect(token);

    const unsubscribers = [
      realtimeService.on('notification:new', (payload) => {
        useNotificationStore.getState().addNotification(payload.data as OSNotification);
      }),
      realtimeService.on('notification:read', (payload) => {
        const { id } = payload.data as { id: string };
        useNotificationStore.getState().markAsRead(id);
      }),
      realtimeService.on('app:installed', (payload) => {
        useAppStore.getState().addApp(payload.data as InstalledApp);
      }),
      realtimeService.on('app:uninstalled', (payload) => {
        const { bundleId } = payload.data as { bundleId: string };
        useAppStore.getState().removeApp(bundleId);
      }),
      realtimeService.on('settings:updated', (payload) => {
        updateFromServer(payload.data as UserSettings);
      }),
      realtimeService.on('session:expired', () => {
        useAuthStore.getState().logout();
      }),
    ];

    return () => {
      unsubscribers.forEach((unsub) => unsub());
      realtimeService.disconnect();
    };
  }, [isAuthenticated, token]);
}
