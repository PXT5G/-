'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { realtimeService } from '@/services/realtimeService';
import { economyService } from '@/services/economyService';

export function useEconomyInit() {
  const token = useAuthStore((s) => s.getAccessToken());
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated || !token || user?.role !== 'admin') return;
    economyService.initialize(token).catch(() => {});
  }, [isAuthenticated, token, user?.role]);
}

export function useEconomySocketSync() {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.getAccessToken());
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated || !token || user?.role !== 'admin') return;
    const events = ['economy:update', 'market:update', 'valuation:update', 'inflation:update', 'gdp:update'];
    const unsubs = events.map((ev) =>
      realtimeService.on(ev as never, () => {
        queryClient.invalidateQueries({ queryKey: ['economy'] });
      })
    );
    return () => unsubs.forEach((u) => u());
  }, [isAuthenticated, token, user?.role, queryClient]);
}

export function useEconomyDashboard() {
  const token = useAuthStore((s) => s.getAccessToken());
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['economy', 'dashboard'],
    queryFn: () => economyService.getDashboard(token!),
    enabled: Boolean(token && user?.role === 'admin'),
    refetchInterval: 60_000,
  });
}

export function useEconomyAnalytics() {
  const token = useAuthStore((s) => s.getAccessToken());
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['economy', 'analytics'],
    queryFn: () => economyService.getAnalytics(token!),
    enabled: Boolean(token && user?.role === 'admin'),
  });
}

export function useEconomyGdp() {
  const token = useAuthStore((s) => s.getAccessToken());
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['economy', 'gdp'],
    queryFn: () => economyService.getGdpHistory(token!),
    enabled: Boolean(token && user?.role === 'admin'),
  });
}

export function useEconomyInflation() {
  const token = useAuthStore((s) => s.getAccessToken());
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['economy', 'inflation'],
    queryFn: () => economyService.getInflationHistory(token!),
    enabled: Boolean(token && user?.role === 'admin'),
  });
}

export function useEconomyValuations() {
  const token = useAuthStore((s) => s.getAccessToken());
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['economy', 'valuations'],
    queryFn: () => economyService.getValuations(token!),
    enabled: Boolean(token && user?.role === 'admin'),
  });
}

export function useEconomyBankMetrics() {
  const token = useAuthStore((s) => s.getAccessToken());
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['economy', 'bank'],
    queryFn: () => economyService.getBankMetrics(token!),
    enabled: Boolean(token && user?.role === 'admin'),
  });
}

export function useTriggerEconomyTick() {
  const token = useAuthStore((s) => s.getAccessToken());
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => economyService.triggerTick(token!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['economy'] }),
  });
}
