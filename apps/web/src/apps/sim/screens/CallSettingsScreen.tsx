'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { simService } from '../services/simService';
import { useHaptic } from '@/hooks/useSound';

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5">
      <span className="text-sm text-white">{label}</span>
      <button type="button" onClick={() => onChange(!checked)} className={`w-11 h-6 rounded-full transition-colors ${checked ? 'bg-banana-gold' : 'bg-white/20'}`}>
        <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}

export function CallSettingsScreen() {
  const { tap } = useHaptic();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['sim', 'call-settings'],
    queryFn: () => simService.getCallSettings(),
  });

  const update = useMutation({
    mutationFn: (data: Parameters<typeof simService.updateCallSettings>[0]) => simService.updateCallSettings(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sim', 'call-settings'] }),
  });

  if (isLoading || !settings) return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-banana-gold border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="h-full overflow-y-auto px-4 py-4">
      <h1 className="text-white font-bold text-lg mb-4">Call Settings</h1>
      <div className="bg-white/5 rounded-xl px-3 border border-white/10">
        <Toggle label="Caller ID" checked={settings.callerIdEnabled} onChange={(v) => { tap(); update.mutate({ callerIdEnabled: v }); }} />
        <Toggle label="Call Waiting" checked={settings.callWaiting} onChange={(v) => { tap(); update.mutate({ callWaiting: v }); }} />
        <Toggle label="Call Forwarding" checked={settings.callForwarding} onChange={(v) => { tap(); update.mutate({ callForwarding: v }); }} />
        <Toggle label="Voicemail" checked={settings.voicemailEnabled} onChange={(v) => { tap(); update.mutate({ voicemailEnabled: v }); }} />
        <Toggle label="Spam Protection" checked={settings.spamProtection} onChange={(v) => { tap(); update.mutate({ spamProtection: v }); }} />
        <Toggle label="Unknown Call Filter" checked={settings.unknownCallFilter} onChange={(v) => { tap(); update.mutate({ unknownCallFilter: v }); }} />
      </div>
      <p className="text-[10px] text-white/40 mt-4 uppercase">Emergency Numbers</p>
      <div className="flex flex-wrap gap-2 mt-2">
        {settings.emergencyNumbers.map((n) => (
          <span key={n} className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">{n}</span>
        ))}
      </div>
    </div>
  );
}
