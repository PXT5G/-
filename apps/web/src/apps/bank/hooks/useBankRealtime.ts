'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { realtimeService } from '@/services/realtimeService';
import { useAuthStore } from '@/stores/authStore';

export function useBankRealtime() {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.getAccessToken());

  useEffect(() => {
    if (!token) return;

    const unsubBalance = realtimeService.on('bank:balance:updated', () => {
      queryClient.invalidateQueries({ queryKey: ['bank'] });
    });

    const unsubTransfer = realtimeService.on('bank:transfer:complete', () => {
      queryClient.invalidateQueries({ queryKey: ['bank'] });
    });

    const unsubProvision = realtimeService.on('bank:accounts:provisioned', () => {
      queryClient.invalidateQueries({ queryKey: ['bank'] });
    });

    return () => {
      unsubBalance();
      unsubTransfer();
      unsubProvision();
    };
  }, [token, queryClient]);
}
