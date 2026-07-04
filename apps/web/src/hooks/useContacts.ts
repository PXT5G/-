'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { realtimeService } from '@/services/realtimeService';
import { contactsService } from '@/services/contactsService';

const CONTACTS_KEY = ['contacts'];

export function useContactsInit() {
  return useQuery({
    queryKey: [...CONTACTS_KEY, 'init'],
    queryFn: () => contactsService.initialize(),
    staleTime: 60_000,
  });
}

export function useContactsRealtime() {
  const queryClient = useQueryClient();
  useEffect(() => {
    const unsubs = ['contacts:updated', 'contacts:merged'].map((ev) =>
      realtimeService.on(ev as never, () => {
        void queryClient.invalidateQueries({ queryKey: CONTACTS_KEY });
      })
    );
    return () => unsubs.forEach((u) => u());
  }, [queryClient]);
}

export function useContactsList(params?: { category?: string; favorite?: boolean; search?: string }) {
  useContactsRealtime();
  return useQuery({
    queryKey: [...CONTACTS_KEY, 'list', params],
    queryFn: () => contactsService.list(params),
    staleTime: 15_000,
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Parameters<typeof contactsService.create>[0]) => contactsService.create(body),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: CONTACTS_KEY }),
  });
}
