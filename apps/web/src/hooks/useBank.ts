'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { realtimeService } from '@/services/realtimeService';
import { bankService } from '@/services/bankService';

export function useBankInit() {
  const token = useAuthStore((s) => s.getAccessToken());
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    bankService.initialize(token).catch(() => {});
  }, [isAuthenticated, token]);
}

export function useBankSocketSync() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;
    const events = ['bank:update', 'bank:transfer', 'bank:transaction', 'bank:balance', 'bank:card:update', 'bank:initialized'];
    const unsubs = events.map((ev) =>
      realtimeService.on(ev as never, () => {
        queryClient.invalidateQueries({ queryKey: ['bank'] });
      })
    );
    return () => unsubs.forEach((u) => u());
  }, [isAuthenticated, queryClient]);
}

export function useBankDashboard() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['bank', 'dashboard'],
    queryFn: () => bankService.getDashboard(token!),
    enabled: !!token,
  });
}

export function useBankAccounts() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['bank', 'accounts'],
    queryFn: () => bankService.getAccounts(token!),
    enabled: !!token,
  });
}

export function useBankCards() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['bank', 'cards'],
    queryFn: () => bankService.getCards(token!),
    enabled: !!token,
  });
}

export function useBankTransactions(params?: { accountId?: string; limit?: number; search?: string }) {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['bank', 'transactions', params],
    queryFn: () => bankService.getTransactions(token!, params),
    enabled: !!token,
  });
}

export function useBankBudget() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['bank', 'budget'],
    queryFn: () => bankService.getBudget(token!),
    enabled: !!token,
  });
}

export function useBankAnalytics() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['bank', 'analytics'],
    queryFn: () => bankService.getAnalytics(token!),
    enabled: !!token,
  });
}

export function useFreezeCard() {
  const token = useAuthStore((s) => s.getAccessToken());
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cardId: string) => bankService.freezeCard(token!, cardId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bank'] }),
  });
}

export function useInternalTransfer() {
  const token = useAuthStore((s) => s.getAccessToken());
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { fromAccountId: string; toAccountId: string; amount: number; description: string }) =>
      bankService.internalTransfer(token!, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bank'] }),
  });
}
