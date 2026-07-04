'use client';

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { realtimeService } from '@/services/realtimeService';
import { worldService } from '@/services/worldService';
import { useWorldStore } from '@/stores/worldStore';
import type {
  WorldStateSnapshot,
  CellTowerSnapshot,
  SignalSnapshot,
  GpsStateSnapshot,
  VpnStateSnapshot,
  CarrierStateSnapshot,
  NetworkStateSnapshot,
} from '@/types';
import { useSystemSocketInvalidation } from './useSystemServices';

function useWorldSocketSync() {
  const queryClient = useQueryClient();
  const setWorld = useWorldStore((s) => s.setWorld);
  const setTower = useWorldStore((s) => s.setTower);
  const setSignal = useWorldStore((s) => s.setSignal);
  const setGps = useWorldStore((s) => s.setGps);
  const setVpn = useWorldStore((s) => s.setVpn);
  const setCarrier = useWorldStore((s) => s.setCarrier);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.getAccessToken());

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const unsubs = [
      realtimeService.on('world:update', (p) => {
        setWorld(p.data as WorldStateSnapshot);
        queryClient.setQueryData(['world', 'state'], p.data);
      }),
      realtimeService.on('tower:update', (p) => {
        setTower(p.data as CellTowerSnapshot);
        queryClient.setQueryData(['world', 'tower'], p.data);
      }),
      realtimeService.on('signal:update', (p) => {
        setSignal(p.data as SignalSnapshot);
        queryClient.setQueryData(['world', 'signal'], p.data);
      }),
      realtimeService.on('gps:update', (p) => {
        setGps(p.data as GpsStateSnapshot);
        queryClient.setQueryData(['world', 'gps'], p.data);
      }),
      realtimeService.on('vpn:update', (p) => {
        setVpn(p.data as VpnStateSnapshot);
        queryClient.setQueryData(['world', 'vpn'], p.data);
      }),
      realtimeService.on('carrier:update', (p) => {
        setCarrier(p.data as CarrierStateSnapshot);
        queryClient.setQueryData(['world', 'carrier'], p.data);
      }),
      realtimeService.on('network:update', (p) => {
        queryClient.setQueryData(['world', 'network'], p.data);
        queryClient.setQueryData(['system', 'network'], p.data);
      }),
      realtimeService.on('location:update', (p) => {
        queryClient.setQueryData(['system', 'location'], p.data);
      }),
    ];

    return () => unsubs.forEach((u) => u());
  }, [isAuthenticated, token, queryClient, setWorld, setTower, setSignal, setGps, setVpn, setCarrier]);
}

export function useWorld() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.getAccessToken());
  useWorldSocketSync();
  useSystemSocketInvalidation();

  return useQuery({
    queryKey: ['world', 'state'],
    queryFn: () => worldService.getWorldState(),
    enabled: isAuthenticated && !!token,
    staleTime: 10_000,
  });
}

export function useGps() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.getAccessToken());
  useWorldSocketSync();

  return useQuery({
    queryKey: ['world', 'gps'],
    queryFn: () => worldService.getGps(),
    enabled: isAuthenticated && !!token,
    staleTime: 10_000,
  });
}

export function useCarrier() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.getAccessToken());
  useWorldSocketSync();

  return useQuery({
    queryKey: ['world', 'carrier'],
    queryFn: () => worldService.getCarrier(),
    enabled: isAuthenticated && !!token,
    staleTime: 10_000,
  });
}

export function useVpn() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.getAccessToken());
  useWorldSocketSync();

  return useQuery({
    queryKey: ['world', 'vpn'],
    queryFn: () => worldService.getVpn(),
    enabled: isAuthenticated && !!token,
    staleTime: 15_000,
  });
}

export function useTowers() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.getAccessToken());
  useWorldSocketSync();

  return useQuery({
    queryKey: ['world', 'towers'],
    queryFn: () => worldService.getNearbyTowers(),
    enabled: isAuthenticated && !!token,
    staleTime: 30_000,
  });
}

export function useWorldNetwork() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.getAccessToken());
  useWorldSocketSync();

  return useQuery({
    queryKey: ['world', 'network'],
    queryFn: () => worldService.getNetwork() as Promise<NetworkStateSnapshot>,
    enabled: isAuthenticated && !!token,
    staleTime: 10_000,
  });
}

export function useSignal() {
  const signal = useWorldStore((s) => s.signal);
  const { data: network } = useWorldNetwork();
  return {
    signalBars: signal?.signalBars ?? network?.signalBars ?? network?.signalStrength ?? 0,
    generation: signal?.generation ?? (network?.generation as SignalSnapshot['generation']) ?? 'none',
    carrier: signal?.carrier ?? network?.carrier ?? 'GULF Mobile',
    signalDbm: signal?.signalDbm ?? network?.signalDbm,
  };
}

export { useWorldSocketSync };
