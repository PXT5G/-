'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { useRealEstateStore } from '@/stores/realEstateStore';
import { realtimeService } from '@/services/realtimeService';
import { realEstateService } from '@/services/realEstateService';

export function useRealEstateInit() {
  const token = useAuthStore((s) => s.getAccessToken());
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    realEstateService.initialize(token).catch(() => {});
  }, [isAuthenticated, token]);
}

export function useRealEstateSocketSync() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.getAccessToken());

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    const events = [
      'realestate:initialized', 'realestate:listing:created', 'realestate:listing:updated',
      'realestate:property:sold', 'realestate:property:rented', 'realestate:offer:received',
      'realestate:offer:accepted', 'realestate:maintenance:update', 'realestate:price:change',
      'realestate:analytics:update', 'realestate:lease:update',
    ];
    const unsubs = events.map((ev) =>
      realtimeService.on(ev as never, () => {
        queryClient.invalidateQueries({ queryKey: ['realestate'] });
      })
    );
    return () => unsubs.forEach((u) => u());
  }, [isAuthenticated, token, queryClient]);
}

export function useRealEstateDashboard() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['realestate', 'dashboard'],
    queryFn: () => realEstateService.getDashboard(token!),
    enabled: Boolean(token),
    refetchInterval: 30_000,
  });
}

export function useRealEstateProperties(params?: Record<string, string | number | boolean>) {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['realestate', 'properties', params],
    queryFn: () => realEstateService.getProperties(token!, params),
    enabled: Boolean(token),
  });
}

export function useRealEstateSearch(query: string) {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['realestate', 'search', query],
    queryFn: () => realEstateService.search(token!, { query }),
    enabled: Boolean(token && query.length > 1),
  });
}

export function useRealEstateAnalytics() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['realestate', 'analytics'],
    queryFn: () => realEstateService.getAnalytics(token!),
    enabled: Boolean(token),
  });
}

export function useRealEstateSales() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['realestate', 'sales'],
    queryFn: () => realEstateService.getSales(token!),
    enabled: Boolean(token),
  });
}

export function useRealEstateRentals() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['realestate', 'rentals'],
    queryFn: () => realEstateService.getRentals(token!),
    enabled: Boolean(token),
  });
}

export function useRealEstateOffers() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['realestate', 'offers'],
    queryFn: () => realEstateService.getOffers(token!),
    enabled: Boolean(token),
  });
}

export function useRealEstateFavorites() {
  const token = useAuthStore((s) => s.getAccessToken());
  const setFavorites = useRealEstateStore((s) => s.setFavorites);
  return useQuery({
    queryKey: ['realestate', 'favorites'],
    queryFn: async () => {
      const data = await realEstateService.getFavorites(token!);
      setFavorites((data as { propertyId: string }[]).map((p) => p.propertyId));
      return data;
    },
    enabled: Boolean(token),
  });
}

export function useToggleFavorite() {
  const token = useAuthStore((s) => s.getAccessToken());
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (propertyId: string) => realEstateService.toggleFavorite(token!, propertyId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['realestate'] }),
  });
}
