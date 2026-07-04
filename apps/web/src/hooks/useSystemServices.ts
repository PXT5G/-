'use client';

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { realtimeService } from '@/services/realtimeService';
import { systemService } from '@/services/systemService';
import { useSystemStore } from '@/stores/systemStore';
import type {
  DeviceLocationState,
  NetworkStateSnapshot,
  DeviceStateSnapshot,
  DiagnosticsReport,
} from '@/types';

export function useSystemInit() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.getAccessToken());
  const setInitialized = useSystemStore((s) => s.setInitialized);

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    systemService.initialize().then(() => setInitialized(true)).catch(console.error);
  }, [isAuthenticated, token, setInitialized]);
}

function useSystemSocketInvalidation() {
  const queryClient = useQueryClient();
  const setLocation = useSystemStore((s) => s.setLocation);
  const setNetwork = useSystemStore((s) => s.setNetwork);
  const setDeviceState = useSystemStore((s) => s.setDeviceState);
  const setDiagnostics = useSystemStore((s) => s.setDiagnostics);
  const setServiceHealth = useSystemStore((s) => s.setServiceHealth);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.getAccessToken());

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const unsubs = [
      realtimeService.on('location:update', (p) => {
        setLocation(p.data as DeviceLocationState);
        queryClient.setQueryData(['system', 'location'], p.data);
      }),
      realtimeService.on('network:update', (p) => {
        setNetwork(p.data as NetworkStateSnapshot);
        queryClient.setQueryData(['system', 'network'], p.data);
      }),
      realtimeService.on('device:update', (p) => {
        setDeviceState(p.data as DeviceStateSnapshot);
        queryClient.setQueryData(['system', 'device'], p.data);
      }),
      realtimeService.on('battery:update', (p) => {
        queryClient.setQueryData(['system', 'battery'], p.data);
        queryClient.invalidateQueries({ queryKey: ['system', 'device'] });
      }),
      realtimeService.on('diagnostics:update', (p) => {
        setDiagnostics(p.data as DiagnosticsReport);
        queryClient.setQueryData(['system', 'diagnostics'], p.data);
      }),
      realtimeService.on('service:health', (p) => {
        const data = p.data as { services: Record<string, 'healthy' | 'degraded' | 'down'> };
        setServiceHealth(data.services);
      }),
      realtimeService.on('job:update', () => {
        queryClient.invalidateQueries({ queryKey: ['system', 'jobs'] });
      }),
      realtimeService.on('permission:update', () => {
        queryClient.invalidateQueries({ queryKey: ['system', 'permissions'] });
      }),
      realtimeService.on('system:ready', () => {
        queryClient.invalidateQueries({ queryKey: ['system'] });
      }),
    ];

    return () => unsubs.forEach((u) => u());
  }, [isAuthenticated, token, queryClient, setLocation, setNetwork, setDeviceState, setDiagnostics, setServiceHealth]);
}

export function useLocation() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.getAccessToken());
  useSystemSocketInvalidation();

  return useQuery({
    queryKey: ['system', 'location'],
    queryFn: () => systemService.getLocation(),
    enabled: isAuthenticated && !!token,
    staleTime: 15_000,
  });
}

export function useNetwork() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.getAccessToken());
  useSystemSocketInvalidation();

  return useQuery({
    queryKey: ['system', 'network'],
    queryFn: () => systemService.getNetwork(),
    enabled: isAuthenticated && !!token,
    staleTime: 10_000,
  });
}

export function useBattery() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.getAccessToken());
  useSystemSocketInvalidation();

  const deviceQuery = useQuery({
    queryKey: ['system', 'device'],
    queryFn: () => systemService.getDeviceState(),
    enabled: isAuthenticated && !!token,
    staleTime: 15_000,
  });

  return {
    ...deviceQuery,
    batteryLevel: deviceQuery.data?.batteryLevel,
    batteryHealth: deviceQuery.data?.batteryHealth,
    isCharging: deviceQuery.data?.isCharging,
    temperature: deviceQuery.data?.temperature,
    lowPowerMode: deviceQuery.data?.lowPowerMode,
  };
}

export function useDiagnostics() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.getAccessToken());
  useSystemSocketInvalidation();

  return useQuery({
    queryKey: ['system', 'diagnostics'],
    queryFn: () => systemService.getDiagnostics(),
    enabled: isAuthenticated && !!token,
    staleTime: 30_000,
  });
}

export function useJobs() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.getAccessToken());
  useSystemSocketInvalidation();

  return useQuery({
    queryKey: ['system', 'jobs'],
    queryFn: () => systemService.getJobs(),
    enabled: isAuthenticated && !!token,
    staleTime: 5_000,
  });
}

export function usePermissions(appId?: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.getAccessToken());
  useSystemSocketInvalidation();

  return useQuery({
    queryKey: ['system', 'permissions', appId],
    queryFn: () => systemService.getPermissions(appId),
    enabled: isAuthenticated && !!token,
    staleTime: 30_000,
  });
}

export function useNotifications() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.getAccessToken());

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    const unsub = realtimeService.on('notification:new', () => {
      // Handled by useRealtime → notificationStore
    });
    return () => unsub();
  }, [isAuthenticated, token]);

  return { brokerEnabled: true };
}

export { useSystemSocketInvalidation };
