'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { realtimeService } from '@/services/realtimeService';
import { shortcutsAppService } from '@/services/shortcutsAppService';

export function useShortcutsInit() {
  const token = useAuthStore((s) => s.getAccessToken());
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  useEffect(() => {
    if (!isAuthenticated || !token) return;
    shortcutsAppService.initialize(token).catch(() => {});
  }, [isAuthenticated, token]);
}

export function useShortcutsSocketSync() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  useEffect(() => {
    if (!isAuthenticated) return;
    const events = ['shortcut:run', 'shortcut:updated', 'shortcut:created'];
    const unsubs = events.map((ev) => realtimeService.on(ev as never, () => queryClient.invalidateQueries({ queryKey: ['shortcuts'] })));
    return () => unsubs.forEach((u) => u());
  }, [isAuthenticated, queryClient]);
}

export function useShortcuts() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({ queryKey: ['shortcuts'], queryFn: () => shortcutsAppService.list(token!), enabled: !!token });
}

export function useRunShortcut() {
  const token = useAuthStore((s) => s.getAccessToken());
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => shortcutsAppService.run(token!, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shortcuts'] }),
  });
}
