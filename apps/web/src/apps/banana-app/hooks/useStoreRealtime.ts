'use client';

import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { realtimeService } from '@/services/realtimeService';
import { useAuthStore } from '@/stores/authStore';
import { useDynamicIslandStore } from '@/stores/dynamicIslandStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useBananaAppStore } from '../store/bananaAppStore';

export function useStoreRealtime() {
  const token = useAuthStore((s) => s.getAccessToken());
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const updateDownloadProgress = useBananaAppStore((s) => s.updateDownloadProgress);
  const setActiveInstall = useBananaAppStore((s) => s.setActiveInstall);
  const queryClient = useQueryClient();
  const islandSetProgress = useDynamicIslandStore((s) => s.setProgress);
  const islandHide = useDynamicIslandStore((s) => s.hide);

  const handleDownloadComplete = useCallback(
    async (payload: { downloadId: string; bundleId: string; type: string }) => {
      const current = useBananaAppStore.getState().activeInstall;
      if (current?.downloadId === payload.downloadId) {
        setActiveInstall({ ...current, status: 'completed', progress: 100 });
        islandSetProgress(100);
      }
      queryClient.invalidateQueries({ queryKey: ['store'] });
    },
    [queryClient, setActiveInstall, islandSetProgress]
  );

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const unsubProgress = realtimeService.on('store:download:progress', (payload) => {
      const data = payload.data as {
        downloadId: string;
        progress: number;
        status: string;
        downloadSpeed?: number;
        etaSeconds?: number;
        installStep?: string;
        error?: string;
      };
      updateDownloadProgress(data.downloadId, data.progress, data.status, {
        downloadSpeed: data.downloadSpeed,
        etaSeconds: data.etaSeconds,
        installStep: data.installStep,
      });

      const current = useBananaAppStore.getState().activeInstall;
      if (current?.downloadId === data.downloadId) {
        setActiveInstall({
          ...current,
          progress: data.progress,
          status: data.status,
          downloadSpeed: data.downloadSpeed,
          etaSeconds: data.etaSeconds,
          installStep: data.installStep,
        });
        if (data.status === 'downloading' || data.status === 'installing') {
          islandSetProgress(data.progress);
        }
        if (data.status === 'failed') {
          useNotificationStore.getState().addNotification({
            id: `download-failed-${data.downloadId}`,
            appId: 'com.bananaos.store',
            title: 'Installation Failed',
            body: data.error ?? 'Download or installation failed.',
            priority: 'high',
            timestamp: new Date().toISOString(),
            read: false,
          });
        }
      }
    });

    const unsubComplete = realtimeService.on('store:download:complete', (payload) => {
      handleDownloadComplete(payload.data as { downloadId: string; bundleId: string; type: string });
      useNotificationStore.getState().addNotification({
        id: `download-complete-${Date.now()}`,
        appId: 'com.bananaos.store',
        title: 'Installation Complete',
        body: 'Your app is ready to use.',
        priority: 'normal',
        timestamp: new Date().toISOString(),
        read: false,
      });
    });

    const unsubPaused = realtimeService.on('store:download:paused', (payload) => {
      const { downloadId } = payload.data as { downloadId: string };
      const current = useBananaAppStore.getState().activeInstall;
      if (current?.downloadId === downloadId) {
        setActiveInstall({ ...current, status: 'paused' });
      }
    });

    const unsubResumed = realtimeService.on('store:download:resumed', (payload) => {
      const { downloadId } = payload.data as { downloadId: string };
      const current = useBananaAppStore.getState().activeInstall;
      if (current?.downloadId === downloadId) {
        setActiveInstall({ ...current, status: 'downloading' });
      }
    });

    const unsubCancelled = realtimeService.on('store:download:cancelled', (payload) => {
      const { downloadId } = payload.data as { downloadId: string };
      const current = useBananaAppStore.getState().activeInstall;
      if (current?.downloadId === downloadId) {
        setActiveInstall(null);
        islandHide();
      }
      queryClient.invalidateQueries({ queryKey: ['store'] });
    });

    return () => {
      unsubProgress();
      unsubComplete();
      unsubPaused();
      unsubResumed();
      unsubCancelled();
    };
  }, [
    isAuthenticated,
    token,
    updateDownloadProgress,
    setActiveInstall,
    handleDownloadComplete,
    islandSetProgress,
    islandHide,
    queryClient,
  ]);
}
