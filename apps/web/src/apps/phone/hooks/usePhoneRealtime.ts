'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { realtimeService } from '@/services/realtimeService';
import { useAuthStore } from '@/stores/authStore';
import { useDynamicIslandStore } from '@/stores/dynamicIslandStore';
import { phoneService } from '../services/phoneService';
import { usePhoneStore } from '../store/phoneStore';
import type { IncomingCallPayload } from '../types';

export function usePhoneRealtime() {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.getAccessToken());
  const setIncomingCall = usePhoneStore((s) => s.setIncomingCall);
  const setActiveCall = usePhoneStore((s) => s.setActiveCall);
  const setTab = usePhoneStore((s) => s.setTab);
  const islandShow = useDynamicIslandStore((s) => s.show);
  const islandHide = useDynamicIslandStore((s) => s.hide);

  useEffect(() => {
    if (!token) return;

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['phone'] });

    const syncActiveCall = async () => {
      invalidate();
      try {
        const active = await phoneService.getActiveCall();
        if (active) setActiveCall(active);
      } catch {
        // keep existing store state
      }
    };

    const handleRinging = (payload: { data: IncomingCallPayload }) => {
      const data = payload.data;
      invalidate();
      if (data.direction === 'incoming') {
        setIncomingCall(data);
        setTab('incoming');
        islandShow({
          mode: 'expanded',
          title: data.displayName,
          subtitle: data.isEmergency ? 'Emergency Call' : 'Incoming call',
          icon: data.isEmergency ? '🆘' : '📞',
        });
      } else {
        setActiveCall({
          id: data.callId,
          callId: data.callId,
          phoneNumber: data.phoneNumber ?? '',
          remoteNumber: data.remoteNumber,
          displayName: data.displayName,
          direction: 'outgoing',
          state: 'ringing',
          isEmergency: !!data.isEmergency,
          isMuted: false,
          isSpeaker: false,
          isOnHold: false,
          isConference: false,
          startedAt: new Date().toISOString(),
          avatar: data.avatar,
        });
        setTab('active');
        islandShow({
          mode: 'compact',
          title: data.displayName,
          subtitle: 'Calling...',
          icon: '📞',
        });
      }
    };

    const handleAccepted = async () => {
      invalidate();
      setIncomingCall(null);
      try {
        const active = await phoneService.getActiveCall();
        if (active) {
          setActiveCall(active);
          setTab('active');
        } else {
          const { activeCall } = usePhoneStore.getState();
          if (activeCall) {
            setActiveCall({ ...activeCall, state: 'active', connectedAt: new Date().toISOString() });
          }
        }
      } catch {
        const { activeCall } = usePhoneStore.getState();
        if (activeCall) {
          setActiveCall({ ...activeCall, state: 'active', connectedAt: new Date().toISOString() });
        }
      }
      islandShow({ mode: 'activity', title: 'On Call', subtitle: '00:00', icon: '📞' });
    };

    const handleEnded = () => {
      invalidate();
      setIncomingCall(null);
      setActiveCall(null);
      islandHide();
    };

    const events = [
      ['phone:ringing', handleRinging],
      ['phone:accepted', handleAccepted],
      ['phone:ended', handleEnded],
      ['phone:missed', handleEnded],
      ['phone:hold', syncActiveCall],
      ['phone:resume', syncActiveCall],
      ['phone:mute', syncActiveCall],
      ['phone:speaker', syncActiveCall],
      ['phone:voicemail', invalidate],
      ['sim:deactivated', invalidate],
      ['sim:suspended', invalidate],
    ] as const;

    const unsubs = events.map(([event, handler]) =>
      realtimeService.on(event, handler as (p: { data: unknown }) => void)
    );

    return () => unsubs.forEach((u) => u());
  }, [token, queryClient, setIncomingCall, setActiveCall, setTab, islandShow, islandHide]);
}
