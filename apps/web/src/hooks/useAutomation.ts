'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { realtimeService } from '@/services/realtimeService';
import { automationAppService } from '@/services/automationAppService';

export function useAutomationInit() {
  const token = useAuthStore((s) => s.getAccessToken());
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  useEffect(() => {
    if (!isAuthenticated || !token) return;
    automationAppService.initialize(token).catch(() => {});
  }, [isAuthenticated, token]);
}

export function useAutomationSocketSync() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  useEffect(() => {
    if (!isAuthenticated) return;
    const events = ['automation:created', 'automation:updated', 'automation:running', 'automation:completed', 'automation:failed'];
    const unsubs = events.map((ev) => realtimeService.on(ev as never, () => queryClient.invalidateQueries({ queryKey: ['automation'] })));
    return () => unsubs.forEach((u) => u());
  }, [isAuthenticated, queryClient]);
}

export function useAutomations() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['automation', 'list'],
    queryFn: () => automationAppService.list(token!),
    enabled: !!token,
  });
}

export function useAutomationHistory() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['automation', 'history'],
    queryFn: () => automationAppService.getHistory(token!),
    enabled: !!token,
  });
}

export function useRunAutomation() {
  const token = useAuthStore((s) => s.getAccessToken());
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => automationAppService.run(token!, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['automation'] }),
  });
}

export function useActivateAutomation() {
  const token = useAuthStore((s) => s.getAccessToken());
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => automationAppService.activate(token!, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['automation'] }),
  });
}
