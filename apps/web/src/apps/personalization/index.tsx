'use client';

import { motion } from 'framer-motion';
import {
  usePersonalizationInit, usePersonalizationSocketSync, useThemes, useActivateTheme,
  useWallpapers, useHomeLayouts, useLockScreenProfiles, usePerformanceSnapshot,
} from '@/hooks/usePersonalization';
import { useHaptic } from '@/hooks/useSound';
import { cn } from '@/utils/cn';

function Glass({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md', className)}>{children}</div>;
}

export function PersonalizationApp() {
  const { tap } = useHaptic();
  usePersonalizationInit();
  usePersonalizationSocketSync();
  const { data: themes, isLoading: themesLoading } = useThemes();
  const { data: wallpapers } = useWallpapers();
  const { data: layouts } = useHomeLayouts();
  const { data: lockProfiles } = useLockScreenProfiles();
  const { data: perf } = usePerformanceSnapshot();
  const activateTheme = useActivateTheme();

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#0a1628] to-[#1a1a2e] text-white">
      <header className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold text-gulf-gold">Personalization</h1>
        <p className="text-xs text-white/40">Themes · Wallpapers · Layouts · Lock Screen</p>
      </header>
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        <section>
          <h2 className="text-sm font-semibold text-white/70 mb-2">Themes</h2>
          {themesLoading && <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-6 h-6 border-2 border-gulf-gold border-t-transparent rounded-full mx-auto" />}
          <div className="space-y-2">
            {(themes as Record<string, unknown>[] ?? []).map((t) => (
              <button key={String(t.profileId)} onClick={() => { tap(); activateTheme.mutate(String(t.profileId)); }}
                className={cn('w-full p-4 text-left transition-colors', Boolean(t.isActive) ? 'ring-1 ring-gulf-gold' : '')}>
                <Glass className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{String(t.name)}</p>
                    <p className="text-xs text-white/40">{String(t.mode)} · {String(t.accentColor)}</p>
                  </div>
                  {Boolean(t.isActive) && <span className="text-gulf-gold text-xs">Active</span>}
                </Glass>
              </button>
            ))}
          </div>
        </section>
        <section>
          <h2 className="text-sm font-semibold text-white/70 mb-2">Wallpapers</h2>
          <div className="grid grid-cols-2 gap-2">
            {(wallpapers as Record<string, unknown>[] ?? []).map((w) => (
              <Glass key={String(w.packId)} className="p-3">
                <p className="text-sm font-medium">{String(w.name)}</p>
                <p className="text-[10px] text-white/40">{String(w.type)}</p>
              </Glass>
            ))}
          </div>
        </section>
        <section>
          <h2 className="text-sm font-semibold text-white/70 mb-2">Home Layouts</h2>
          {(layouts as Record<string, unknown>[] ?? []).map((l) => (
            <Glass key={String(l.layoutId)} className="p-4 mb-2">
              <p className="font-medium">{String(l.name)}</p>
              <p className="text-xs text-white/40">{Array.isArray(l.pages) ? l.pages.length : 0} pages</p>
            </Glass>
          ))}
        </section>
        <section>
          <h2 className="text-sm font-semibold text-white/70 mb-2">Lock Screen</h2>
          {(lockProfiles as Record<string, unknown>[] ?? []).map((p) => (
            <Glass key={String(p.profileId)} className="p-4 mb-2">
              <p className="font-medium">{String(p.name)}</p>
              {Boolean(p.isActive) && <span className="text-gulf-gold text-xs">Active</span>}
            </Glass>
          ))}
        </section>
        {perf && (
          <section>
            <h2 className="text-sm font-semibold text-white/70 mb-2">Performance</h2>
            <Glass className="p-4">
              <pre className="text-[10px] text-white/50 overflow-auto">{JSON.stringify(perf, null, 2)}</pre>
            </Glass>
          </section>
        )}
      </main>
    </div>
  );
}
