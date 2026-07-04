'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { phoneService } from '../services/phoneService';
import { GlassCard } from '../components/GlassCard';
import type { PhoneSettings } from '../types';
import { useHaptic } from '@/hooks/useSound';

const TOGGLES: { key: keyof PhoneSettings; label: string; desc: string }[] = [
  { key: 'callerIdEnabled', label: 'Caller ID', desc: 'Show your number to recipients' },
  { key: 'showMyNumber', label: 'Show My Number', desc: 'Display number on outgoing calls' },
  { key: 'callWaiting', label: 'Call Waiting', desc: 'Alert for second incoming call' },
  { key: 'voicemailEnabled', label: 'Voicemail', desc: 'Enable visual voicemail' },
  { key: 'silenceUnknownCallers', label: 'Silence Unknown', desc: 'Send unknown callers to voicemail' },
  { key: 'autoRejectUnknown', label: 'Auto Reject Unknown', desc: 'Reject calls from unknown numbers' },
  { key: 'callForwardingEnabled', label: 'Call Forwarding', desc: 'Forward calls to another number' },
  { key: 'recordCalls', label: 'Record Calls', desc: 'Auto-record when permitted' },
  { key: 'hapticFeedback', label: 'Haptic Feedback', desc: 'Vibration on key actions' },
  { key: 'dynamicIslandEnabled', label: 'Dynamic Island', desc: 'Live call indicator in status bar' },
];

export function SettingsScreen() {
  const queryClient = useQueryClient();
  const { tap } = useHaptic();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['phone', 'settings'],
    queryFn: () => phoneService.getSettings(),
  });

  const mutation = useMutation({
    mutationFn: (patch: Partial<PhoneSettings>) => phoneService.updateSettings(patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['phone'] }),
  });

  const toggle = (key: keyof PhoneSettings) => {
    if (!settings) return;
    tap();
    mutation.mutate({ [key]: !settings[key] });
  };

  if (isLoading || !settings) {
    return <div className="p-4 space-y-3">{[1, 2, 3, 4].map((i) => <div key={i} className="h-14 bg-white/5 rounded-2xl animate-pulse" />)}</div>;
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 gap-3">
      {TOGGLES.map((t) => (
        <GlassCard key={t.key}>
          <button type="button" onClick={() => toggle(t.key)} className="w-full flex items-center justify-between text-left">
            <div>
              <p className="text-white text-sm">{t.label}</p>
              <p className="text-white/40 text-[10px]">{t.desc}</p>
            </div>
            <div className={`w-11 h-6 rounded-full transition-colors ${settings[t.key] ? 'bg-green-500' : 'bg-white/10'}`}>
              <div className={`w-5 h-5 rounded-full bg-white mt-0.5 transition-transform ${settings[t.key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
          </button>
        </GlassCard>
      ))}

      {settings.callForwardingEnabled && (
        <GlassCard>
          <p className="text-white/60 text-xs mb-2">Forwarding Number</p>
          <input
            type="tel"
            defaultValue={settings.callForwardingNumber ?? ''}
            onBlur={(e) => mutation.mutate({ callForwardingNumber: e.target.value })}
            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
            placeholder="+1..."
          />
        </GlassCard>
      )}
    </div>
  );
}
