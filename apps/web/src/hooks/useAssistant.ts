'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { realtimeService } from '@/services/realtimeService';
import { assistantService } from '@/services/assistantAppService';

export function useAssistantInit() {
  const token = useAuthStore((s) => s.getAccessToken());
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  useEffect(() => {
    if (!isAuthenticated || !token) return;
    assistantService.initialize(token).catch(() => {});
  }, [isAuthenticated, token]);
}

export function useAssistantSocketSync() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  useEffect(() => {
    if (!isAuthenticated) return;
    const events = ['assistant:conversation', 'assistant:thinking', 'assistant:completed', 'assistant:action'];
    const unsubs = events.map((ev) => realtimeService.on(ev as never, () => queryClient.invalidateQueries({ queryKey: ['assistant'] })));
    return () => unsubs.forEach((u) => u());
  }, [isAuthenticated, queryClient]);
}

export function useAssistantConversations() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['assistant', 'conversations'],
    queryFn: () => assistantService.getConversations(token!),
    enabled: !!token,
  });
}

export function useAssistantMessages(conversationId: string | null) {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['assistant', 'messages', conversationId],
    queryFn: () => assistantService.getMessages(token!, conversationId!),
    enabled: !!token && !!conversationId,
  });
}

export function useSendAssistantMessage(conversationId: string | null) {
  const token = useAuthStore((s) => s.getAccessToken());
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => assistantService.sendMessage(token!, conversationId!, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assistant'] });
    },
  });
}

export function useCreateConversation() {
  const token = useAuthStore((s) => s.getAccessToken());
  const queryClient = useQueryClient();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: () => assistantService.createConversation(token!),
    onSuccess: (data) => {
      setConversationId(data.conversationId);
      queryClient.invalidateQueries({ queryKey: ['assistant'] });
    },
  });
  return { ...mutation, conversationId, setConversationId };
}
