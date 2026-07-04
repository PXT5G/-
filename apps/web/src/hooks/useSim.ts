'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { realtimeService } from '@/services/realtimeService';
import { simAppService } from '@/services/simAppService';

const SIM_KEY = ['sim'];

export function useSimInit() {
  return useQuery({
    queryKey: [...SIM_KEY, 'init'],
    queryFn: () => simAppService.initialize(),
    staleTime: 60_000,
  });
}

export function useSimRealtime() {
  const queryClient = useQueryClient();
  useEffect(() => {
    const unsubs = ['sim:status', 'sim:updated'].map((ev) =>
      realtimeService.on(ev as never, () => {
        void queryClient.invalidateQueries({ queryKey: SIM_KEY });
      })
    );
    return () => unsubs.forEach((u) => u());
  }, [queryClient]);
}

export function useSimCards() {
  useSimRealtime();
  return useQuery({
    queryKey: [...SIM_KEY, 'cards'],
    queryFn: () => simAppService.list(),
    staleTime: 10_000,
    refetchInterval: 30_000,
  });
}

export function useUpdateSim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ simId, body }: { simId: string; body: Record<string, unknown> }) =>
      simAppService.update(simId, body),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: SIM_KEY }),
  });
}
