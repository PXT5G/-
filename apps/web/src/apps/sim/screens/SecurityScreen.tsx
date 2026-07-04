'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { simService } from '../services/simService';
import { Button } from '@/components/shared/Button';
import { useHaptic } from '@/hooks/useSound';

export function SecurityScreen() {
  const { tap, success } = useHaptic();
  const queryClient = useQueryClient();
  const [pin, setPin] = useState('');
  const [blockNumber, setBlockNumber] = useState('');

  const { data: security, isLoading } = useQuery({
    queryKey: ['sim', 'security'],
    queryFn: () => simService.getSecurity(),
  });

  const { data: blocked } = useQuery({
    queryKey: ['sim', 'blocked'],
    queryFn: () => simService.getBlocked(),
  });

  const update = useMutation({
    mutationFn: (data: { biometricEnabled?: boolean; simLocked?: boolean }) => simService.updateSecurity(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sim', 'security'] }),
  });

  const handleSetPin = async () => {
    if (!/^\d{4,8}$/.test(pin)) return;
    tap();
    await simService.setPin(pin);
    setPin('');
    success();
    queryClient.invalidateQueries({ queryKey: ['sim', 'security'] });
  };

  const handleBlock = async () => {
    if (!blockNumber) return;
    tap();
    await simService.addBlocked(blockNumber);
    setBlockNumber('');
    queryClient.invalidateQueries({ queryKey: ['sim', 'blocked'] });
  };

  if (isLoading) return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-banana-gold border-t-transparent rounded-full animate-spin" /></div>;

  const sec = security as { simPinEnabled?: boolean; simLocked?: boolean; biometricEnabled?: boolean; trustedDevices?: unknown[] };

  return (
    <div className="h-full overflow-y-auto px-4 py-4">
      <h1 className="text-white font-bold text-lg mb-4">Security</h1>

      <div className="bg-white/5 rounded-xl p-3 border border-white/10 mb-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-white">Biometric Verification</span>
          <button type="button" onClick={() => update.mutate({ biometricEnabled: !sec?.biometricEnabled })} className={`text-sm ${sec?.biometricEnabled ? 'text-green-400' : 'text-white/40'}`}>{sec?.biometricEnabled ? 'On' : 'Off'}</button>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-white">SIM Lock</span>
          <button type="button" onClick={() => update.mutate({ simLocked: !sec?.simLocked })} className={`text-sm ${sec?.simLocked ? 'text-red-400' : 'text-white/40'}`}>{sec?.simLocked ? 'Locked' : 'Unlocked'}</button>
        </div>
      </div>

      <div className="bg-white/5 rounded-xl p-3 border border-white/10 mb-4">
        <p className="text-sm text-white mb-2">SIM PIN {sec?.simPinEnabled ? '(enabled)' : ''}</p>
        <div className="flex gap-2">
          <input type="password" inputMode="numeric" maxLength={8} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} placeholder="4-8 digit PIN" className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
          <Button label="Set" onClick={handleSetPin} size="sm" />
        </div>
      </div>

      <p className="text-sm text-white font-medium mb-2">Blocked Numbers</p>
      <div className="flex gap-2 mb-3">
        <input value={blockNumber} onChange={(e) => setBlockNumber(e.target.value)} placeholder="Number to block" className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white" />
        <Button label="Block" onClick={handleBlock} size="sm" variant="destructive" />
      </div>
      {(blocked as { _id: string; number: string; blockType: string }[])?.map((b) => (
        <div key={b._id} className="flex justify-between py-2 border-b border-white/5">
          <span className="text-sm text-white">{b.number}</span>
          <button type="button" onClick={() => { tap(); simService.removeBlocked(b._id).then(() => queryClient.invalidateQueries({ queryKey: ['sim', 'blocked'] })); }} className="text-banana-gold text-xs">Unblock</button>
        </div>
      ))}
    </div>
  );
}
