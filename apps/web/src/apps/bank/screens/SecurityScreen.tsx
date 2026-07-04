'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bankService } from '../services/bankService';
import { Button } from '@/components/shared/Button';
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

export function SecurityScreen() {
  const { tap, success } = useHaptic();
  const queryClient = useQueryClient();
  const [pin, setPin] = useState('');

  const { data: security, isLoading } = useQuery({
    queryKey: ['bank', 'security'],
    queryFn: () => bankService.getSecurity(),
  });

  const updateMutation = useMutation({
    mutationFn: (data: Parameters<typeof bankService.updateSecurity>[0]) => bankService.updateSecurity(data),
    onSuccess: () => { success(); queryClient.invalidateQueries({ queryKey: ['bank', 'security'] }); },
  });

  const handleSetPin = async () => {
    if (!/^\d{4,6}$/.test(pin)) return;
    tap();
    await bankService.setPin(pin);
    setPin('');
    success();
    queryClient.invalidateQueries({ queryKey: ['bank', 'security'] });
  };

  if (isLoading || !security) {
    return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-banana-gold border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="h-full overflow-y-auto px-4 py-4">
      <h1 className="text-white font-bold text-lg mb-4">Security Center</h1>

      <div className="bg-white/5 rounded-xl px-3 border border-white/10 mb-4">
        <Toggle label="Fingerprint Login" checked={security.fingerprintEnabled} onChange={(v) => updateMutation.mutate({ fingerprintEnabled: v })} />
        <Toggle label="Face Unlock" checked={security.faceUnlockEnabled} onChange={(v) => updateMutation.mutate({ faceUnlockEnabled: v })} />
        <Toggle label="Two-Factor Authentication" checked={security.twoFactorEnabled} onChange={(v) => updateMutation.mutate({ twoFactorEnabled: v })} />
        <Toggle label="Incoming Money Alerts" checked={security.notifyIncoming} onChange={(v) => updateMutation.mutate({ notifyIncoming: v })} />
        <Toggle label="Outgoing Money Alerts" checked={security.notifyOutgoing} onChange={(v) => updateMutation.mutate({ notifyOutgoing: v })} />
        <Toggle label="Security Alerts" checked={security.notifySecurity} onChange={(v) => updateMutation.mutate({ notifySecurity: v })} />
      </div>

      <div className="bg-white/5 rounded-xl p-3 border border-white/10 mb-4">
        <p className="text-sm text-white mb-1">Transfer Limits</p>
        <p className="text-[10px] text-white/40">Daily: {security.dailyTransferLimit.toLocaleString()} BNA · Single: {security.singleTransferLimit.toLocaleString()} BNA</p>
      </div>

      <div className="bg-white/5 rounded-xl p-3 border border-white/10">
        <p className="text-sm text-white mb-2">Bank PIN {security.pinEnabled ? '(enabled)' : ''}</p>
        <div className="flex gap-2">
          <input type="password" inputMode="numeric" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} placeholder="4-6 digit PIN" className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
          <Button label="Set" onClick={handleSetPin} size="sm" />
        </div>
      </div>

      <div className="mt-4 p-3 bg-banana-gold/10 border border-banana-gold/20 rounded-xl">
        <p className="text-banana-gold text-xs font-semibold">🛡️ Fraud Detection Active</p>
        <p className="text-white/50 text-[10px] mt-0.5">Large transfers and rapid activity are automatically flagged for review.</p>
      </div>
    </div>
  );
}
