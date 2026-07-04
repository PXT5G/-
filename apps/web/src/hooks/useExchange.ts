'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { realtimeService } from '@/services/realtimeService';
import { exchangeService } from '@/services/exchangeService';

export function useExchangeInit() {
  const token = useAuthStore((s) => s.getAccessToken());
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  useEffect(() => {
    if (!isAuthenticated || !token) return;
    exchangeService.initialize(token).catch(() => {});
  }, [isAuthenticated, token]);
}

export function useExchangeSocketSync() {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.getAccessToken());
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  useEffect(() => {
    if (!isAuthenticated || !token) return;
    const events = [
      'exchange:update', 'stock:update', 'trade:update', 'portfolio:update',
      'order:update', 'dividend:update', 'market:update', 'news:update',
    ];
    const unsubs = events.map((ev) =>
      realtimeService.on(ev as never, () => {
        queryClient.invalidateQueries({ queryKey: ['exchange'] });
      })
    );
    return () => unsubs.forEach((u) => u());
  }, [isAuthenticated, token, queryClient]);
}

export function useExchangeDashboard() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['exchange', 'dashboard'],
    queryFn: () => exchangeService.getDashboard(token!),
    enabled: Boolean(token),
    refetchInterval: 30_000,
  });
}

export function useExchangeStocks(params?: Record<string, string | number>) {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['exchange', 'stocks', params],
    queryFn: () => exchangeService.getStocks(token!, params),
    enabled: Boolean(token),
  });
}

export function useExchangeStock(id: string) {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['exchange', 'stock', id],
    queryFn: () => exchangeService.getStock(token!, id),
    enabled: Boolean(token && id),
  });
}

export function useExchangePortfolio() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['exchange', 'portfolio'],
    queryFn: () => exchangeService.getPortfolio(token!),
    enabled: Boolean(token),
    refetchInterval: 15_000,
  });
}

export function useExchangeOrders(status?: string) {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['exchange', 'orders', status],
    queryFn: () => exchangeService.getOrders(token!, status),
    enabled: Boolean(token),
  });
}

export function useExchangeTrades() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['exchange', 'trades'],
    queryFn: () => exchangeService.getTrades(token!),
    enabled: Boolean(token),
  });
}

export function useExchangeIndexes() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['exchange', 'indexes'],
    queryFn: () => exchangeService.getIndexes(token!),
    enabled: Boolean(token),
  });
}

export function useExchangeNews(category?: string) {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['exchange', 'news', category],
    queryFn: () => exchangeService.getNews(token!, category),
    enabled: Boolean(token),
  });
}

export function useExchangeWatchlist() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['exchange', 'watchlist'],
    queryFn: () => exchangeService.getWatchlist(token!),
    enabled: Boolean(token),
  });
}

export function useExchangeAnalytics() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['exchange', 'analytics'],
    queryFn: () => exchangeService.getAnalytics(token!),
    enabled: Boolean(token),
  });
}

export function useCreateOrder() {
  const token = useAuthStore((s) => s.getAccessToken());
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => exchangeService.createOrder(token!, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exchange'] }),
  });
}

export function useCancelOrder() {
  const token = useAuthStore((s) => s.getAccessToken());
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => exchangeService.cancelOrder(token!, orderId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['exchange'] }),
  });
}
