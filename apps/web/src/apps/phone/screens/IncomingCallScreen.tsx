'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { phoneService } from '../services/phoneService';
import { usePhoneStore } from '../store/phoneStore';
import { GlassCard } from '../components/GlassCard';
import { CallerAvatar } from '../components/CallerAvatar';
import { SwipeToAnswer } from '../components/SwipeToAnswer';
import { useHaptic } from '@/hooks/useSound';

export function IncomingCallScreen() {
  const incomingCall = usePhoneStore((s) => s.incomingCall);
  const setIncomingCall = usePhoneStore((s) => s.setIncomingCall);
  const setActiveCall = usePhoneStore((s) => s.setActiveCall);
  const setTab = usePhoneStore((s) => s.setTab);
  const { tap, success, error: hapticError } = useHaptic();
  const queryClient = useQueryClient();

  const { data: active } = useQuery({
    queryKey: ['phone', 'active'],
    queryFn: () => phoneService.getActiveCall(),
    enabled: !!incomingCall,
  });

  const call = incomingCall ?? (active?.direction === 'incoming' ? {
    callId: active.callId,
    remoteNumber: active.remoteNumber,
    displayName: active.displayName,
    direction: 'incoming' as const,
    isEmergency: active.isEmergency,
    avatar: active.avatar,
  } : null);

  if (!call) {
    return <div className="flex items-center justify-center h-full text-white/40 text-sm">No incoming calls</div>;
  }

  const handleAnswer = async () => {
    tap();
    try {
      await phoneService.acceptCall(call.callId);
      setIncomingCall(null);
      setActiveCall(active ?? {
        id: call.callId,
        callId: call.callId,
        phoneNumber: '',
        remoteNumber: call.remoteNumber,
        displayName: call.displayName,
        direction: 'incoming',
        state: 'active',
        isEmergency: !!call.isEmergency,
        isMuted: false,
        isSpeaker: false,
        isOnHold: false,
        isConference: false,
        startedAt: new Date().toISOString(),
        avatar: call.avatar,
      });
      setTab('active');
      queryClient.invalidateQueries({ queryKey: ['phone'] });
      success();
    } catch {
      hapticError();
    }
  };

  const handleReject = async () => {
    tap();
    try {
      await phoneService.rejectCall(call.callId);
      setIncomingCall(null);
      setTab('dashboard');
      queryClient.invalidateQueries({ queryKey: ['phone'] });
      hapticError();
    } catch {
      hapticError();
    }
  };

  return (
    <div className="flex flex-col h-full items-center justify-between py-12 px-6 bg-gradient-to-b from-black via-green-950/20 to-black">
      <div className="text-center space-y-4">
        <p className="text-white/40 text-sm">{call.isEmergency ? 'Emergency Incoming' : 'Incoming Call'}</p>
        <CallerAvatar name={call.displayName} avatar={call.avatar} emergency={call.isEmergency} />
        <div>
          <h2 className="text-white text-2xl font-semibold">{call.displayName}</h2>
          <p className="text-white/50 text-sm mt-1">{call.remoteNumber}</p>
        </div>
      </div>

      <GlassCard className="w-full">
        <SwipeToAnswer onAnswer={handleAnswer} onReject={handleReject} />
        <p className="text-center text-white/30 text-[10px] mt-3">Swipe right to answer • left to decline</p>
      </GlassCard>

      <div className="flex gap-6">
        <button type="button" onClick={handleReject} aria-label="Decline call" className="w-14 h-14 rounded-full bg-red-500 flex items-center justify-center text-xl">
          ✕
        </button>
        <button type="button" onClick={handleAnswer} aria-label="Accept call" className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center text-xl">
          📞
        </button>
      </div>
    </div>
  );
}
