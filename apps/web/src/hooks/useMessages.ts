'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { realtimeService } from '@/services/realtimeService';
import { messagesAppService } from '@/services/messagesAppService';

const MESSAGES_KEY = ['messages-app'];

export function useMessagesInit() {
  return useQuery({
    queryKey: [...MESSAGES_KEY, 'init'],
    queryFn: () => messagesAppService.initialize(),
    staleTime: 60_000,
  });
}

export function useMessagesRealtime() {
  const queryClient = useQueryClient();
  useEffect(() => {
    const unsubs = ['messages:new', 'messages:updated', 'messages:typing'].map((ev) =>
      realtimeService.on(ev as never, () => {
        void queryClient.invalidateQueries({ queryKey: MESSAGES_KEY });
      })
    );
    return () => unsubs.forEach((u) => u());
  }, [queryClient]);
}

export function useMessagesConversations() {
  useMessagesRealtime();
  return useQuery({
    queryKey: [...MESSAGES_KEY, 'conversations'],
    queryFn: () => messagesAppService.getConversations(),
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
}

export function useSmsMessages(conversationId: string | null) {
  return useQuery({
    queryKey: [...MESSAGES_KEY, 'thread', conversationId],
    queryFn: () => messagesAppService.getMessages(conversationId!),
    enabled: !!conversationId,
    staleTime: 5_000,
  });
}

export function useSendSms() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { toUserId?: string; phoneNumber?: string; body: string }) =>
      messagesAppService.send(body),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: MESSAGES_KEY }),
  });
}
