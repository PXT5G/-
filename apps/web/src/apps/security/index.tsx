'use client';

import { useSecurityInit, useSecuritySocketSync, useSecurityDashboard } from '@/hooks/usePhase55';
import { AppShell, AppGlassCard, LoadingState } from '@/components/shared';

export function SecurityApp() {
  useSecurityInit();
  useSecuritySocketSync();
  const { data, isLoading } = useSecurityDashboard();
  const dash = data as Record<string, unknown> | undefined;

  return (
    <AppShell title="Security Center" icon="🛡️" subtitle="Threat monitoring and recommendations">
      <div className="p-4 space-y-4">
        {isLoading && <LoadingState label="Analyzing security..." />}
        {dash && (
          <>
            <AppGlassCard className="p-6 text-center">
              <p className="text-sm text-white/50">Security Score</p>
              <p className="text-5xl font-bold text-gulf-gold mt-1">{Number(dash.securityScore)}</p>
              <p className="text-xs text-white/40 mt-2">Threat: {String(dash.threatLevel)}</p>
            </AppGlassCard>
            <div className="grid grid-cols-2 gap-3">
              <AppGlassCard className="p-4 text-center">
                <p className="text-lg font-bold">{dash.twoFactorEnabled ? '✓' : '✗'}</p>
                <p className="text-[10px] text-white/50">2FA</p>
              </AppGlassCard>
              <AppGlassCard className="p-4 text-center">
                <p className="text-lg font-bold">{dash.biometricEnabled ? '✓' : '✗'}</p>
                <p className="text-[10px] text-white/50">Biometric</p>
              </AppGlassCard>
            </div>
            <section>
              <h2 className="text-sm font-semibold text-white/70 mb-2 px-1">Recommendations</h2>
              {((dash.recommendations as Record<string, unknown>[]) ?? []).map((r) => (
                <AppGlassCard key={String(r.id)} className="p-3 mb-2">
                  <p className="text-sm">{String(r.title)}</p>
                  <p className="text-[10px] text-white/40">{String(r.severity)}</p>
                </AppGlassCard>
              ))}
            </section>
            <section>
              <h2 className="text-sm font-semibold text-white/70 mb-2 px-1">Recent Events</h2>
              {((dash.recentEvents as Record<string, unknown>[]) ?? []).map((e) => (
                <AppGlassCard key={String(e.eventId)} className="p-3 mb-2">
                  <p className="text-sm">{String(e.title)}</p>
                  <p className="text-[10px] text-white/40">{String(e.type)} · {String(e.severity)}</p>
                </AppGlassCard>
              ))}
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}
