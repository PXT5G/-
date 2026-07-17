'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { useVehicleStore } from '@/stores/vehicleStore';
import { realtimeService } from '@/services/realtimeService';
import { vehicleService } from '@/services/vehicleService';

export function useVehiclesInit() {
  const token = useAuthStore((s) => s.getAccessToken());
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    vehicleService.initialize(token).catch(() => {});
  }, [isAuthenticated, token]);
}

export function useVehiclesSocketSync() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.getAccessToken());

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    const events = [
      'vehicles:initialized', 'vehicles:listed', 'vehicles:sold', 'vehicles:reserved',
      'vehicles:auction', 'vehicles:inventory:update', 'vehicles:price:change',
      'vehicles:offer:received', 'vehicles:offer:accepted', 'vehicles:analytics:update',
      'vehicles:finance:update',
    ];
    const unsubs = events.map((ev) =>
      realtimeService.on(ev as never, () => {
        queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      })
    );
    return () => unsubs.forEach((u) => u());
  }, [isAuthenticated, token, queryClient]);
}

export function useVehiclesDashboard() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['vehicles', 'dashboard'],
    queryFn: () => vehicleService.getDashboard(token!),
    enabled: Boolean(token),
    refetchInterval: 30_000,
  });
}

export function useVehiclesList(params?: Record<string, string | number | boolean>) {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['vehicles', 'list', params],
    queryFn: () => vehicleService.getVehicles(token!, params),
    enabled: Boolean(token),
  });
}

export function useVehiclesSearch(query: string, filters?: Record<string, string>) {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['vehicles', 'search', query, filters],
    queryFn: () => vehicleService.search(token!, { query, ...filters }),
    enabled: Boolean(token && (query.length > 1 || Object.keys(filters ?? {}).length > 0)),
  });
}

export function useVehiclesDealers() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['vehicles', 'dealers'],
    queryFn: () => vehicleService.getDealers(token!),
    enabled: Boolean(token),
  });
}

export function useVehiclesInventory() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['vehicles', 'inventory'],
    queryFn: () => vehicleService.getVehicles(token!, { available: true }),
    enabled: Boolean(token),
  });
}

export function useVehiclesFinance() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['vehicles', 'finance'],
    queryFn: () => vehicleService.getFinance(token!),
    enabled: Boolean(token),
  });
}

export function useVehiclesAuctions() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['vehicles', 'auctions'],
    queryFn: () => vehicleService.getAuctions(token!),
    enabled: Boolean(token),
  });
}

export function useVehiclesAnalytics() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['vehicles', 'analytics'],
    queryFn: () => vehicleService.getAnalytics(token!),
    enabled: Boolean(token),
  });
}

export function useVehiclesSales() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['vehicles', 'sales'],
    queryFn: () => vehicleService.getSales(token!),
    enabled: Boolean(token),
  });
}

export function useVehiclesOffers() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['vehicles', 'offers'],
    queryFn: () => vehicleService.getOffers(token!),
    enabled: Boolean(token),
  });
}

export function useVehiclesFavorites() {
  const token = useAuthStore((s) => s.getAccessToken());
  const setFavorites = useVehicleStore((s) => s.setFavorites);
  return useQuery({
    queryKey: ['vehicles', 'favorites'],
    queryFn: async () => {
      const data = await vehicleService.getFavorites(token!);
      setFavorites((data as { vehicleId: string }[]).map((v) => v.vehicleId));
      return data;
    },
    enabled: Boolean(token),
  });
}

export function useToggleVehicleFavorite() {
  const token = useAuthStore((s) => s.getAccessToken());
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vehicleId: string) => vehicleService.toggleFavorite(token!, vehicleId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vehicles'] }),
  });
}
