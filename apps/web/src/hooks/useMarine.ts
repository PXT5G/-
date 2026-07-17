'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { useMarineStore } from '@/stores/marineStore';
import { realtimeService } from '@/services/realtimeService';
import { marineService } from '@/services/marineService';

export function useMarineInit() {
  const token = useAuthStore((s) => s.getAccessToken());
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    marineService.initialize(token).catch(() => {});
  }, [isAuthenticated, token]);
}

export function useMarineSocketSync() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.getAccessToken());

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    const events = [
      'marine:initialized', 'marine:listed', 'marine:sold', 'marine:reserved',
      'marine:leased', 'marine:auction:started', 'marine:auction:ended',
      'marine:maintenance', 'marine:location:change', 'marine:price:change',
      'marine:offer:received', 'marine:offer:accepted', 'marine:notification',
      'marine:analytics:update', 'marine:finance:update',
    ];
    const unsubs = events.map((ev) =>
      realtimeService.on(ev as never, () => {
        queryClient.invalidateQueries({ queryKey: ['marine'] });
      })
    );
    return () => unsubs.forEach((u) => u());
  }, [isAuthenticated, token, queryClient]);
}

export function useMarineDashboard() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['marine', 'dashboard'],
    queryFn: () => marineService.getDashboard(token!),
    enabled: Boolean(token),
    refetchInterval: 30_000,
  });
}

export function useMarineFleet(params?: Record<string, string | number | boolean>) {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['marine', 'fleet', params],
    queryFn: () => marineService.getVessel(token!, params),
    enabled: Boolean(token),
  });
}

export function useMarineSearch(query: string, filters?: Record<string, string>) {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['marine', 'search', query, filters],
    queryFn: () => marineService.search(token!, { query, ...filters }),
    enabled: Boolean(token && (query.length > 1 || Object.keys(filters ?? {}).length > 0)),
  });
}

export function useMarineMarinas(params?: Record<string, string>) {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['marine', 'marinas', params],
    queryFn: () => marineService.getMarinas(token!, params),
    enabled: Boolean(token),
  });
}

export function useMarineFinance() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['marine', 'finance'],
    queryFn: () => marineService.getFinance(token!),
    enabled: Boolean(token),
  });
}

export function useMarineAuctions() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['marine', 'auctions'],
    queryFn: () => marineService.getAuctions(token!),
    enabled: Boolean(token),
  });
}

export function useMarineAnalytics() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['marine', 'analytics'],
    queryFn: () => marineService.getAnalytics(token!),
    enabled: Boolean(token),
  });
}

export function useMarineOffers() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['marine', 'offers'],
    queryFn: () => marineService.getOffers(token!),
    enabled: Boolean(token),
  });
}

export function useMarineFavorites() {
  const token = useAuthStore((s) => s.getAccessToken());
  const setFavorites = useMarineStore((s) => s.setFavorites);
  return useQuery({
    queryKey: ['marine', 'favorites'],
    queryFn: async () => {
      const data = await marineService.getFavorites(token!);
      setFavorites((data as { vesselId: string }[]).map((a) => a.vesselId));
      return data;
    },
    enabled: Boolean(token),
  });
}

export function useToggleMarineFavorite() {
  const token = useAuthStore((s) => s.getAccessToken());
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vesselId: string) => marineService.toggleFavorite(token!, vesselId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['marine'] }),
  });
}
