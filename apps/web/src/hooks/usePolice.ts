'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { realtimeService } from '@/services/realtimeService';
import { policeService } from '@/services/policeService';

export function usePoliceInit() {
  const token = useAuthStore((s) => s.getAccessToken());
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    policeService.initialize(token).catch(() => {});
  }, [isAuthenticated, token]);
}

export function usePoliceDashboard() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['police', 'dashboard'],
    queryFn: () => policeService.getDashboard(token!),
    enabled: Boolean(token),
    refetchInterval: 30_000,
  });
}

export function usePoliceSocketSync() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.getAccessToken());

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    const events = [
      'police:dispatch:new', 'police:dispatch:update', 'police:officer:status',
      'police:911:new', 'police:panic', 'police:bolo:new', 'police:initialized',
    ];
    const unsubs = events.map((ev) =>
      realtimeService.on(ev as never, () => {
        queryClient.invalidateQueries({ queryKey: ['police'] });
      })
    );
    return () => unsubs.forEach((u) => u());
  }, [isAuthenticated, token, queryClient]);
}

export function usePoliceDispatches(is911?: boolean) {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['police', 'dispatches', is911],
    queryFn: () => policeService.getDispatches(token!, { is911 }),
    enabled: Boolean(token),
    refetchInterval: 15_000,
  });
}

export function usePoliceOfficers() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['police', 'officers'],
    queryFn: () => policeService.getOfficers(token!),
    enabled: Boolean(token),
  });
}

export function usePoliceUnits() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['police', 'units'],
    queryFn: () => policeService.getUnits(token!),
    enabled: Boolean(token),
  });
}

export function useUpdatePoliceStatus() {
  const token = useAuthStore((s) => s.getAccessToken());
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (status: string) => policeService.updateStatus(token!, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['police'] }),
  });
}

export function usePoliceSearch() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useMutation({
    mutationFn: ({ searchType, query }: { searchType: string; query: string }) =>
      policeService.search(token!, searchType, query),
  });
}

export function usePoliceBolos() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['police', 'bolos'],
    queryFn: () => policeService.getBolos(token!),
    enabled: Boolean(token),
  });
}

export function usePoliceWanted() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['police', 'wanted'],
    queryFn: () => policeService.getWanted(token!),
    enabled: Boolean(token),
  });
}

export function usePoliceWarrants() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['police', 'warrants'],
    queryFn: () => policeService.getWarrants(token!),
    enabled: Boolean(token),
  });
}

export function usePoliceAnalytics() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['police', 'analytics'],
    queryFn: () => policeService.getAnalytics(token!),
    enabled: Boolean(token),
  });
}

export function usePolicePanic() {
  const token = useAuthStore((s) => s.getAccessToken());
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => policeService.triggerPanic(token!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['police'] }),
  });
}
