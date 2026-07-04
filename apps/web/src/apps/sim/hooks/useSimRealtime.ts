'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { realtimeService } from '@/services/realtimeService';
import { useAuthStore } from '@/stores/authStore';

export function useSimRealtime() {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.getAccessToken());

  useEffect(() => {
    if (!token) return;

    const events = [
      'sim:activated',
      'sim:deactivated',
      'sim:suspended',
      'sim:replaced',
      'sim:number:changed',
      'sim:signal:updated',
    ] as const;

    const unsubs = events.map((event) =>
      realtimeService.on(event, () => {
        queryClient.invalidateQueries({ queryKey: ['sim'] });
      })
    );

    return () => unsubs.forEach((u) => u());
  }, [token, queryClient]);
}
