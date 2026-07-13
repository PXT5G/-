'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { apiRequest } from '@/utils/api';

export interface RealGeo {
  source: 'gps' | 'ip' | 'fallback';
  latitude: number;
  longitude: number;
  city: string;
  region: string;
  country: string;
  timezone: string;
  weather: {
    tempC: number;
    feelsLikeC: number;
    humidity: number;
    windKmh: number;
    condition: string;
    label: string;
    icon: string;
  } | null;
  updatedAt: string;
}

let cachedCoords: { lat: number; lon: number } | null | undefined;

/** Ask the browser for GPS once, silently; resolves null when unavailable/denied. */
function getBrowserCoords(): Promise<{ lat: number; lon: number } | null> {
  if (cachedCoords !== undefined) return Promise.resolve(cachedCoords);
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      cachedCoords = null;
      resolve(null);
      return;
    }
    const done = (v: { lat: number; lon: number } | null) => {
      cachedCoords = v;
      resolve(v);
    };
    const timer = setTimeout(() => done(null), 5000);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timer);
        done({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      },
      () => {
        clearTimeout(timer);
        done(null);
      },
      { enableHighAccuracy: false, timeout: 4500, maximumAge: 600_000 },
    );
  });
}

/**
 * Physical device location + live weather.
 * Browser GPS when granted, otherwise server-side IP geolocation;
 * live conditions from Open-Meteo (proxied through the GULFOS API).
 */
export function useRealGeo() {
  const token = useAuthStore((s) => s.getAccessToken());
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null | undefined>(cachedCoords);

  useEffect(() => {
    if (coords === undefined) {
      void getBrowserCoords().then(setCoords);
    }
  }, [coords]);

  return useQuery({
    queryKey: ['system', 'real-geo', coords?.lat ?? 'ip', coords?.lon ?? 'ip'],
    queryFn: async (): Promise<RealGeo> => {
      const params = coords ? `?lat=${coords.lat}&lon=${coords.lon}` : '';
      const res = await apiRequest<{ success: boolean; data: RealGeo }>(
        `/api/system/geo${params}`,
        token ? { token } : {},
      );
      return res.data;
    },
    enabled: coords !== undefined,
    staleTime: 10 * 60 * 1000,
    refetchInterval: 15 * 60 * 1000,
    retry: 1,
  });
}
