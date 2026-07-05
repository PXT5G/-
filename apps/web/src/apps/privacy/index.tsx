'use client';

import { usePrivacyDashboard } from '@/hooks/usePhase55';
import { AppShell, AppGlassCard, LoadingState } from '@/components/shared';

export function PrivacyApp() {
  const { data, isLoading } = usePrivacyDashboard();
  const dash = data as Record<string, unknown> | undefined;

  return (
    <AppShell title="Privacy Center" icon="🔒" subtitle="Permissions and tracking protection">
      <div className="p-4 space-y-4">
        {isLoading && <LoadingState />}
        {dash && (
          <>
            <AppGlassCard className="p-6 text-center">
              <p className="text-3xl font-bold">{Number(dash.appCount)}</p>
              <p className="text-xs text-white/50">Apps with permissions</p>
              <p className="text-lg font-bold mt-3">{Number(dash.permissionGrants)}</p>
              <p className="text-xs text-white/50">Total grants</p>
            </AppGlassCard>
            <AppGlassCard className="p-4 flex justify-between">
              <span className="text-sm">Tracking Protection</span>
              <span className="text-green-400 text-sm">{dash.trackingProtection ? 'On' : 'Off'}</span>
            </AppGlassCard>
            <section>
              <h2 className="text-sm font-semibold text-white/70 mb-2 px-1">App Permissions</h2>
              {((dash.apps as Record<string, unknown>[]) ?? []).map((a) => (
                <AppGlassCard key={String(a.appId)} className="p-3 mb-2">
                  <p className="text-sm font-medium">{String(a.appId)}</p>
                  <p className="text-[10px] text-white/40">{(a.permissions as string[] ?? []).join(', ')}</p>
                </AppGlassCard>
              ))}
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}
