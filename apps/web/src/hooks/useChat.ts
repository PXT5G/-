'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { realtimeService } from '@/services/realtimeService';
import { chatService } from '@/services/chatService';

export function useChatInit() {
  const token = useAuthStore((s) => s.getAccessToken());
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: ['chat', 'init'],
    queryFn: () => chatService.initialize(token!),
    enabled: Boolean(isAuthenticated && token),
    staleTime: 60_000,
  });
}

export function useChatSocketSync() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.getAccessToken());

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    const commEvents = [
      'message:new', 'message:read', 'message:edited', 'message:deleted',
      'conversation:new', 'typing:update', 'presence:update', 'reaction:update',
    ];
    const chatEvents = [
      'chat:initialized', 'chat:conversation:update', 'chat:message:request',
      'chat:call:ringing', 'chat:call:update', 'chat:call:ended', 'chat:poll:update',
    ];
    const unsubs = [...commEvents, ...chatEvents].map((ev) =>
      realtimeService.on(ev as never, () => {
        queryClient.invalidateQueries({ queryKey: ['chat'] });
      })
    );
    return () => unsubs.forEach((u) => u());
  }, [isAuthenticated, token, queryClient]);
}

export function useChatInbox(filter?: Record<string, string>) {
  const token = useAuthStore((s) => s.getAccessToken());
  useChatSocketSync();
  return useQuery({
    queryKey: ['chat', 'inbox', filter],
    queryFn: () => chatService.getInbox(token!, filter),
    enabled: Boolean(token),
    refetchInterval: 15_000,
  });
}

export function useChatMessages(conversationId: string | null) {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['chat', 'messages', conversationId],
    queryFn: () => chatService.getMessages(token!, conversationId!),
    enabled: Boolean(token && conversationId),
    refetchInterval: 5_000,
  });
}

export function useChatConversation(conversationId: string | null) {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['chat', 'conversation', conversationId],
    queryFn: () => chatService.getConversation(token!, conversationId!),
    enabled: Boolean(token && conversationId),
  });
}

export function useChatSearch(query: string) {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['chat', 'search', query],
    queryFn: () => chatService.search(token!, query),
    enabled: Boolean(token && query.length > 1),
  });
}

export function useChatMessageRequests() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['chat', 'message-requests'],
    queryFn: () => chatService.getMessageRequests(token!),
    enabled: Boolean(token),
  });
}

export function useChatCallHistory() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useQuery({
    queryKey: ['chat', 'calls'],
    queryFn: () => chatService.getCallHistory(token!),
    enabled: Boolean(token),
  });
}

export function useSendMessage() {
  const token = useAuthStore((s) => s.getAccessToken());
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Parameters<typeof chatService.sendMessage>[1]) => chatService.sendMessage(token!, body),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'messages', vars.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['chat', 'inbox'] });
    },
  });
}

export function useUpdateChatMeta() {
  const token = useAuthStore((s) => s.getAccessToken());
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, ...body }: { conversationId: string } & Record<string, unknown>) =>
      chatService.updateMeta(token!, conversationId, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chat'] }),
  });
}

export function useStartCall() {
  const token = useAuthStore((s) => s.getAccessToken());
  return useMutation({
    mutationFn: (body: { conversationId: string; callType: string }) => chatService.startCall(token!, body),
  });
}

export function useRespondMessageRequest() {
  const token = useAuthStore((s) => s.getAccessToken());
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, action }: { requestId: string; action: 'accept' | 'decline' | 'block' }) =>
      chatService.respondMessageRequest(token!, requestId, action),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chat'] }),
  });
}
