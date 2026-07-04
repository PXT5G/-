'use client';

import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { realtimeService } from '@/services/realtimeService';
import { useAuthStore } from '@/stores/authStore';
import { useBananaAppStore } from '../store/bananaAppStore';
import { bananaAppService } from '../services/bananaAppService';

export function useStoreRealtime() {
  const token = useAuthStore((s) => s.getAccessToken());
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const updateDownloadProgress = useBananaAppStore((s) => s.updateDownloadProgress);
  const setActiveInstall = useBananaAppStore((s) => s.setActiveInstall);
  const queryClient = useQueryClient();

  const handleDownloadComplete = useCallback(
    async (payload: { downloadId: string; bundleId: string; type: string }) => {
      try {
        if (payload.type === 'update') {
          await bananaAppService.completeUpdate(payload.downloadId);
        } else {
          await bananaAppService.completeInstall(payload.downloadId);
        }
        const current = useBananaAppStore.getState().activeInstall;
        if (current?.downloadId === payload.downloadId) {
          setActiveInstall({ ...current, status: 'completed', progress: 100 });
        }
        queryClient.invalidateQueries({ queryKey: ['store'] });
      } catch (err) {
        console.error('[Store] Complete install failed:', err);
      }
    },
    [queryClient, setActiveInstall]
  );

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const unsubProgress = realtimeService.on('store:download:progress', (payload) => {
      const data = payload.data as {
        downloadId: string;
        progress: number;
        status: string;
      };
      updateDownloadProgress(data.downloadId, data.progress, data.status);
      const current = useBananaAppStore.getState().activeInstall;
      if (current?.downloadId === data.downloadId) {
        setActiveInstall({ ...current, progress: data.progress, status: data.status });
      }
    });

    const unsubComplete = realtimeService.on('store:download:complete', (payload) => {
      handleDownloadComplete(payload.data as { downloadId: string; bundleId: string; type: string });
    });

    return () => {
      unsubProgress();
      unsubComplete();
    };
  }, [isAuthenticated, token, updateDownloadProgress, setActiveInstall, handleDownloadComplete]);
}
