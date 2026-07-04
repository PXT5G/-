'use client';

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { realtimeService } from '@/services/realtimeService';
import { deviceStorageService } from '@/services/deviceStorageService';
import { useDynamicIslandStore } from '@/stores/dynamicIslandStore';

export function useDeviceHardware() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.getAccessToken());
  const queryClient = useQueryClient();
  const islandShow = useDynamicIslandStore((s) => s.show);
  const islandHide = useDynamicIslandStore((s) => s.hide);

  const query = useQuery({
    queryKey: ['device', 'hardware'],
    queryFn: () => deviceStorageService.getHardware(),
    enabled: isAuthenticated && !!token,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const unsubs = [
      realtimeService.on('device:ram:updated', () => {
        queryClient.invalidateQueries({ queryKey: ['device', 'hardware'] });
        queryClient.invalidateQueries({ queryKey: ['device', 'ram'] });
      }),
      realtimeService.on('device:memory:pressure', (payload) => {
        islandShow({
          mode: 'compact',
          title: 'Memory Pressure',
          subtitle: (payload.data as { message?: string })?.message ?? 'Background apps frozen',
          icon: '⚠️',
        });
        setTimeout(() => islandHide(), 4000);
      }),
      realtimeService.on('device:storage:warning', (payload) => {
        const data = payload.data as { level?: string; suggestions?: string[] };
        if (data.level === 'warning' || data.level === 'low') {
          islandShow({
            mode: 'compact',
            title: 'Low Storage',
            subtitle: data.suggestions?.[0] ?? 'Free up space',
            icon: '💾',
          });
          setTimeout(() => islandHide(), 5000);
        }
        queryClient.invalidateQueries({ queryKey: ['device'] });
      }),
    ];

    return () => unsubs.forEach((u) => u());
  }, [isAuthenticated, token, queryClient, islandShow, islandHide]);

  return query;
}

export function useTaskManager() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.getAccessToken());
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['device', 'task-manager'],
    queryFn: () => deviceStorageService.getTaskManager(),
    enabled: isAuthenticated && !!token,
    staleTime: 5_000,
  });

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    const unsub = realtimeService.on('device:ram:updated', () => {
      queryClient.invalidateQueries({ queryKey: ['device', 'task-manager'] });
    });
    return () => unsub();
  }, [isAuthenticated, token, queryClient]);

  return query;
}
