'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { realtimeService } from '@/services/realtimeService';
import { useAuthStore } from '@/stores/authStore';
import { usePoliceStore } from '../store/policeStore';

export function usePoliceRealtime() {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.getAccessToken());
  const pushAlert = usePoliceStore((s) => s.pushAlert);

  useEffect(() => {
    if (!token) return;

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['police'] });

    const events = [
      'police:dispatch:created',
      'police:dispatch:assigned',
      'police:dispatch:updated',
      'police:report:created',
      'police:report:reviewed',
      'police:case:created',
      'police:chat:message',
      'police:officer:status',
      'police:rank:changed',
      'police:officer:provisioned',
    ] as const;

    const unsubs = events.map((event) =>
      realtimeService.on(event, (payload) => {
        invalidate();
        if (event.startsWith('police:dispatch')) {
          pushAlert({
            id: `${event}-${Date.now()}`,
            title: 'Dispatch Update',
            body: typeof payload.data === 'object' && payload.data ? JSON.stringify(payload.data) : 'New dispatch activity',
            priority: 'high',
          });
        }
      })
    );

    const notifUnsub = realtimeService.on('police:notification', (payload) => {
      const data = payload.data as { title?: string; body?: string; priority?: 'low' | 'normal' | 'high' | 'critical' };
      pushAlert({
        id: `notif-${Date.now()}`,
        title: data.title ?? 'Police Alert',
        body: data.body ?? '',
        priority: data.priority ?? 'normal',
      });
      invalidate();
    });

    return () => {
      unsubs.forEach((u) => u());
      notifUnsub();
    };
  }, [token, queryClient, pushAlert]);
}
