'use client';

import { usePrivacyDashboard } from '@/hooks/usePhase55';
import { cn } from '@/utils/cn';

function Glass({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md', className)}>{children}</div>;
}

export function PrivacyApp() {
  const { data, isLoading } = usePrivacyDashboard();
  const dash = data as Record<string, unknown> | undefined;

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#0a1628] to-[#1a1a2e] text-white">
      <header className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold text-gulf-gold">Privacy Center</h1>
      </header>
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading && <p className="text-center text-white/40">Loading...</p>}
        {dash && (
          <>
            <Glass className="p-6 text-center">
              <p className="text-3xl font-bold">{Number(dash.appCount)}</p>
              <p className="text-xs text-white/50">Apps with permissions</p>
              <p className="text-lg font-bold mt-3">{Number(dash.permissionGrants)}</p>
              <p className="text-xs text-white/50">Total grants</p>
            </Glass>
            <Glass className="p-4 flex justify-between">
              <span className="text-sm">Tracking Protection</span>
              <span className="text-green-400 text-sm">{dash.trackingProtection ? 'On' : 'Off'}</span>
            </Glass>
            <section>
              <h2 className="text-sm font-semibold text-white/70 mb-2">App Permissions</h2>
              {((dash.apps as Record<string, unknown>[]) ?? []).map((a) => (
                <Glass key={String(a.appId)} className="p-3 mb-2">
                  <p className="text-sm font-medium">{String(a.appId)}</p>
                  <p className="text-[10px] text-white/40">{(a.permissions as string[] ?? []).join(', ')}</p>
                </Glass>
              ))}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
