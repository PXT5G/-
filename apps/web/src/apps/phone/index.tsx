'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  usePhoneInit, usePhoneCalls, usePhoneFavorites, usePhoneVoicemail,
  useInitiateCall, useAnswerCall, useEndCall, usePhoneRealtime,
} from '@/hooks/usePhone';
import { usePhoneStore } from '@/stores/phoneStore';
import { useContactsList } from '@/hooks/useContacts';
import { useHaptic } from '@/hooks/useSound';
import { cn } from '@/utils/cn';

type Tab = 'favorites' | 'recents' | 'contacts' | 'keypad' | 'voicemail';

export function PhoneApp() {
  const [tab, setTab] = useState<Tab>('recents');
  const [dialNumber, setDialNumber] = useState('');
  const { tap } = useHaptic();
  usePhoneInit();
  usePhoneRealtime();
  const { data: callsData } = usePhoneCalls();
  const { data: favorites } = usePhoneFavorites();
  const { data: voicemail } = usePhoneVoicemail();
  const { data: contactsData } = useContactsList();
  const initiateCall = useInitiateCall();
  const answerCall = useAnswerCall();
  const endCall = useEndCall();
  const incomingCall = usePhoneStore((s) => s.incomingCall);
  const activeCall = usePhoneStore((s) => s.activeCall);

  const dial = (digit: string) => {
    tap();
    setDialNumber((n) => n + digit);
  };

  const call = (number: string, name?: string) => {
    tap();
    void initiateCall.mutateAsync({ toNumber: number, contactName: name });
  };

  return (
    <div className="h-full flex flex-col bg-black text-white">
      {incomingCall && (
        <motion.div
          className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p className="text-2xl font-light mb-2">{String(incomingCall.contactName ?? incomingCall.fromNumber)}</p>
          <p className="text-white/50 mb-8">Incoming call</p>
          <div className="flex gap-8">
            <button
              onClick={() => void endCall.mutateAsync({ callId: String(incomingCall.callId), status: 'rejected' })}
              className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center text-2xl"
            >✕</button>
            <button
              onClick={() => void answerCall.mutateAsync(String(incomingCall.callId))}
              className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center text-2xl"
            >📞</button>
          </div>
        </motion.div>
      )}

      {activeCall && (
        <div className="p-4 bg-green-900/30 border-b border-green-500/30 flex items-center justify-between">
          <div>
            <p className="font-medium">{String(activeCall.contactName ?? activeCall.toNumber)}</p>
            <p className="text-xs text-white/50">On call</p>
          </div>
          <button
            onClick={() => void endCall.mutateAsync({ callId: String(activeCall.callId) })}
            className="px-4 py-2 bg-red-500 rounded-full text-sm"
          >End</button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        {tab === 'recents' && (
          <div className="space-y-2">
            {(callsData?.calls ?? []).map((c) => (
              <button
                key={c.callId}
                onClick={() => call(c.direction === 'outgoing' ? c.toNumber : c.fromNumber, c.contactName)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10"
              >
                <span>{c.direction === 'incoming' ? '↓' : '↑'}</span>
                <div className="flex-1 text-left">
                  <p className="font-medium">{c.contactName ?? c.toNumber}</p>
                  <p className="text-xs text-white/50 capitalize">{c.status}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {tab === 'favorites' && (
          <div className="space-y-2">
            {(favorites ?? []).map((f) => (
              <button key={f.favoriteId} onClick={() => call(f.number, f.label)} className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5">
                <span className="text-gulf-gold">⭐</span>
                <div className="text-left"><p>{f.label}</p><p className="text-xs text-white/50">{f.number}</p></div>
              </button>
            ))}
          </div>
        )}

        {tab === 'contacts' && (
          <div className="space-y-2">
            {(contactsData?.contacts ?? []).map((c) => (
              <button
                key={c.contactId}
                onClick={() => c.phones[0] && call(c.phones[0].number, c.displayName)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5"
              >
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">{c.displayName[0]}</div>
                <div className="text-left"><p>{c.displayName}</p><p className="text-xs text-white/50">{c.phones[0]?.number}</p></div>
              </button>
            ))}
          </div>
        )}

        {tab === 'keypad' && (
          <div className="flex flex-col items-center">
            <p className="text-3xl font-light mb-6 tabular-nums min-h-[40px]">{dialNumber || ' '}</p>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {['1','2','3','4','5','6','7','8','9','*','0','#'].map((d) => (
                <button key={d} onClick={() => dial(d)} className="w-16 h-16 rounded-full bg-white/10 text-xl font-light">{d}</button>
              ))}
            </div>
            <button
              onClick={() => dialNumber && call(dialNumber)}
              disabled={!dialNumber}
              className="w-16 h-16 rounded-full bg-green-500 text-2xl disabled:opacity-30"
            >📞</button>
          </div>
        )}

        {tab === 'voicemail' && (
          <div className="space-y-2">
            {(voicemail ?? []).map((v) => (
              <div key={String(v.voicemailId)} className="p-3 rounded-xl bg-white/5">
                <p className="font-medium">{String(v.contactName ?? v.fromNumber)}</p>
                <p className="text-xs text-white/50">{String(v.durationSeconds)}s</p>
              </div>
            ))}
            {(voicemail ?? []).length === 0 && <p className="text-center text-white/40 py-8">No voicemail</p>}
          </div>
        )}
      </div>

      <div className="flex border-t border-white/10">
        {(['favorites', 'recents', 'contacts', 'keypad', 'voicemail'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => { tap(); setTab(t); }}
            className={cn('flex-1 py-3 text-[10px] capitalize', tab === t ? 'text-gulf-gold' : 'text-white/50')}
          >{t}</button>
        ))}
      </div>
    </div>
  );
}

export default PhoneApp;
