'use client';

import { useCloudBackups, useCreateBackup, useRestoreBackup, useCloudSync, useSecuritySocketSync } from '@/hooks/usePhase55';
import { useHaptic } from '@/hooks/useSound';
import { cn } from '@/utils/cn';

function Glass({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md', className)}>{children}</div>;
}

export function CloudApp() {
  const { tap } = useHaptic();
  useSecuritySocketSync();
  const { data: backups, isLoading } = useCloudBackups();
  const createBackup = useCreateBackup();
  const restoreBackup = useRestoreBackup();
  const cloudSync = useCloudSync();

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#0a1628] to-[#1a1a2e] text-white">
      <header className="px-4 pt-4 pb-2 flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-gulf-gold">GULF Cloud</h1>
        <div className="flex gap-2">
          <button onClick={() => { tap(); cloudSync.mutate(); }} disabled={cloudSync.isPending}
            className="px-3 py-1.5 rounded-full bg-white/10 text-white text-xs font-semibold">Sync</button>
          <button onClick={() => { tap(); createBackup.mutate(); }} disabled={createBackup.isPending}
            className="px-3 py-1.5 rounded-full bg-gulf-gold/20 text-gulf-gold text-xs font-semibold">
            {createBackup.isPending ? 'Backing up...' : 'Backup'}
          </button>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading && <p className="text-center text-white/40">Loading...</p>}
        {(backups as Record<string, unknown>[] ?? []).map((b) => (
          <Glass key={String(b.backupId)} className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold">{String(b.backupType)}</p>
                <p className="text-[10px] text-white/40">{String(b.state)}</p>
              </div>
              <p className="text-sm text-gulf-gold">{b.sizeBytes ? `${(Number(b.sizeBytes) / 1_000_000).toFixed(0)} MB` : '—'}</p>
            </div>
            {b.state === 'completed' && (
              <button onClick={() => { tap(); restoreBackup.mutate(String(b.backupId)); }}
                className="mt-3 w-full py-1.5 rounded-xl bg-white/10 text-xs text-white/70">Restore</button>
            )}
          </Glass>
        ))}
        {!isLoading && (backups as unknown[] ?? []).length === 0 && (
          <Glass className="p-8 text-center"><p className="text-white/40">No backups yet. Tap Backup Now to create one.</p></Glass>
        )}
      </main>
    </div>
  );
}
