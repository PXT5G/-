'use client';

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { premiumExperienceService } from '@/services/premiumExperienceService';
import { usePremiumExperienceStore } from '@/stores/premiumExperienceStore';
import { useWidgetStore } from '@/stores/widgetStore';
import { realtimeService } from '@/services/realtimeService';
import type { PremiumExperienceSnapshot, WidgetRegistrySnapshot } from '@/types';

const PREMIUM_KEY = ['premium-experience'];

export function usePremiumExperienceInit() {
  const hydrate = usePremiumExperienceStore((s) => s.hydrate);
  const registerWidget = useWidgetStore((s) => s.registerWidget);

  const query = useQuery({
    queryKey: PREMIUM_KEY,
    queryFn: () => premiumExperienceService.getProfile(),
    staleTime: 60_000,
  });

  const registryQuery = useQuery({
    queryKey: [...PREMIUM_KEY, 'registry'],
    queryFn: () => premiumExperienceService.getWidgetRegistry(),
    staleTime: 120_000,
  });

  useEffect(() => {
    if (query.data) hydrate(query.data);
  }, [query.data, hydrate]);

  useEffect(() => {
    if (!registryQuery.data) return;
    for (const entry of registryQuery.data) {
      registerWidget({
        id: entry.widgetId,
        appId: entry.appId,
        name: entry.name,
        sizes: entry.sizes as ('small' | 'medium' | 'large')[],
        defaultSize: entry.defaultSize as 'small' | 'medium' | 'large',
      });
    }
  }, [registryQuery.data, registerWidget]);

  return query;
}

export function usePremiumExperienceRealtime() {
  const setProfile = usePremiumExperienceStore((s) => s.setProfile);
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubs = [
      realtimeService.on('premium:update', (payload) => {
        const data = payload.data as PremiumExperienceSnapshot;
        setProfile(data);
      }),
      realtimeService.on('premium:ready', (payload) => {
        const data = payload.data as PremiumExperienceSnapshot;
        setProfile(data);
        void queryClient.invalidateQueries({ queryKey: PREMIUM_KEY });
      }),
      realtimeService.on('notification:history', () => {
        void queryClient.invalidateQueries({ queryKey: [...PREMIUM_KEY, 'notifications'] });
      }),
      realtimeService.on('widget:data:update', () => {
        void queryClient.invalidateQueries({ queryKey: [...PREMIUM_KEY, 'widget'] });
      }),
    ];
    return () => unsubs.forEach((u) => u());
  }, [setProfile, queryClient]);
}

export function useAppLibrary(enabled = false) {
  const setAppLibrary = usePremiumExperienceStore((s) => s.setAppLibrary);

  return useQuery({
    queryKey: [...PREMIUM_KEY, 'app-library'],
    queryFn: async () => {
      const data = await premiumExperienceService.getAppLibrary();
      setAppLibrary(data);
      return data;
    },
    enabled,
    staleTime: 30_000,
  });
}

export function useNotificationHistory() {
  const setNotificationHistory = usePremiumExperienceStore((s) => s.setNotificationHistory);

  return useQuery({
    queryKey: [...PREMIUM_KEY, 'notifications'],
    queryFn: async () => {
      const data = await premiumExperienceService.getNotificationHistory();
      setNotificationHistory(data);
      return data;
    },
    staleTime: 15_000,
  });
}

export function useWidgetData(type: string, enabled = true) {
  return useQuery({
    queryKey: [...PREMIUM_KEY, 'widget', type],
    queryFn: () => premiumExperienceService.getWidgetData(type),
    enabled: enabled && !!type,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useWidgetRegistry() {
  return useQuery<WidgetRegistrySnapshot[]>({
    queryKey: [...PREMIUM_KEY, 'registry'],
    queryFn: () => premiumExperienceService.getWidgetRegistry(),
    staleTime: 120_000,
  });
}
