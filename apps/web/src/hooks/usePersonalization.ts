'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { realtimeService } from '@/services/realtimeService';
import { personalizationAppService } from '@/services/personalizationAppService';

export function usePersonalizationInit() {
  const token = useAuthStore((s) => s.getAccessToken());
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  useEffect(() => {
    if (!isAuthenticated || !token) return;
    personalizationAppService.initialize(token).catch(() => {});
  }, [isAuthenticated, token]);
}

export function usePersonalizationSocketSync() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  useEffect(() => {
    if (!isAuthenticated) return;
    const events = ['theme:update', 'layout:update', 'wallpaper:update', 'performance:update'];
    const unsubs = events.map((ev) => realtimeService.on(ev as never, () => {
      queryClient.invalidateQueries({ queryKey: ['personalization'] });
    }));
    return () => unsubs.forEach((u) => u());
  }, [isAuthenticated, queryClient]);
}

export function useThemes() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({ queryKey: ['personalization', 'themes'], queryFn: () => personalizationAppService.themes(token!), enabled: !!token });
}

export function useActivateTheme() {
  const token = useAuthStore((s) => s.getAccessToken());
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => personalizationAppService.activateTheme(token!, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['personalization'] }),
  });
}

export function useWallpapers() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({ queryKey: ['personalization', 'wallpapers'], queryFn: () => personalizationAppService.wallpapers(token!), enabled: !!token });
}

export function useHomeLayouts() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({ queryKey: ['personalization', 'layouts'], queryFn: () => personalizationAppService.layouts(token!), enabled: !!token });
}

export function useLockScreenProfiles() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({ queryKey: ['personalization', 'lock-screen'], queryFn: () => personalizationAppService.lockScreenProfiles(token!), enabled: !!token });
}

export function usePerformanceSnapshot() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({ queryKey: ['personalization', 'performance'], queryFn: () => personalizationAppService.performance(token!), enabled: !!token });
}
