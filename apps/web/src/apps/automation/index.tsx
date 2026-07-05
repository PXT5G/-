'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  useAutomationInit, useAutomationSocketSync, useAutomations,
  useAutomationHistory, useRunAutomation, useActivateAutomation,
} from '@/hooks/useAutomation';
import { useHaptic } from '@/hooks/useSound';
import { cn } from '@/utils/cn';

type Tab = 'automations' | 'history';

export function AutomationApp() {
  const [tab, setTab] = useState<Tab>('automations');
  const { tap } = useHaptic();
  useAutomationInit();
  useAutomationSocketSync();
  const { data: automations, isLoading } = useAutomations();
  const { data: history } = useAutomationHistory();
  const runAutomation = useRunAutomation();
  const activateAutomation = useActivateAutomation();

  const STATUS_COLORS: Record<string, string> = {
    active: 'text-green-400', draft: 'text-amber-400', paused: 'text-orange-400', disabled: 'text-gray-400',
    completed: 'text-green-400', failed: 'text-red-400', running: 'text-blue-400',
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#0a1628] to-[#1a1a2e] text-white">
      <header className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold text-gulf-gold">Automation</h1>
      </header>
      <div className="flex border-b border-white/10 mx-4">
        {(['automations', 'history'] as Tab[]).map((t) => (
          <button key={t} onClick={() => { tap(); setTab(t); }}
            className={cn('flex-1 py-2 text-sm capitalize', tab === t ? 'text-gulf-gold border-b-2 border-gulf-gold' : 'text-white/40')}>
            {t}
          </button>
        ))}
      </div>
      <main className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading && (
          <div className="flex justify-center py-8">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="w-6 h-6 border-2 border-gulf-gold border-t-transparent rounded-full" />
          </div>
        )}
        {tab === 'automations' && (automations as Record<string, unknown>[] ?? []).map((a) => (
          <div key={String(a.automationId)} className="rounded-2xl bg-white/5 border border-white/10 p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-white">{String(a.name)}</p>
                <p className="text-xs text-white/40">{String(a.description ?? '')}</p>
                <p className="text-[10px] text-white/30 mt-1">{Number(a.runCount ?? 0)} runs</p>
              </div>
              <span className={cn('text-xs capitalize', STATUS_COLORS[String(a.status)] ?? 'text-white/50')}>
                {String(a.status)}
              </span>
            </div>
            <div className="flex gap-2 mt-3">
              {a.status === 'draft' && (
                <button onClick={() => activateAutomation.mutate(String(a.automationId))}
                  className="text-xs px-3 py-1 rounded-lg bg-green-500/20 text-green-400">Activate</button>
              )}
              {a.status === 'active' && (
                <button onClick={() => runAutomation.mutate(String(a.automationId))}
                  className="text-xs px-3 py-1 rounded-lg bg-gulf-gold/20 text-gulf-gold">Run Now</button>
              )}
            </div>
          </div>
        ))}
        {tab === 'history' && (history as Record<string, unknown>[] ?? []).map((r) => (
          <div key={String(r.runId)} className="rounded-2xl bg-white/5 border border-white/10 p-3 flex justify-between">
            <div>
              <p className="text-sm text-white">{String(r.automationId)}</p>
              <p className="text-[10px] text-white/40">{r.startedAt ? new Date(String(r.startedAt)).toLocaleString() : ''}</p>
            </div>
            <span className={cn('text-xs capitalize', STATUS_COLORS[String(r.status)] ?? '')}>{String(r.status)}</span>
          </div>
        ))}
      </main>
    </div>
  );
}
