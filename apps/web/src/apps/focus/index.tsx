'use client';

import { motion } from 'framer-motion';
import {
  useFocusInit, useFocusSocketSync, useFocusProfiles, useActiveFocus,
  useEnableFocus, useDisableFocus,
} from '@/hooks/useFocus';
import { useHaptic } from '@/hooks/useSound';
import { cn } from '@/utils/cn';

export function FocusApp() {
  const { tap } = useHaptic();
  useFocusInit();
  useFocusSocketSync();
  const { data: profiles, isLoading } = useFocusProfiles();
  const { data: active } = useActiveFocus();
  const enableFocus = useEnableFocus();
  const disableFocus = useDisableFocus();

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#0a1628] to-[#1a1a2e] text-white">
      <header className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold text-gulf-gold">Focus</h1>
        {active && (
          <p className="text-xs text-green-400 mt-1">Active: {(active as Record<string, unknown>).name as string}</p>
        )}
      </header>
      {active && (
        <div className="px-4 pb-2">
          <button onClick={() => { tap(); disableFocus.mutate(); }}
            className="w-full py-2 rounded-xl bg-red-500/20 text-red-400 text-sm">Turn Off Focus</button>
        </div>
      )}
      <main className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading && (
          <div className="flex justify-center py-8">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="w-6 h-6 border-2 border-gulf-gold border-t-transparent rounded-full" />
          </div>
        )}
        {(profiles as Record<string, unknown>[] ?? []).map((p) => (
          <button key={String(p.profileId)}
            onClick={() => { tap(); enableFocus.mutate(String(p.profileId)); }}
            disabled={Boolean(p.isActive)}
            className={cn('w-full rounded-2xl border p-4 text-left transition-colors',
              p.isActive ? 'bg-gulf-gold/20 border-gulf-gold' : 'bg-white/5 border-white/10 hover:bg-white/10')}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{String(p.icon ?? '🎯')}</span>
              <div>
                <p className="font-semibold">{String(p.name)}</p>
                <p className="text-xs text-white/40 capitalize">{String(p.type)}</p>
              </div>
            </div>
          </button>
        ))}
      </main>
    </div>
  );
}
