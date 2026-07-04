'use client';

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { realtimeService } from '@/services/realtimeService';
import { communicationService } from '@/services/communicationService';
import { useCommunicationStore } from '@/stores/communicationStore';
import type { ConversationSnapshot, MessageSnapshot, PresenceSnapshot } from '@/types';

function useCommunicationSocketSync() {
  const queryClient = useQueryClient();
  const addMessage = useCommunicationStore((s) => s.addMessage);
  const setPresence = useCommunicationStore((s) => s.setPresence);
  const updateConversation = useCommunicationStore((s) => s.updateConversation);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.getAccessToken());

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const unsubs = [
      realtimeService.on('message:new', (p) => {
        const msg = p.data as MessageSnapshot;
        addMessage(msg.conversationId, msg);
        queryClient.invalidateQueries({ queryKey: ['communication', 'messages', msg.conversationId] });
        queryClient.invalidateQueries({ queryKey: ['communication', 'conversations'] });
      }),
      realtimeService.on('message:delivered', () => {
        queryClient.invalidateQueries({ queryKey: ['communication'] });
      }),
      realtimeService.on('message:read', () => {
        queryClient.invalidateQueries({ queryKey: ['communication', 'conversations'] });
      }),
      realtimeService.on('conversation:new', (p) => {
        const conv = p.data as ConversationSnapshot;
        updateConversation(conv);
        queryClient.invalidateQueries({ queryKey: ['communication', 'conversations'] });
      }),
      realtimeService.on('presence:update', (p) => {
        const presence = p.data as PresenceSnapshot;
        setPresence(presence.userId, presence);
      }),
      realtimeService.on('typing:update', (p) => {
        const data = p.data as { conversationId: string; userId: string; isTyping: boolean };
        queryClient.setQueryData(['communication', 'typing', data.conversationId], data);
      }),
      realtimeService.on('sync:complete', () => {
        queryClient.invalidateQueries({ queryKey: ['communication'] });
      }),
    ];

    return () => unsubs.forEach((u) => u());
  }, [isAuthenticated, token, queryClient, addMessage, setPresence, updateConversation]);
}

export function useCommunicationInit() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.getAccessToken());

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    communicationService.initialize().catch(console.error);
  }, [isAuthenticated, token]);
}

export function useConversations() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.getAccessToken());
  const setConversations = useCommunicationStore((s) => s.setConversations);
  useCommunicationSocketSync();

  return useQuery({
    queryKey: ['communication', 'conversations'],
    queryFn: async () => {
      const data = await communicationService.getConversations();
      setConversations(data);
      return data;
    },
    enabled: isAuthenticated && !!token,
    staleTime: 10_000,
  });
}

export function useMessages(conversationId: string | null) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.getAccessToken());
  useCommunicationSocketSync();

  return useQuery({
    queryKey: ['communication', 'messages', conversationId],
    queryFn: () => communicationService.getMessages(conversationId!),
    enabled: isAuthenticated && !!token && !!conversationId,
    staleTime: 5_000,
  });
}

export function useCommunicationPresence(userId?: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.getAccessToken());
  useCommunicationSocketSync();

  return useQuery({
    queryKey: ['communication', 'presence', userId],
    queryFn: () => communicationService.getPresence(userId),
    enabled: isAuthenticated && !!token,
    staleTime: 15_000,
  });
}

export function useCommunicationSearch(q: string, type?: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.getAccessToken());

  return useQuery({
    queryKey: ['communication', 'search', q, type],
    queryFn: () => communicationService.search(q, type),
    enabled: isAuthenticated && !!token && q.length >= 2,
    staleTime: 30_000,
  });
}

export { useCommunicationSocketSync };
