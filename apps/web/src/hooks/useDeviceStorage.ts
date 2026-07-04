'use client';

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { realtimeService } from '@/services/realtimeService';
import { deviceStorageService } from '@/services/deviceStorageService';

export function useDeviceStorage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.getAccessToken());
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['device', 'storage'],
    queryFn: () => deviceStorageService.getStorage(),
    enabled: isAuthenticated && !!token,
    staleTime: 10_000,
  });

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    if (!realtimeService) return;
    const unsub = realtimeService.on('device:storage:updated', () => {
      queryClient.invalidateQueries({ queryKey: ['device', 'storage'] });
    });

    return () => unsub();
  }, [isAuthenticated, token, queryClient]);

  return query;
}
