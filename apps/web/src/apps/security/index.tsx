'use client';

import { motion } from 'framer-motion';
import { useSecurityInit, useSecuritySocketSync, useSecurityDashboard } from '@/hooks/usePhase55';
import { cn } from '@/utils/cn';

function Glass({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md', className)}>{children}</div>;
}

export function SecurityApp() {
  useSecurityInit();
  useSecuritySocketSync();
  const { data, isLoading } = useSecurityDashboard();
  const dash = data as Record<string, unknown> | undefined;

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#0a1628] to-[#1a1a2e] text-white">
      <header className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold text-gulf-gold">Security Center</h1>
      </header>
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading && <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-8 h-8 border-2 border-gulf-gold border-t-transparent rounded-full mx-auto" />}
        {dash && (
          <>
            <Glass className="p-6 text-center">
              <p className="text-sm text-white/50">Security Score</p>
              <p className="text-5xl font-bold text-gulf-gold mt-1">{Number(dash.securityScore)}</p>
              <p className="text-xs text-white/40 mt-2">Threat: {String(dash.threatLevel)}</p>
            </Glass>
            <div className="grid grid-cols-2 gap-3">
              <Glass className="p-4 text-center"><p className="text-lg font-bold">{dash.twoFactorEnabled ? '✓' : '✗'}</p><p className="text-[10px] text-white/50">2FA</p></Glass>
              <Glass className="p-4 text-center"><p className="text-lg font-bold">{dash.biometricEnabled ? '✓' : '✗'}</p><p className="text-[10px] text-white/50">Biometric</p></Glass>
            </div>
            <section>
              <h2 className="text-sm font-semibold text-white/70 mb-2">Recommendations</h2>
              {((dash.recommendations as Record<string, unknown>[]) ?? []).map((r) => (
                <Glass key={String(r.id)} className="p-3 mb-2">
                  <p className="text-sm">{String(r.title)}</p>
                  <p className="text-[10px] text-white/40">{String(r.severity)}</p>
                </Glass>
              ))}
            </section>
            <section>
              <h2 className="text-sm font-semibold text-white/70 mb-2">Recent Events</h2>
              {((dash.recentEvents as Record<string, unknown>[]) ?? []).map((e) => (
                <Glass key={String(e.eventId)} className="p-3 mb-2">
                  <p className="text-sm">{String(e.title)}</p>
                  <p className="text-[10px] text-white/40">{String(e.type)} · {String(e.severity)}</p>
                </Glass>
              ))}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
