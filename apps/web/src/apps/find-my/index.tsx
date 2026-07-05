'use client';

import { useFindMyDevices, useMarkDeviceLost, useSecuritySocketSync } from '@/hooks/usePhase55';
import { useHaptic } from '@/hooks/useSound';
import { cn } from '@/utils/cn';

function Glass({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md', className)}>{children}</div>;
}

export function FindMyApp() {
  const { tap } = useHaptic();
  useSecuritySocketSync();
  const { data: devices, isLoading } = useFindMyDevices();
  const markLost = useMarkDeviceLost();

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#0a1628] to-[#1a1a2e] text-white">
      <header className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold text-gulf-gold">Find My</h1>
      </header>
      <main className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading && <p className="text-center text-white/40">Loading devices...</p>}
        {(devices as Record<string, unknown>[] ?? []).map((d) => (
          <Glass key={String(d.deviceId)} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{String(d.deviceName)}</p>
                <p className="text-xs text-white/40">{String(d.deviceType)} · {d.batteryLevel != null ? `${d.batteryLevel}%` : '—'}</p>
                {Boolean(d.isLost) && <span className="text-red-400 text-xs">Lost Mode</span>}
              </div>
              {!d.isLost && (
                <button onClick={() => { tap(); markLost.mutate(String(d.deviceId)); }}
                  className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs">Mark Lost</button>
              )}
            </div>
          </Glass>
        ))}
        {!isLoading && (devices as unknown[] ?? []).length === 0 && (
          <Glass className="p-8 text-center"><p className="text-white/40">No devices registered yet.</p></Glass>
        )}
      </main>
    </div>
  );
}
