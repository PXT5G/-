'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { realtimeService } from '@/services/realtimeService';
import { useAuthStore } from '@/stores/authStore';
import { useControlStore } from '../store/controlStore';
import type { RecordedEvent } from '../types';

export function useControlRealtime() {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.getAccessToken());
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin');
  const pushEvent = useControlStore((s) => s.pushEvent);

  useEffect(() => {
    if (!token || !isAdmin) return;

    realtimeService.emit('control-panel:subscribe', {});

    const unsub = realtimeService.on('control:event', (payload) => {
      const event = payload.data as RecordedEvent;
      if (event?.id) pushEvent(event);
      queryClient.invalidateQueries({ queryKey: ['control-panel'] });
    });

    return () => unsub();
  }, [token, isAdmin, pushEvent, queryClient]);
}
