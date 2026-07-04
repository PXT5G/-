'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDeviceBackups } from '@/hooks/useDeviceEcosystem';
import { deviceEcosystemService } from '@/services/deviceEcosystemService';
import { useHaptic } from '@/hooks/useSound';

function formatSize(bytes?: number): string {
  if (!bytes) return '—';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DeviceBackupSettingsScreen({ onBack }: { onBack: () => void }) {
  const { tap } = useHaptic();
  const queryClient = useQueryClient();
  const { data: backups, isLoading } = useDeviceBackups();

  const createMutation = useMutation({
    mutationFn: () => deviceEcosystemService.createBackup(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['device-ecosystem', 'backup'] }),
  });

  const restoreMutation = useMutation({
    mutationFn: (backupId: string) => deviceEcosystemService.restoreBackup(backupId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['device-ecosystem', 'backup'] }),
  });

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-black">
        <div className="w-8 h-8 border-2 border-banana-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-black">
      <div className="p-4 pb-8">
        <button type="button" onClick={() => { tap(); onBack(); }} className="text-banana-gold text-sm mb-4">‹ Settings</button>
        <h1 className="text-2xl font-bold text-white mb-6">Device Backup</h1>

        <button
          type="button"
          onClick={() => { tap(); createMutation.mutate(); }}
          disabled={createMutation.isPending}
          className="w-full mb-6 py-3 rounded-xl bg-banana-gold text-black font-semibold text-sm disabled:opacity-50"
        >
          {createMutation.isPending ? 'Creating…' : 'Create Manual Backup'}
        </button>

        <section className="p-4 rounded-xl bg-white/5 border border-white/10">
          <h2 className="text-xs font-semibold text-white/40 uppercase mb-3">Version History</h2>
          {(backups ?? []).length === 0 ? (
            <p className="text-sm text-white/40">No backups yet</p>
          ) : (
            (backups ?? []).map((b) => (
              <div key={b.backupId} className="py-3 border-b border-white/5 last:border-0 flex justify-between items-center">
                <div>
                  <p className="text-sm text-white">v{b.version} · {b.backupType}</p>
                  <p className="text-xs text-white/40">{formatSize(b.sizeBytes)} · {b.completedAt ? new Date(b.completedAt).toLocaleString() : '—'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => { tap(); restoreMutation.mutate(b.backupId); }}
                  disabled={restoreMutation.isPending}
                  className="text-xs text-banana-gold px-3 py-1 rounded-lg bg-white/5"
                >
                  Restore
                </button>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
