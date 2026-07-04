'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { realtimeService } from '@/services/realtimeService';
import { deviceEcosystemService } from '@/services/deviceEcosystemService';
import { useDeviceEcosystemStore } from '@/stores/deviceEcosystemStore';
import type {
  DeviceProfileSnapshot,
  PowerStateSnapshot,
  SecurityConfigSnapshot,
  RecoveryStateSnapshot,
} from '@/types';

function useDeviceEcosystemSocketSync() {
  const queryClient = useQueryClient();
  const setProfile = useDeviceEcosystemStore((s) => s.setProfile);
  const setPower = useDeviceEcosystemStore((s) => s.setPower);
  const setSecurity = useDeviceEcosystemStore((s) => s.setSecurity);
  const setSyncStatus = useDeviceEcosystemStore((s) => s.setSyncStatus);
  const setRecovery = useDeviceEcosystemStore((s) => s.setRecovery);
  const setReady = useDeviceEcosystemStore((s) => s.setReady);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.getAccessToken());

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const unsubs = [
      realtimeService.on('device:ecosystem:ready', () => {
        setReady(true);
        queryClient.invalidateQueries({ queryKey: ['device-ecosystem'] });
      }),
      realtimeService.on('device:profile:update', (p) => {
        setProfile(p.data as DeviceProfileSnapshot);
        queryClient.invalidateQueries({ queryKey: ['device-ecosystem', 'profile'] });
      }),
      realtimeService.on('device:power:update', (p) => {
        setPower(p.data as PowerStateSnapshot);
        queryClient.invalidateQueries({ queryKey: ['device-ecosystem', 'power'] });
      }),
      realtimeService.on('device:power:emergency', (p) => {
        setPower(p.data as PowerStateSnapshot);
        queryClient.invalidateQueries({ queryKey: ['device-ecosystem', 'power'] });
      }),
      realtimeService.on('device:security:update', (p) => {
        setSecurity(p.data as SecurityConfigSnapshot);
        queryClient.invalidateQueries({ queryKey: ['device-ecosystem', 'security'] });
      }),
      realtimeService.on('device:sync:progress', (p) => {
        const data = p.data as { progress: number };
        setSyncStatus({ syncing: true, progress: data.progress });
      }),
      realtimeService.on('device:sync:complete', () => {
        queryClient.invalidateQueries({ queryKey: ['device-ecosystem', 'sync'] });
      }),
      realtimeService.on('device:backup:complete', () => {
        queryClient.invalidateQueries({ queryKey: ['device-ecosystem', 'backup'] });
      }),
      realtimeService.on('device:maintenance:complete', () => {
        queryClient.invalidateQueries({ queryKey: ['device-ecosystem', 'maintenance'] });
      }),
      realtimeService.on('device:recovery:update', (p) => {
        setRecovery(p.data as RecoveryStateSnapshot);
        queryClient.invalidateQueries({ queryKey: ['device-ecosystem', 'recovery'] });
      }),
      realtimeService.on('device:diagnostics:extended', () => {
        queryClient.invalidateQueries({ queryKey: ['device-ecosystem', 'diagnostics'] });
      }),
    ];

    return () => unsubs.forEach((u) => u());
  }, [isAuthenticated, token, queryClient, setProfile, setPower, setSecurity, setSyncStatus, setRecovery, setReady]);
}

export function useDeviceEcosystemInit() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.getAccessToken());
  const setReady = useDeviceEcosystemStore((s) => s.setReady);

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    deviceEcosystemService.initialize().then(() => setReady(true)).catch(console.error);
  }, [isAuthenticated, token, setReady]);
}

export function useDeviceProfile() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.getAccessToken());
  const setProfile = useDeviceEcosystemStore((s) => s.setProfile);
  useDeviceEcosystemSocketSync();

  return useQuery({
    queryKey: ['device-ecosystem', 'profile'],
    queryFn: async () => {
      const data = await deviceEcosystemService.getProfile();
      setProfile(data);
      return data;
    },
    enabled: isAuthenticated && !!token,
    staleTime: 30_000,
  });
}

export function useDevicePower() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.getAccessToken());
  const setPower = useDeviceEcosystemStore((s) => s.setPower);
  useDeviceEcosystemSocketSync();

  return useQuery({
    queryKey: ['device-ecosystem', 'power'],
    queryFn: async () => {
      const data = await deviceEcosystemService.getPower();
      setPower(data);
      return data;
    },
    enabled: isAuthenticated && !!token,
    staleTime: 10_000,
  });
}

export function useDeviceSecurity() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.getAccessToken());
  const setSecurity = useDeviceEcosystemStore((s) => s.setSecurity);
  useDeviceEcosystemSocketSync();

  return useQuery({
    queryKey: ['device-ecosystem', 'security'],
    queryFn: async () => {
      const data = await deviceEcosystemService.getSecurity();
      setSecurity(data);
      return data;
    },
    enabled: isAuthenticated && !!token,
    staleTime: 15_000,
  });
}

export function useDeviceBackups() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.getAccessToken());
  useDeviceEcosystemSocketSync();

  return useQuery({
    queryKey: ['device-ecosystem', 'backup'],
    queryFn: () => deviceEcosystemService.getBackups(),
    enabled: isAuthenticated && !!token,
    staleTime: 20_000,
  });
}

export function useDeviceSync() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.getAccessToken());
  useDeviceEcosystemSocketSync();

  return useQuery({
    queryKey: ['device-ecosystem', 'sync'],
    queryFn: () => deviceEcosystemService.getSyncStatus(),
    enabled: isAuthenticated && !!token,
    staleTime: 10_000,
  });
}

export function useDeviceRecovery() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.getAccessToken());
  useDeviceEcosystemSocketSync();

  return useQuery({
    queryKey: ['device-ecosystem', 'recovery'],
    queryFn: () => deviceEcosystemService.getRecovery(),
    enabled: isAuthenticated && !!token,
    staleTime: 30_000,
  });
}

export function useDeviceMaintenance() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.getAccessToken());
  useDeviceEcosystemSocketSync();

  return useQuery({
    queryKey: ['device-ecosystem', 'maintenance'],
    queryFn: () => deviceEcosystemService.getMaintenanceHistory(),
    enabled: isAuthenticated && !!token,
    staleTime: 20_000,
  });
}

export function useCreateBackup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => deviceEcosystemService.createBackup(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['device-ecosystem', 'backup'] }),
  });
}

export function useRunMaintenance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (action: string) => deviceEcosystemService.runMaintenance(action),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['device-ecosystem', 'maintenance'] }),
  });
}

export { useDeviceEcosystemSocketSync };
