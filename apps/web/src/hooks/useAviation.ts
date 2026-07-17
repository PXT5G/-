'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { useAviationStore } from '@/stores/aviationStore';
import { realtimeService } from '@/services/realtimeService';
import { aviationService } from '@/services/aviationService';

export function useAviationInit() {
  const token = useAuthStore((s) => s.getAccessToken());
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    aviationService.initialize(token).catch(() => {});
  }, [isAuthenticated, token]);
}

export function useAviationSocketSync() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.getAccessToken());

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    const events = [
      'aviation:initialized', 'aviation:listed', 'aviation:sold', 'aviation:reserved',
      'aviation:leased', 'aviation:auction', 'aviation:maintenance', 'aviation:moved',
      'aviation:price:change', 'aviation:offer:received', 'aviation:offer:accepted',
      'aviation:analytics:update', 'aviation:finance:update',
    ];
    const unsubs = events.map((ev) =>
      realtimeService.on(ev as never, () => {
        queryClient.invalidateQueries({ queryKey: ['aviation'] });
      })
    );
    return () => unsubs.forEach((u) => u());
  }, [isAuthenticated, token, queryClient]);
}

export function useAviationDashboard() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['aviation', 'dashboard'],
    queryFn: () => aviationService.getDashboard(token!),
    enabled: Boolean(token),
    refetchInterval: 30_000,
  });
}

export function useAviationFleet(params?: Record<string, string | number | boolean>) {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['aviation', 'fleet', params],
    queryFn: () => aviationService.getAircraft(token!, params),
    enabled: Boolean(token),
  });
}

export function useAviationSearch(query: string, filters?: Record<string, string>) {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['aviation', 'search', query, filters],
    queryFn: () => aviationService.search(token!, { query, ...filters }),
    enabled: Boolean(token && (query.length > 1 || Object.keys(filters ?? {}).length > 0)),
  });
}

export function useAviationAirports(params?: Record<string, string>) {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['aviation', 'airports', params],
    queryFn: () => aviationService.getAirports(token!, params),
    enabled: Boolean(token),
  });
}

export function useAviationFinance() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['aviation', 'finance'],
    queryFn: () => aviationService.getFinance(token!),
    enabled: Boolean(token),
  });
}

export function useAviationAuctions() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['aviation', 'auctions'],
    queryFn: () => aviationService.getAuctions(token!),
    enabled: Boolean(token),
  });
}

export function useAviationAnalytics() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['aviation', 'analytics'],
    queryFn: () => aviationService.getAnalytics(token!),
    enabled: Boolean(token),
  });
}

export function useAviationOffers() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['aviation', 'offers'],
    queryFn: () => aviationService.getOffers(token!),
    enabled: Boolean(token),
  });
}

export function useAviationFavorites() {
  const token = useAuthStore((s) => s.getAccessToken());
  const setFavorites = useAviationStore((s) => s.setFavorites);
  return useQuery({
    queryKey: ['aviation', 'favorites'],
    queryFn: async () => {
      const data = await aviationService.getFavorites(token!);
      setFavorites((data as { aircraftId: string }[]).map((a) => a.aircraftId));
      return data;
    },
    enabled: Boolean(token),
  });
}

export function useToggleAviationFavorite() {
  const token = useAuthStore((s) => s.getAccessToken());
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (aircraftId: string) => aviationService.toggleFavorite(token!, aircraftId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['aviation'] }),
  });
}
