'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { realtimeService } from '@/services/realtimeService';
import { justiceService } from '@/services/justiceService';

export function useJusticeInit() {
  const token = useAuthStore((s) => s.getAccessToken());
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    justiceService.initialize(token).catch(() => {});
  }, [isAuthenticated, token]);
}

export function useJusticeDashboard() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['justice', 'dashboard'],
    queryFn: () => justiceService.getDashboard(token!),
    enabled: Boolean(token),
    refetchInterval: 30_000,
  });
}

export function useJusticeSocketSync() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.getAccessToken());

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    const events = [
      'justice:initialized', 'justice:case:update', 'justice:hearing:update',
      'justice:trial:update', 'justice:evidence:update', 'justice:warrant:review',
      'justice:appeal:update', 'justice:judgment:issued', 'justice:sentence:issued',
      'justice:courtroom:live', 'justice:docket:update', 'justice:citation:resolved',
    ];
    const unsubs = events.map((ev) =>
      realtimeService.on(ev as never, () => {
        queryClient.invalidateQueries({ queryKey: ['justice'] });
      })
    );
    return () => unsubs.forEach((u) => u());
  }, [isAuthenticated, token, queryClient]);
}

export function useJusticeCases(status?: string) {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['justice', 'cases', status],
    queryFn: () => justiceService.getCases(token!, status),
    enabled: Boolean(token),
  });
}

export function useJusticeCase(caseId: string) {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['justice', 'case', caseId],
    queryFn: () => justiceService.getCase(token!, caseId),
    enabled: Boolean(token) && Boolean(caseId),
  });
}

export function useJusticeHearings(status?: string) {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['justice', 'hearings', status],
    queryFn: () => justiceService.getHearings(token!, status),
    enabled: Boolean(token),
    refetchInterval: 20_000,
  });
}

export function useJusticeTrials() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['justice', 'trials'],
    queryFn: () => justiceService.getTrials(token!),
    enabled: Boolean(token),
  });
}

export function useJusticeOfficials(role?: string) {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['justice', 'officials', role],
    queryFn: () => justiceService.getOfficials(token!, role),
    enabled: Boolean(token),
  });
}

export function useJusticeCourtrooms() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['justice', 'courtrooms'],
    queryFn: () => justiceService.getCourtrooms(token!),
    enabled: Boolean(token),
  });
}

export function useJusticeWarrants(status?: string) {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['justice', 'warrants', status],
    queryFn: () => justiceService.getWarrants(token!, status),
    enabled: Boolean(token),
  });
}

export function useJusticeAppeals() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['justice', 'appeals'],
    queryFn: () => justiceService.getAppeals(token!),
    enabled: Boolean(token),
  });
}

export function useJusticeContestedCitations() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['justice', 'citations'],
    queryFn: () => justiceService.getContestedCitations(token!),
    enabled: Boolean(token),
  });
}

export function useJusticeLaws() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['justice', 'laws'],
    queryFn: () => justiceService.getLaws(token!),
    enabled: Boolean(token),
  });
}

export function useJusticeDocket(date?: string) {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['justice', 'docket', date],
    queryFn: () => justiceService.getDocket(token!, date),
    enabled: Boolean(token),
  });
}

export function useJusticeAnalytics() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['justice', 'analytics'],
    queryFn: () => justiceService.getAnalytics(token!),
    enabled: Boolean(token),
  });
}

export function useUpdateJusticeStatus() {
  const token = useAuthStore((s) => s.getAccessToken());
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (status: string) => justiceService.updateStatus(token!, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['justice'] }),
  });
}

export function useJusticeSearch() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useMutation({
    mutationFn: ({ searchType, query }: { searchType: string; query: string }) =>
      justiceService.search(token!, searchType, query),
  });
}

export function useReviewWarrant() {
  const token = useAuthStore((s) => s.getAccessToken());
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ warrantReviewId, approved, denialReason }: { warrantReviewId: string; approved: boolean; denialReason?: string }) =>
      justiceService.reviewWarrant(token!, warrantReviewId, approved, denialReason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['justice'] }),
  });
}

export function useResolveCitation() {
  const token = useAuthStore((s) => s.getAccessToken());
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ citationId, resolution, reducedAmount }: { citationId: string; resolution: string; reducedAmount?: number }) =>
      justiceService.resolveCitation(token!, citationId, resolution, reducedAmount),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['justice'] }),
  });
}
