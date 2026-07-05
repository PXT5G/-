'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { realtimeService } from '@/services/realtimeService';
import { mailAppService } from '@/services/mailAppService';

const MAIL_KEY = ['mail'];

export function useMailInit() {
  return useQuery({
    queryKey: [...MAIL_KEY, 'init'],
    queryFn: () => mailAppService.initialize(),
    staleTime: 60_000,
  });
}

export function useMailRealtime() {
  const queryClient = useQueryClient();
  useEffect(() => {
    const unsubs = ['mail:new', 'mail:updated', 'mail:sync'].map((ev) =>
      realtimeService.on(ev as never, () => {
        void queryClient.invalidateQueries({ queryKey: MAIL_KEY });
      })
    );
    return () => unsubs.forEach((u) => u());
  }, [queryClient]);
}

export function useMailMessages(folder = 'inbox', search?: string) {
  useMailRealtime();
  return useQuery({
    queryKey: [...MAIL_KEY, 'messages', folder, search],
    queryFn: () => mailAppService.getMessages(folder, search),
    staleTime: 15_000,
  });
}

export function useSendMail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Parameters<typeof mailAppService.send>[0]) => mailAppService.send(body),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: MAIL_KEY }),
  });
}
