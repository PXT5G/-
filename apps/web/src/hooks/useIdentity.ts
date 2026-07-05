'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { realtimeService } from '@/services/realtimeService';
import { identityService } from '@/services/identityAppService';

export function useIdentityInit() {
  const token = useAuthStore((s) => s.getAccessToken());
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    identityService.initialize(token).catch(() => {});
  }, [isAuthenticated, token]);
}

export function useIdentitySocketSync() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;
    const events = ['identity:update', 'identity:verified', 'identity:document:added', 'identity:initialized'];
    const unsubs = events.map((ev) =>
      realtimeService.on(ev as never, () => {
        queryClient.invalidateQueries({ queryKey: ['identity'] });
      })
    );
    return () => unsubs.forEach((u) => u());
  }, [isAuthenticated, queryClient]);
}

export function useIdentityProfile() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['identity', 'profile'],
    queryFn: () => identityService.getProfile(token!),
    enabled: !!token,
  });
}

export function useIdentityDocuments(type?: string) {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['identity', 'documents', type],
    queryFn: () => identityService.getDocuments(token!, type),
    enabled: !!token,
  });
}

export function useIdentityEmergency() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['identity', 'emergency'],
    queryFn: () => identityService.getEmergencyInfo(token!),
    enabled: !!token,
  });
}

export function useGenerateQr() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useMutation({
    mutationFn: () => identityService.generateQr(token!),
  });
}

export function useExportVCard() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useMutation({
    mutationFn: () => identityService.exportVCard(token!),
  });
}
