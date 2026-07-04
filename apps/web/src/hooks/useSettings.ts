'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { settingsService } from '@/services/settingsService';
import { applySettingsToOS } from '@/utils/applySettings';
import type { UserSettings } from '@/types';

export function useSettingsInit() {
  const token = useAuthStore((s) => s.getAccessToken());
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hydrateFromServer = useSettingsStore((s) => s.hydrateFromServer);

  const { data, isSuccess } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsService.get(token!),
    enabled: Boolean(isAuthenticated && token),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (isSuccess && data) {
      hydrateFromServer(data);
      applySettingsToOS(data);
    }
  }, [isSuccess, data, hydrateFromServer]);
}

export function useSettings() {
  return useSettingsStore();
}

export function useUpdateSettings() {
  const token = useAuthStore((s) => s.getAccessToken());
  const queryClient = useQueryClient();
  const updateSettings = useSettingsStore((s) => s.updateSettings);

  return useMutation({
    mutationFn: (partial: Partial<UserSettings>) => settingsService.update(partial, token!),
    onMutate: (partial) => {
      updateSettings(partial);
      applySettingsToOS(partial);
    },
    onSuccess: (data) => {
      updateSettings(data);
      applySettingsToOS(data);
      queryClient.setQueryData(['settings'], data);
    },
    onError: (_err, partial, _ctx) => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}

export function useResetSettings() {
  const token = useAuthStore((s) => s.getAccessToken());
  const queryClient = useQueryClient();
  const resetSettings = useSettingsStore((s) => s.resetSettings);

  return useMutation({
    mutationFn: () => settingsService.reset(token!),
    onSuccess: (data) => {
      resetSettings();
      updateFromServer(data);
      queryClient.setQueryData(['settings'], data);
    },
  });
}

export function updateFromServer(data: UserSettings) {
  useSettingsStore.getState().hydrateFromServer(data);
  applySettingsToOS(data);
}

export function useSupportedLanguages() {
  const token = useAuthStore((s) => s.getAccessToken());
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: ['settings', 'languages'],
    queryFn: () => settingsService.getLanguages(token!),
    enabled: Boolean(isAuthenticated && token),
    staleTime: 300_000,
  });
}

export function useDeviceAbout() {
  const token = useAuthStore((s) => s.getAccessToken());
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: ['settings', 'about'],
    queryFn: () => settingsService.getAbout(token!),
    enabled: Boolean(isAuthenticated && token),
  });
}
