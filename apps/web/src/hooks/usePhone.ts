'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { phoneAppService } from '@/services/phoneAppService';
import { realtimeService } from '@/services/realtimeService';
import { usePhoneStore } from '@/stores/phoneStore';

const PHONE_KEY = ['phone'];

export function usePhoneInit() {
  const setActiveCall = usePhoneStore((s) => s.setActiveCall);
  const query = useQuery({
    queryKey: [...PHONE_KEY, 'init'],
    queryFn: () => phoneAppService.initialize(),
    staleTime: 60_000,
  });
  useEffect(() => {
    if (query.isSuccess) setActiveCall(null);
  }, [query.isSuccess, setActiveCall]);
  return query;
}

export function usePhoneRealtime() {
  const queryClient = useQueryClient();
  const setActiveCall = usePhoneStore((s) => s.setActiveCall);
  const setIncomingCall = usePhoneStore((s) => s.setIncomingCall);

  useEffect(() => {
    const unsubs = [
      realtimeService.on('phone:incoming', (payload) => {
        const data = payload.data as { call: Record<string, unknown> };
        setIncomingCall(data.call);
        void queryClient.invalidateQueries({ queryKey: PHONE_KEY });
      }),
      realtimeService.on('phone:connected', (payload) => {
        const data = payload.data as { call: Record<string, unknown> };
        setActiveCall(data.call);
        setIncomingCall(null);
      }),
      realtimeService.on('phone:ended', () => {
        setActiveCall(null);
        setIncomingCall(null);
        void queryClient.invalidateQueries({ queryKey: PHONE_KEY });
      }),
      realtimeService.on('phone:status', () => {
        void queryClient.invalidateQueries({ queryKey: PHONE_KEY });
      }),
    ];
    return () => unsubs.forEach((u) => u());
  }, [queryClient, setActiveCall, setIncomingCall]);
}

export function usePhoneCalls(params?: { status?: string; search?: string }) {
  return useQuery({
    queryKey: [...PHONE_KEY, 'calls', params],
    queryFn: () => phoneAppService.getCalls(params),
    staleTime: 10_000,
  });
}

export function usePhoneFavorites() {
  return useQuery({
    queryKey: [...PHONE_KEY, 'favorites'],
    queryFn: () => phoneAppService.getFavorites(),
    staleTime: 30_000,
  });
}

export function usePhoneVoicemail() {
  return useQuery({
    queryKey: [...PHONE_KEY, 'voicemail'],
    queryFn: () => phoneAppService.getVoicemail(),
    staleTime: 30_000,
  });
}

export function useInitiateCall() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { toNumber: string; contactId?: string; contactName?: string }) =>
      phoneAppService.initiateCall(body),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: PHONE_KEY }),
  });
}

export function useAnswerCall() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (callId: string) => phoneAppService.answerCall(callId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: PHONE_KEY }),
  });
}

export function useEndCall() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ callId, status }: { callId: string; status?: string }) =>
      phoneAppService.endCall(callId, status),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: PHONE_KEY }),
  });
}
