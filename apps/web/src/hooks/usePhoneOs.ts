'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { phoneOsService } from '@/services/phoneOsService';
import { usePhoneOsStore } from '@/stores/phoneOsStore';
import { useDynamicIslandStore } from '@/stores/dynamicIslandStore';
import { realtimeService } from '@/services/realtimeService';
import type {
  BatteryStateSnapshot,
  PerformanceStateSnapshot,
  LiveActivitySnapshot,
  ControlCenterConfigSnapshot,
  StatusBarConfigSnapshot,
} from '@/types';

const PHONE_OS_KEY = ['phone-os'];

export function usePhoneOsInit() {
  const hydrate = usePhoneOsStore((s) => s.hydrate);
  const setInitialized = usePhoneOsStore((s) => s.setInitialized);

  const query = useQuery({
    queryKey: PHONE_OS_KEY,
    queryFn: () => phoneOsService.getInfo(),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (query.data) {
      hydrate({
        power: query.data.power,
        battery: query.data.battery,
        performance: query.data.performance,
        configs: query.data.configs,
      });
      setInitialized(true);
    }
  }, [query.data, hydrate, setInitialized]);

  return query;
}

export function usePhoneOsRealtime() {
  const queryClient = useQueryClient();
  const setBattery = usePhoneOsStore((s) => s.setBattery);
  const setPerformance = usePhoneOsStore((s) => s.setPerformance);
  const setControlCenter = usePhoneOsStore((s) => s.setControlCenter);
  const setStatusBar = usePhoneOsStore((s) => s.setStatusBar);
  const upsertLiveActivity = usePhoneOsStore((s) => s.upsertLiveActivity);
  const islandShow = useDynamicIslandStore((s) => s.show);
  const islandHide = useDynamicIslandStore((s) => s.hide);
  const islandSetProgress = useDynamicIslandStore((s) => s.setProgress);

  useEffect(() => {
    const unsubs = [
      realtimeService.on('battery:update', (payload) => {
        const data = payload.data as BatteryStateSnapshot;
        setBattery(data);
      }),
      realtimeService.on('charging:start', () => {
        void queryClient.invalidateQueries({ queryKey: PHONE_OS_KEY });
      }),
      realtimeService.on('charging:stop', () => {
        void queryClient.invalidateQueries({ queryKey: PHONE_OS_KEY });
      }),
      realtimeService.on('performance:update', (payload) => {
        setPerformance(payload.data as PerformanceStateSnapshot);
      }),
      realtimeService.on('control:center:update', (payload) => {
        setControlCenter(payload.data as ControlCenterConfigSnapshot);
      }),
      realtimeService.on('status:update', (payload) => {
        setStatusBar(payload.data as StatusBarConfigSnapshot);
      }),
      realtimeService.on('liveactivity:update', (payload) => {
        const { activity } = payload.data as { activity: LiveActivitySnapshot };
        upsertLiveActivity(activity);
        if (activity.dynamicIsland && activity.state === 'active') {
          islandShow({
            mode: 'activity',
            title: activity.title,
            subtitle: activity.subtitle,
            icon: activity.icon,
            progress: activity.progress,
          });
        } else if (activity.state === 'ended' || activity.state === 'dismissed') {
          islandHide();
        }
        if (activity.progress !== undefined) {
          islandSetProgress(activity.progress);
        }
      }),
      realtimeService.on('device:update', () => {
        void queryClient.invalidateQueries({ queryKey: PHONE_OS_KEY });
      }),
    ];

    return () => unsubs.forEach((u) => u());
  }, [
    queryClient,
    setBattery,
    setPerformance,
    setControlCenter,
    setStatusBar,
    upsertLiveActivity,
    islandShow,
    islandHide,
    islandSetProgress,
  ]);
}

export function useLiveActivities() {
  return useQuery({
    queryKey: [...PHONE_OS_KEY, 'live-activities'],
    queryFn: () => phoneOsService.getLiveActivities(),
    staleTime: 10_000,
  });
}

export function useLiveActivitiesHydration() {
  const setLiveActivities = usePhoneOsStore((s) => s.setLiveActivities);
  const query = useLiveActivities();

  useEffect(() => {
    if (query.data) setLiveActivities(query.data);
  }, [query.data, setLiveActivities]);

  return query;
}

export function useGlobalSearch(query: string, enabled = true) {
  return useQuery({
    queryKey: [...PHONE_OS_KEY, 'search', query],
    queryFn: () => phoneOsService.globalSearch(query),
    enabled: enabled && query.trim().length > 0,
    staleTime: 5_000,
  });
}

export function useSetPerformanceMode() {
  const queryClient = useQueryClient();
  const setPerformance = usePhoneOsStore((s) => s.setPerformance);

  return useMutation({
    mutationFn: (mode: 'normal' | 'balanced' | 'performance' | 'power_saving' | 'ultra_power_saving') =>
      phoneOsService.setPerformanceMode(mode),
    onSuccess: (data) => {
      setPerformance(data);
      void queryClient.invalidateQueries({ queryKey: PHONE_OS_KEY });
    },
  });
}

export function useChargingControl() {
  const queryClient = useQueryClient();
  const setBattery = usePhoneOsStore((s) => s.setBattery);

  const start = useMutation({
    mutationFn: (type: 'wired' | 'fast' | 'wireless') => phoneOsService.startCharging(type),
    onSuccess: (data) => {
      setBattery(data);
      void queryClient.invalidateQueries({ queryKey: PHONE_OS_KEY });
    },
  });

  const stop = useMutation({
    mutationFn: () => phoneOsService.stopCharging(),
    onSuccess: (data) => {
      setBattery(data);
      void queryClient.invalidateQueries({ queryKey: PHONE_OS_KEY });
    },
  });

  return { start, stop };
}
