'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { realtimeService } from '@/services/realtimeService';
import { intelligenceAppService } from '@/services/intelligenceAppService';

export function useIntelligenceInit() {
  const token = useAuthStore((s) => s.getAccessToken());
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  useEffect(() => {
    if (!isAuthenticated || !token) return;
    intelligenceAppService.initialize(token).catch(() => {});
  }, [isAuthenticated, token]);
}

export function useIntelligenceSocketSync() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  useEffect(() => {
    if (!isAuthenticated) return;
    const events = ['prediction:generated', 'suggestion:generated', 'dashboard:update', 'search:index:update'];
    const unsubs = events.map((ev) => realtimeService.on(ev as never, () => queryClient.invalidateQueries({ queryKey: ['intelligence'] })));
    return () => unsubs.forEach((u) => u());
  }, [isAuthenticated, queryClient]);
}

export function usePredictions() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({ queryKey: ['intelligence', 'predictions'], queryFn: () => intelligenceAppService.getPredictions(token!), enabled: !!token });
}

export function useSuggestions() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({ queryKey: ['intelligence', 'suggestions'], queryFn: () => intelligenceAppService.getSuggestions(token!), enabled: !!token });
}

export function useDashboards() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({ queryKey: ['intelligence', 'dashboards'], queryFn: () => intelligenceAppService.getDashboards(token!), enabled: !!token });
}

export function useIntelligenceSearch(query: string) {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['intelligence', 'search', query],
    queryFn: () => intelligenceAppService.search(token!, query),
    enabled: !!token && query.length > 0,
  });
}

export function useRefreshDashboard() {
  const token = useAuthStore((s) => s.getAccessToken());
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => intelligenceAppService.refreshDashboard(token!, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['intelligence'] }),
  });
}
