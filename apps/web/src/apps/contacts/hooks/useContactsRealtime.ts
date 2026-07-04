'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { realtimeService } from '@/services/realtimeService';
import { useAuthStore } from '@/stores/authStore';
import type { SocketEvent } from '@/types';

const CONTACT_EVENTS: SocketEvent[] = [
  'contacts:created',
  'contacts:updated',
  'contacts:deleted',
  'contacts:imported',
  'contacts:exported',
  'contacts:favorite:changed',
  'contacts:blocked',
  'contacts:unblocked',
  'contacts:group:created',
  'contacts:notification',
];

export function useContactsRealtime() {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.getAccessToken());

  useEffect(() => {
    if (!token) return;
    const unsubs = CONTACT_EVENTS.map((event) =>
      realtimeService.on(event, () => {
        queryClient.invalidateQueries({ queryKey: ['contacts'] });
      })
    );
    return () => unsubs.forEach((u) => u());
  }, [token, queryClient]);
}
