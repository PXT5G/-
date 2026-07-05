'use client';

import { motion } from 'framer-motion';
import { useShortcutsInit, useShortcutsSocketSync, useShortcuts, useRunShortcut } from '@/hooks/useShortcuts';
import { useHaptic } from '@/hooks/useSound';
import { cn } from '@/utils/cn';

export function ShortcutsApp() {
  const { tap } = useHaptic();
  useShortcutsInit();
  useShortcutsSocketSync();
  const { data: shortcuts, isLoading } = useShortcuts();
  const runShortcut = useRunShortcut();

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#0a1628] to-[#1a1a2e] text-white">
      <header className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold text-gulf-gold">Shortcuts</h1>
      </header>
      <main className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading && (
          <div className="flex justify-center py-8">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="w-6 h-6 border-2 border-gulf-gold border-t-transparent rounded-full" />
          </div>
        )}
        {(shortcuts as Record<string, unknown>[] ?? []).map((s) => (
          <button key={String(s.shortcutId)} onClick={() => { tap(); runShortcut.mutate(String(s.shortcutId)); }}
            className="w-full rounded-2xl bg-white/5 border border-white/10 p-4 text-left hover:bg-white/10 transition-colors">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{String(s.icon ?? '⚡')}</span>
              <div className="flex-1">
                <p className="font-semibold">{String(s.name)}</p>
                <p className="text-xs text-white/40">{String(s.description ?? '')}</p>
                <p className="text-[10px] text-white/30 mt-1">{Number(s.runCount ?? 0)} runs</p>
              </div>
              {Boolean(s.isPinned) && <span className="text-gulf-gold text-xs">📌</span>}
            </div>
          </button>
        ))}
      </main>
    </div>
  );
}
