'use client';

import { useEffect, useState, memo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { phoneService } from '../services/phoneService';
import { usePhoneStore } from '../store/phoneStore';
import { CallerAvatar } from '../components/CallerAvatar';
import { CallTimer } from '../components/CallTimer';
import { CallWaveform } from '../components/CallWaveform';
import { useHaptic } from '@/hooks/useSound';
import { useDynamicIslandStore } from '@/stores/dynamicIslandStore';
import { EndCallIcon } from '@/components/shared/PhoneIcons';

export const ActiveCallScreen = memo(function ActiveCallScreen() {
  const storeCall = usePhoneStore((s) => s.activeCall);
  const setActiveCall = usePhoneStore((s) => s.setActiveCall);
  const setTab = usePhoneStore((s) => s.setTab);
  const { tap } = useHaptic();
  const queryClient = useQueryClient();
  const islandHide = useDynamicIslandStore((s) => s.hide);
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(false);
  const [onHold, setOnHold] = useState(false);

  const { data: active } = useQuery({
    queryKey: ['phone', 'active'],
    queryFn: () => phoneService.getActiveCall(),
    enabled: !storeCall,
    staleTime: Infinity,
  });

  const call = storeCall ?? active;
  const callId = call?.callId;
  const callMuted = call?.isMuted ?? false;
  const callSpeaker = call?.isSpeaker ?? false;
  const callOnHold = call?.isOnHold ?? false;

  useEffect(() => {
    setMuted(callMuted);
    setSpeaker(callSpeaker);
    setOnHold(callOnHold);
  }, [callId, callMuted, callSpeaker, callOnHold]);

  if (!call) {
    return <div className="flex items-center justify-center h-full text-white/40 text-sm" role="status">No active call</div>;
  }

  const endCall = async () => {
    tap();
    await phoneService.endCall(call.callId);
    setActiveCall(null);
    setTab('dashboard');
    islandHide();
    queryClient.invalidateQueries({ queryKey: ['phone'] });
  };

  const toggleMute = async () => {
    tap();
    const next = !muted;
    setMuted(next);
    await phoneService.muteCall(call.callId, next);
    setActiveCall({ ...call, isMuted: next });
  };

  const toggleSpeaker = async () => {
    tap();
    const next = !speaker;
    setSpeaker(next);
    await phoneService.speakerCall(call.callId, next);
    setActiveCall({ ...call, isSpeaker: next });
  };

  const toggleHold = async () => {
    tap();
    if (onHold) {
      await phoneService.resumeCall(call.callId);
      setOnHold(false);
      setActiveCall({ ...call, isOnHold: false, state: 'active' });
    } else {
      await phoneService.holdCall(call.callId);
      setOnHold(true);
      setActiveCall({ ...call, isOnHold: true, state: 'on_hold' });
    }
  };

  const isConnected = call.state === 'active' || call.state === 'conference';

  const controls = [
    { icon: muted ? '🔇' : '🎤', label: 'Mute', onClick: toggleMute, active: muted },
    { icon: onHold ? '▶️' : '⏸️', label: onHold ? 'Resume' : 'Hold', onClick: toggleHold, active: onHold },
    { icon: speaker ? '🔊' : '🔈', label: 'Speaker', onClick: toggleSpeaker, active: speaker },
  ];

  return (
    <div className="flex flex-col h-full items-center justify-between py-10 px-6 bg-gradient-to-b from-black via-banana-gold/10 to-black">
      <div className="text-center space-y-3">
        <p className="text-white/40 text-sm">
          {call.isEmergency ? 'Emergency' : onHold ? 'On Hold' : call.state === 'ringing' ? 'Calling...' : 'Connected'}
        </p>
        <CallerAvatar name={call.displayName} avatar={call.avatar} emergency={call.isEmergency} />
        <h2 className="text-white text-2xl font-semibold">{call.displayName}</h2>
        <p className="text-white/50 text-sm">{call.remoteNumber}</p>
        {isConnected && <CallTimer startedAt={call.startedAt} connectedAt={call.connectedAt} />}
      </div>

      {isConnected && <CallWaveform active={!onHold} />}

      <div className="grid grid-cols-3 gap-6 w-full max-w-xs" role="group" aria-label="Call controls">
        {controls.map((btn) => (
          <button
            key={btn.label}
            type="button"
            onClick={btn.onClick}
            aria-label={btn.label}
            aria-pressed={btn.active}
            className={`flex flex-col items-center gap-1 min-w-[56px] min-h-[56px] ${btn.active ? 'text-banana-gold' : 'text-white/60'}`}
          >
            <span className={`w-14 h-14 rounded-full flex items-center justify-center text-xl ${btn.active ? 'bg-banana-gold/20 border border-banana-gold/40' : 'bg-white/5 border border-white/10'}`}>
              <span aria-hidden="true">{btn.icon}</span>
            </span>
            <span className="text-[10px]">{btn.label}</span>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={endCall}
        aria-label="End call"
        className="w-16 h-16 min-w-[44px] min-h-[44px] rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/40 text-white"
      >
        <EndCallIcon className="w-7 h-7" />
      </button>
    </div>
  );
});
