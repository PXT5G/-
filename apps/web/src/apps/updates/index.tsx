'use client';

import { useUpdatesCheck, useSecuritySocketSync } from '@/hooks/usePhase55';
import { cn } from '@/utils/cn';

function Glass({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md', className)}>{children}</div>;
}

export function UpdatesApp() {
  useSecuritySocketSync();
  const { data, isLoading, refetch } = useUpdatesCheck();
  const updates = data as Record<string, unknown> | undefined;

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#0a1628] to-[#1a1a2e] text-white">
      <header className="px-4 pt-4 pb-2 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gulf-gold">Updates</h1>
        <button onClick={() => refetch()} className="px-3 py-1.5 rounded-full bg-white/10 text-xs">Check</button>
      </header>
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading && <p className="text-center text-white/40">Checking for updates...</p>}
        {updates && (
          <>
            <Glass className="p-4 text-center">
              <p className="text-sm text-white/50">Channel</p>
              <p className="text-lg font-bold text-gulf-gold">{String(updates.channel)}</p>
              <p className="text-xs text-white/40 mt-2">
                {((updates.pendingUpdates as unknown[]) ?? []).length} pending update(s)
              </p>
            </Glass>
            {((updates.pendingUpdates as Record<string, unknown>[]) ?? []).map((u) => (
              <Glass key={String(u.bundleId)} className="p-4">
                <p className="font-semibold">{String(u.bundleId)}</p>
                <p className="text-xs text-white/40">v{String(u.version)} · {Number(u.size ?? 0).toLocaleString()} bytes</p>
              </Glass>
            ))}
          </>
        )}
      </main>
    </div>
  );
}
