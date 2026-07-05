'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { realtimeService } from '@/services/realtimeService';
import { focusAppService } from '@/services/focusAppService';

export function useFocusInit() {
  const token = useAuthStore((s) => s.getAccessToken());
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  useEffect(() => {
    if (!isAuthenticated || !token) return;
    focusAppService.initialize(token).catch(() => {});
  }, [isAuthenticated, token]);
}

export function useFocusSocketSync() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  useEffect(() => {
    if (!isAuthenticated) return;
    const events = ['focus:enabled', 'focus:disabled', 'focus:updated'];
    const unsubs = events.map((ev) => realtimeService.on(ev as never, () => queryClient.invalidateQueries({ queryKey: ['focus'] })));
    return () => unsubs.forEach((u) => u());
  }, [isAuthenticated, queryClient]);
}

export function useFocusProfiles() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({ queryKey: ['focus', 'profiles'], queryFn: () => focusAppService.list(token!), enabled: !!token });
}

export function useActiveFocus() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({ queryKey: ['focus', 'active'], queryFn: () => focusAppService.active(token!), enabled: !!token });
}

export function useEnableFocus() {
  const token = useAuthStore((s) => s.getAccessToken());
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => focusAppService.enable(token!, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['focus'] }),
  });
}

export function useDisableFocus() {
  const token = useAuthStore((s) => s.getAccessToken());
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => focusAppService.disable(token!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['focus'] }),
  });
}
