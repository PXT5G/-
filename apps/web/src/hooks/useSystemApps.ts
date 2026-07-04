'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { systemAppsService } from '@/services/systemAppsService';

export function useSystemAppsInit() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.getAccessToken());
  useEffect(() => {
    if (!isAuthenticated || !token) return;
    systemAppsService.initialize().catch(console.error);
  }, [isAuthenticated, token]);
}

export function useGalleryItems(filter?: Record<string, string>) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['system-apps', 'gallery', filter],
    queryFn: () => systemAppsService.getGalleryItems(filter),
    enabled: isAuthenticated,
    staleTime: 10_000,
  });
}

export function useCalendarEvents() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['system-apps', 'calendar'],
    queryFn: () => systemAppsService.getEvents(),
    enabled: isAuthenticated,
    staleTime: 15_000,
  });
}

export function useClockAlarms() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['system-apps', 'clock', 'alarms'],
    queryFn: () => systemAppsService.getAlarms(),
    enabled: isAuthenticated,
  });
}

export function useNotes(q?: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['system-apps', 'notes', q],
    queryFn: () => systemAppsService.getNotes(q),
    enabled: isAuthenticated,
  });
}

export function useWeather() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['system-apps', 'weather'],
    queryFn: () => systemAppsService.getWeather(),
    enabled: isAuthenticated,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
}

export function useMapsState() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['system-apps', 'maps'],
    queryFn: () => systemAppsService.getMapsState(),
    enabled: isAuthenticated,
    staleTime: 5_000,
  });
}

export function useVoiceRecordings() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['system-apps', 'voice-recorder'],
    queryFn: () => systemAppsService.getRecordings(),
    enabled: isAuthenticated,
  });
}

export function useCapturePhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: Record<string, unknown>) => systemAppsService.capturePhoto(params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['system-apps', 'gallery'] });
      qc.invalidateQueries({ queryKey: ['system-apps', 'camera'] });
    },
  });
}
