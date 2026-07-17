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
    // Full socket parity — every backend-emitted police event
    const events = [
      'police:dispatch:new', 'police:dispatch:update', 'police:officer:status',
      'police:911:new', 'police:panic', 'police:bolo:new', 'police:warrant:new',
      'police:case:update', 'police:evidence:new', 'police:initialized',
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

export function usePoliceReports() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['police', 'reports'],
    queryFn: () => policeService.getReports(token!),
    enabled: Boolean(token),
  });
}

export function usePoliceCitations() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['police', 'citations'],
    queryFn: () => policeService.getCitations(token!),
    enabled: Boolean(token),
  });
}

export function usePoliceCases() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['police', 'cases'],
    queryFn: () => policeService.getCases(token!),
    enabled: Boolean(token),
  });
}

export function usePoliceEvidence() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['police', 'evidence'],
    queryFn: () => policeService.getEvidence(token!),
    enabled: Boolean(token),
  });
}

export function usePoliceNotes() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['police', 'notes'],
    queryFn: () => policeService.getNotes(token!),
    enabled: Boolean(token),
  });
}

export function usePolicePanics() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['police', 'panics'],
    queryFn: () => policeService.getPanics(token!),
    enabled: Boolean(token),
  });
}

export function usePoliceAuditLog() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['police', 'audit-log'],
    queryFn: () => policeService.getAuditLog(token!),
    enabled: Boolean(token),
  });
}

export function usePolicePrison() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['police', 'prison'],
    queryFn: () => policeService.getPrison(token!),
    enabled: Boolean(token),
  });
}

export function usePoliceShifts() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['police', 'shifts'],
    queryFn: () => policeService.getShifts(token!),
    enabled: Boolean(token),
  });
}

export function usePoliceCreate() {
  const token = useAuthStore((s) => s.getAccessToken());
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['police'] });
  return {
    report: useMutation({ mutationFn: (b: Record<string, unknown>) => policeService.createReport(token!, b), onSuccess: invalidate }),
    citation: useMutation({ mutationFn: (b: Record<string, unknown>) => policeService.createCitation(token!, b), onSuccess: invalidate }),
    caseFile: useMutation({ mutationFn: (b: Record<string, unknown>) => policeService.createCase(token!, b), onSuccess: invalidate }),
    evidence: useMutation({ mutationFn: (b: Record<string, unknown>) => policeService.createEvidence(token!, b), onSuccess: invalidate }),
    bolo: useMutation({ mutationFn: (b: Record<string, unknown>) => policeService.createBolo(token!, b), onSuccess: invalidate }),
    warrant: useMutation({ mutationFn: (b: Record<string, unknown>) => policeService.createWarrant(token!, b), onSuccess: invalidate }),
    note: useMutation({ mutationFn: (b: Record<string, unknown>) => policeService.createNote(token!, b), onSuccess: invalidate }),
    dispatch: useMutation({ mutationFn: (b: Record<string, unknown>) => policeService.createDispatch(token!, b), onSuccess: invalidate }),
    custody: useMutation({ mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) => policeService.transferEvidence(token!, id, body), onSuccess: invalidate }),
    caseUpdate: useMutation({ mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) => policeService.updateCase(token!, id, body), onSuccess: invalidate }),
    book: useMutation({ mutationFn: (b: Record<string, unknown>) => policeService.bookInmate(token!, b), onSuccess: invalidate }),
    release: useMutation({ mutationFn: (id: string) => policeService.releaseInmate(token!, id), onSuccess: invalidate }),
    shift: useMutation({ mutationFn: (b: Record<string, unknown>) => policeService.createShift(token!, b), onSuccess: invalidate }),
    clock: useMutation({ mutationFn: ({ id, action }: { id: string; action: 'start' | 'end' }) => policeService.clockShift(token!, id, action), onSuccess: invalidate }),
  };
}
