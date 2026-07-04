'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { phoneService } from '../services/phoneService';
import { usePhoneStore } from '../store/phoneStore';
import { CallerAvatar } from '../components/CallerAvatar';
import { CallTimer } from '../components/CallTimer';
import { CallWaveform } from '../components/CallWaveform';
import { useHaptic } from '@/hooks/useSound';
import { useDynamicIslandStore } from '@/stores/dynamicIslandStore';

export function ActiveCallScreen() {
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
    refetchInterval: 3000,
  });

  const call = storeCall ?? active;
  if (!call) {
    return <div className="flex items-center justify-center h-full text-white/40 text-sm">No active call</div>;
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
  };

  const toggleSpeaker = async () => {
    tap();
    const next = !speaker;
    setSpeaker(next);
    await phoneService.speakerCall(call.callId, next);
  };

  const toggleHold = async () => {
    tap();
    if (onHold) {
      await phoneService.resumeCall(call.callId);
      setOnHold(false);
    } else {
      await phoneService.holdCall(call.callId);
      setOnHold(true);
    }
  };

  const isConnected = call.state === 'active' || call.state === 'conference';

  return (
    <div className="flex flex-col h-full items-center justify-between py-10 px-6 bg-gradient-to-b from-black via-green-950/30 to-black">
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

      <div className="grid grid-cols-3 gap-6 w-full max-w-xs">
        {[
          { icon: muted ? '🔇' : '🎤', label: 'Mute', onClick: toggleMute, active: muted },
          { icon: onHold ? '▶️' : '⏸️', label: onHold ? 'Resume' : 'Hold', onClick: toggleHold, active: onHold },
          { icon: speaker ? '🔊' : '🔈', label: 'Speaker', onClick: toggleSpeaker, active: speaker },
        ].map((btn) => (
          <button
            key={btn.label}
            type="button"
            onClick={btn.onClick}
            className={`flex flex-col items-center gap-1 ${btn.active ? 'text-green-400' : 'text-white/60'}`}
          >
            <span className={`w-14 h-14 rounded-full flex items-center justify-center text-xl ${btn.active ? 'bg-green-400/20 border border-green-400/40' : 'bg-white/5 border border-white/10'}`}>
              {btn.icon}
            </span>
            <span className="text-[10px]">{btn.label}</span>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={endCall}
        className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center text-2xl shadow-lg shadow-red-500/40"
      >
        📵
      </button>
    </div>
  );
}
