'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { realtimeService } from '@/services/realtimeService';
import { emsService } from '@/services/emsService';

export function useEmsInit() {
  const token = useAuthStore((s) => s.getAccessToken());
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    emsService.initialize(token).catch(() => {});
  }, [isAuthenticated, token]);
}

export function useEmsDashboard() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['ems', 'dashboard'],
    queryFn: () => emsService.getDashboard(token!),
    enabled: Boolean(token),
    refetchInterval: 30_000,
  });
}

export function useEmsSocketSync() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.getAccessToken());

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    const events = [
      'ems:initialized', 'ems:dispatch:new', 'ems:dispatch:update', 'ems:unit:update',
      'ems:personnel:status', 'ems:911:new', 'ems:patient:update', 'ems:ambulance:gps',
      'ems:hospital:capacity', 'ems:incident:update', 'ems:alert', 'ems:helicopter:dispatch',
      'ems:admission:update', 'ems:queue:update',
    ];
    const unsubs = events.map((ev) =>
      realtimeService.on(ev as never, () => {
        queryClient.invalidateQueries({ queryKey: ['ems'] });
      })
    );
    return () => unsubs.forEach((u) => u());
  }, [isAuthenticated, token, queryClient]);
}

export function useEmsUnits() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['ems', 'units'],
    queryFn: () => emsService.getUnits(token!),
    enabled: Boolean(token),
    refetchInterval: 15_000,
  });
}

export function useEmsDispatches(is911?: boolean) {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['ems', 'dispatches', is911],
    queryFn: () => emsService.getDispatches(token!, { is911 }),
    enabled: Boolean(token),
    refetchInterval: 15_000,
  });
}

export function useEmsPatients(status?: string) {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['ems', 'patients', status],
    queryFn: () => emsService.getPatients(token!, status),
    enabled: Boolean(token),
  });
}

export function useEmsHospitals() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['ems', 'hospitals'],
    queryFn: () => emsService.getHospitals(token!),
    enabled: Boolean(token),
    refetchInterval: 30_000,
  });
}

export function useEmsAmbulances() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['ems', 'ambulances'],
    queryFn: () => emsService.getAmbulances(token!),
    enabled: Boolean(token),
  });
}

export function useEmsIncidents() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['ems', 'incidents'],
    queryFn: () => emsService.getIncidents(token!),
    enabled: Boolean(token),
  });
}

export function useEmsPersonnel(role?: string) {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['ems', 'personnel', role],
    queryFn: () => emsService.getPersonnel(token!, role),
    enabled: Boolean(token),
  });
}

export function useEmsAnalytics() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['ems', 'analytics'],
    queryFn: () => emsService.getAnalytics(token!),
    enabled: Boolean(token),
  });
}

export function useUpdateEmsStatus() {
  const token = useAuthStore((s) => s.getAccessToken());
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (status: string) => emsService.updateStatus(token!, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ems'] }),
  });
}

export function useEmsSearch() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useMutation({
    mutationFn: ({ searchType, query }: { searchType: string; query: string }) =>
      emsService.search(token!, searchType, query),
  });
}

export function useAssignAmbulance() {
  const token = useAuthStore((s) => s.getAccessToken());
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ dispatchId, unitId }: { dispatchId: string; unitId: string }) =>
      emsService.assignAmbulance(token!, dispatchId, unitId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ems'] }),
  });
}

export function useRouteHospital() {
  const token = useAuthStore((s) => s.getAccessToken());
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ dispatchId, hospitalId }: { dispatchId: string; hospitalId?: string }) =>
      emsService.routeHospital(token!, dispatchId, hospitalId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ems'] }),
  });
}

export function useHelicopterDispatch() {
  const token = useAuthStore((s) => s.getAccessToken());
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dispatchId: string) => emsService.dispatchHelicopter(token!, dispatchId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ems'] }),
  });
}

export function useEmsRecords() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({ queryKey: ['ems', 'records'], queryFn: () => emsService.getRecords(token!), enabled: Boolean(token) });
}

export function useEmsTreatments() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({ queryKey: ['ems', 'treatments'], queryFn: () => emsService.getTreatments(token!), enabled: Boolean(token) });
}

export function useEmsNotes() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({ queryKey: ['ems', 'notes'], queryFn: () => emsService.getNotes(token!), enabled: Boolean(token) });
}

export function useEmsAuditLog() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({ queryKey: ['ems', 'audit-log'], queryFn: () => emsService.getAuditLog(token!), enabled: Boolean(token) });
}

export function useEmsCreate() {
  const token = useAuthStore((s) => s.getAccessToken());
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['ems'] });
  return {
    incident: useMutation({ mutationFn: (b: Record<string, unknown>) => emsService.createIncident(token!, b), onSuccess: invalidate }),
    patient: useMutation({ mutationFn: (b: Record<string, unknown>) => emsService.createPatientRecord(token!, b), onSuccess: invalidate }),
    note: useMutation({ mutationFn: (b: Record<string, unknown>) => emsService.createNote(token!, b), onSuccess: invalidate }),
    alert: useMutation({ mutationFn: (b: Record<string, unknown>) => emsService.broadcastAlert(token!, b), onSuccess: invalidate }),
    shift: useMutation({ mutationFn: (b: Record<string, unknown>) => emsService.createShift(token!, b), onSuccess: invalidate }),
    clock: useMutation({ mutationFn: ({ id, action }: { id: string; action: 'start' | 'end' }) => emsService.clockShift(token!, id, action), onSuccess: invalidate }),
    equipment: useMutation({ mutationFn: ({ id, body }: { id: string; body: { add?: string; remove?: string } }) => emsService.updateEquipment(token!, id, body), onSuccess: invalidate }),
  };
}

export function useEmsShifts() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({ queryKey: ['ems', 'shifts'], queryFn: () => emsService.getShifts(token!), enabled: Boolean(token) });
}
