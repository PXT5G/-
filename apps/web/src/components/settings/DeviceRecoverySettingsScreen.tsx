'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDeviceRecovery } from '@/hooks/useDeviceEcosystem';
import { deviceEcosystemService } from '@/services/deviceEcosystemService';
import { useHaptic } from '@/hooks/useSound';

export function DeviceRecoverySettingsScreen({ onBack }: { onBack: () => void }) {
  const { tap } = useHaptic();
  const queryClient = useQueryClient();
  const { data, isLoading } = useDeviceRecovery();
  const [confirmPhrase, setConfirmPhrase] = useState('');

  const modeMutation = useMutation({
    mutationFn: (mode: string) => deviceEcosystemService.setRecoveryMode(mode),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['device-ecosystem', 'recovery'] }),
  });

  const resetMutation = useMutation({
    mutationFn: () => deviceEcosystemService.factoryReset(confirmPhrase),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['device-ecosystem', 'recovery'] }),
  });

  if (isLoading || !data) {
    return (
      <div className="h-full flex items-center justify-center bg-black">
        <div className="w-8 h-8 border-2 border-gulf-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { recovery, availableBackups } = data;

  return (
    <div className="h-full overflow-y-auto bg-black">
      <div className="p-4 pb-8">
        <button type="button" onClick={() => { tap(); onBack(); }} className="text-gulf-gold text-sm mb-4">‹ Settings</button>
        <h1 className="text-2xl font-bold text-white mb-6">System Recovery</h1>

        <section className="mb-4 p-4 rounded-xl bg-white/5 border border-white/10">
          <h2 className="text-xs font-semibold text-white/40 uppercase mb-3">Recovery Mode</h2>
          <p className="text-sm text-white/70 mb-3">Current: {recovery.recoveryMode}</p>
          <div className="flex gap-2 flex-wrap">
            {(['normal', 'safe', 'recovery'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => { tap(); modeMutation.mutate(mode); }}
                disabled={modeMutation.isPending}
                className={`px-3 py-1 rounded-full text-xs capitalize ${
                  recovery.recoveryMode === mode ? 'bg-gulf-gold text-black' : 'bg-white/10 text-white'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </section>

        <section className="mb-4 p-4 rounded-xl bg-white/5 border border-white/10">
          <h2 className="text-xs font-semibold text-white/40 uppercase mb-3">Available Backups</h2>
          {availableBackups.length === 0 ? (
            <p className="text-sm text-white/40">No backups available</p>
          ) : (
            availableBackups.map((b) => (
              <p key={b.backupId} className="text-xs text-white/60 py-1">v{b.version} · {b.backupType}</p>
            ))
          )}
        </section>

        <section className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
          <h2 className="text-xs font-semibold text-red-400 uppercase mb-3">Factory Reset</h2>
          <p className="text-xs text-white/50 mb-2">Type RESET DEVICE to confirm</p>
          <input
            type="text"
            value={confirmPhrase}
            onChange={(e) => setConfirmPhrase(e.target.value)}
            className="w-full bg-white/10 text-white text-sm rounded-lg px-3 py-2 mb-3"
            placeholder="RESET DEVICE"
          />
          <button
            type="button"
            onClick={() => { tap(); resetMutation.mutate(); }}
            disabled={resetMutation.isPending || confirmPhrase !== 'RESET DEVICE'}
            className="w-full py-2 rounded-lg bg-red-500 text-white text-sm font-semibold disabled:opacity-50"
          >
            Factory Reset
          </button>
        </section>
      </div>
    </div>
  );
}
