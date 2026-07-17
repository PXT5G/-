'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDeviceSync, useDeviceProfile } from '@/hooks/useDeviceEcosystem';
import { deviceEcosystemService } from '@/services/deviceEcosystemService';
import { useHaptic } from '@/hooks/useSound';

const SYNC_DOMAINS = ['settings', 'contacts', 'messages', 'apps', 'wallpapers', 'preferences'];

export function DeviceSyncSettingsScreen({ onBack }: { onBack: () => void }) {
  const { tap } = useHaptic();
  const queryClient = useQueryClient();
  const { data: syncStatus } = useDeviceSync();
  const { data: profile } = useDeviceProfile();
  const [targetId, setTargetId] = useState('');

  const syncMutation = useMutation({
    mutationFn: () => deviceEcosystemService.startSync(
      profile?.deviceUuid ?? 'local',
      targetId || 'remote-device',
      SYNC_DOMAINS
    ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['device-ecosystem', 'sync'] }),
  });

  return (
    <div className="h-full overflow-y-auto bg-black">
      <div className="p-4 pb-8">
        <button type="button" onClick={() => { tap(); onBack(); }} className="text-gulf-gold text-sm mb-4">‹ Settings</button>
        <h1 className="text-2xl font-bold text-white mb-6">Device Sync</h1>

        <section className="mb-4 p-4 rounded-xl bg-white/5 border border-white/10">
          <h2 className="text-xs font-semibold text-white/40 uppercase mb-3">Status</h2>
          <p className="text-sm text-white/70">
            {syncStatus?.syncing ? `Syncing… ${syncStatus.progress}%` : 'Idle'}
          </p>
          {syncStatus?.lastSyncAt && (
            <p className="text-xs text-white/40 mt-1">Last sync: {new Date(syncStatus.lastSyncAt).toLocaleString()}</p>
          )}
        </section>

        <section className="mb-4 p-4 rounded-xl bg-white/5 border border-white/10">
          <h2 className="text-xs font-semibold text-white/40 uppercase mb-3">Cross-Device Sync</h2>
          <p className="text-xs text-white/50 mb-2">Source: {profile?.deviceUuid?.slice(0, 12) ?? '—'}…</p>
          <input
            type="text"
            placeholder="Target device UUID"
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            className="w-full bg-white/10 text-white text-sm rounded-lg px-3 py-2 mb-3"
          />
          <button
            type="button"
            onClick={() => { tap(); syncMutation.mutate(); }}
            disabled={syncMutation.isPending || syncStatus?.syncing}
            className="w-full py-2 rounded-lg bg-gulf-gold text-black text-sm font-semibold disabled:opacity-50"
          >
            {syncMutation.isPending ? 'Starting…' : 'Start Sync'}
          </button>
        </section>

        <section className="p-4 rounded-xl bg-white/5 border border-white/10">
          <h2 className="text-xs font-semibold text-white/40 uppercase mb-3">Sync Domains</h2>
          {SYNC_DOMAINS.map((d) => (
            <p key={d} className="text-xs text-white/60 py-1 capitalize">{d}</p>
          ))}
        </section>
      </div>
    </div>
  );
}
