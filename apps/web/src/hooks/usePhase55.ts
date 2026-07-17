'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { realtimeService } from '@/services/realtimeService';
import {
  securityAppService, privacyAppService, cloudAppService, findMyAppService,
  updatesAppService, developerAppService, analyticsAppService, diagnosticsAppService, enterpriseAppService,
} from '@/services/phase55AppService';

export function useSecurityInit() {
  const token = useAuthStore((s) => s.getAccessToken());
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  useEffect(() => {
    if (!isAuthenticated || !token) return;
    securityAppService.initialize(token).catch(() => {});
  }, [isAuthenticated, token]);
}

export function useSecuritySocketSync() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  useEffect(() => {
    if (!isAuthenticated) return;
    const events = ['security:alert', 'security:update', 'cloud:backup', 'device:lost', 'update:available', 'enterprise:update'];
    const unsubs = events.map((ev) => realtimeService.on(ev as never, () => queryClient.invalidateQueries({ queryKey: ['phase55'] })));
    return () => unsubs.forEach((u) => u());
  }, [isAuthenticated, queryClient]);
}

export function useSecurityDashboard() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({ queryKey: ['phase55', 'security'], queryFn: () => securityAppService.dashboard(token!), enabled: !!token });
}

export function usePrivacyDashboard() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({ queryKey: ['phase55', 'privacy'], queryFn: () => privacyAppService.dashboard(token!), enabled: !!token });
}

export function useCloudBackups() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({ queryKey: ['phase55', 'cloud'], queryFn: () => cloudAppService.listBackups(token!), enabled: !!token });
}

export function useCreateBackup() {
  const token = useAuthStore((s) => s.getAccessToken());
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => cloudAppService.createBackup(token!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['phase55', 'cloud'] }),
  });
}

export function useRestoreBackup() {
  const token = useAuthStore((s) => s.getAccessToken());
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (backupId: string) => cloudAppService.restoreBackup(token!, backupId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['phase55', 'cloud'] }),
  });
}

export function useCloudSync() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useMutation({
    mutationFn: () => cloudAppService.sync(token!),
  });
}

export function useFindMyDevices() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({ queryKey: ['phase55', 'find-my'], queryFn: () => findMyAppService.listDevices(token!), enabled: !!token });
}

export function useMarkDeviceLost() {
  const token = useAuthStore((s) => s.getAccessToken());
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (deviceId: string) => findMyAppService.markLost(token!, deviceId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['phase55', 'find-my'] }),
  });
}

export function useUpdatesCheck() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({ queryKey: ['phase55', 'updates'], queryFn: () => updatesAppService.check(token!), enabled: !!token });
}

export function useDeveloperDashboard() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({ queryKey: ['phase55', 'developer'], queryFn: () => developerAppService.dashboard(token!), enabled: !!token });
}

export function useAnalyticsCenter() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({ queryKey: ['phase55', 'analytics'], queryFn: () => analyticsAppService.center(token!), enabled: !!token });
}

export function useDiagnosticsCenter() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({ queryKey: ['phase55', 'diagnostics'], queryFn: () => diagnosticsAppService.center(token!), enabled: !!token });
}

export function useEnterpriseOrgs() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({ queryKey: ['phase55', 'enterprise'], queryFn: () => enterpriseAppService.listOrgs(token!), enabled: !!token });
}

export function useCreateEnterpriseOrg() {
  const token = useAuthStore((s) => s.getAccessToken());
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => enterpriseAppService.createOrg(token!, name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['phase55', 'enterprise'] }),
  });
}
