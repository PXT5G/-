'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  useIntelligenceInit, useIntelligenceSocketSync, usePredictions,
  useSuggestions, useDashboards, useIntelligenceSearch, useRefreshDashboard,
} from '@/hooks/useIntelligence';
import { useHaptic } from '@/hooks/useSound';
import { cn } from '@/utils/cn';

type Tab = 'search' | 'predictions' | 'suggestions' | 'dashboards';

export function IntelligenceHubApp() {
  const [tab, setTab] = useState<Tab>('search');
  const [query, setQuery] = useState('');
  const { tap } = useHaptic();
  useIntelligenceInit();
  useIntelligenceSocketSync();
  const { data: predictions } = usePredictions();
  const { data: suggestions } = useSuggestions();
  const { data: dashboards } = useDashboards();
  const { data: searchResults } = useIntelligenceSearch(query);
  const refreshDashboard = useRefreshDashboard();

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#0a1628] to-[#1a1a2e] text-white">
      <header className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold text-gulf-gold">Intelligence</h1>
      </header>
      <div className="flex border-b border-white/10 mx-4 overflow-x-auto">
        {(['search', 'predictions', 'suggestions', 'dashboards'] as Tab[]).map((t) => (
          <button key={t} onClick={() => { tap(); setTab(t); }}
            className={cn('flex-1 min-w-[70px] py-2 text-xs capitalize',
              tab === t ? 'text-gulf-gold border-b-2 border-gulf-gold' : 'text-white/40')}>
            {t}
          </button>
        ))}
      </div>
      <main className="flex-1 overflow-y-auto p-4 space-y-3">
        {tab === 'search' && (
          <>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search everything..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm" />
            {(searchResults as Record<string, unknown>[] ?? []).map((r) => (
              <div key={String(r.entryId)} className="rounded-xl bg-white/5 border border-white/10 p-3">
                <p className="text-sm font-medium">{String(r.title)}</p>
                <p className="text-[10px] text-white/40">{String(r.type)} · {String(r.subtitle ?? '')}</p>
              </div>
            ))}
          </>
        )}
        {tab === 'predictions' && (predictions as Record<string, unknown>[] ?? []).map((p) => (
          <div key={String(p.predictionId)} className="rounded-xl bg-white/5 border border-white/10 p-3 flex justify-between">
            <div>
              <p className="text-sm">{String(p.targetLabel)}</p>
              <p className="text-[10px] text-white/40 capitalize">{String(p.type)}</p>
            </div>
            <span className="text-gulf-gold text-sm">{Math.round(Number(p.confidence) * 100)}%</span>
          </div>
        ))}
        {tab === 'suggestions' && (suggestions as Record<string, unknown>[] ?? []).map((s) => (
          <div key={String(s.suggestionId)} className="rounded-xl bg-white/5 border border-white/10 p-3">
            <p className="text-sm font-medium">{String(s.title)}</p>
            <p className="text-xs text-white/40">{String(s.subtitle ?? '')}</p>
          </div>
        ))}
        {tab === 'dashboards' && (dashboards as Record<string, unknown>[] ?? []).map((d) => (
          <div key={String(d.dashboardId)} className="rounded-xl bg-white/5 border border-white/10 p-4">
            <div className="flex justify-between items-center">
              <p className="font-semibold">{String(d.name)}</p>
              <button onClick={() => refreshDashboard.mutate(String(d.dashboardId))}
                className="text-xs text-gulf-gold">Refresh</button>
            </div>
            <p className="text-[10px] text-white/40 capitalize mt-1">{String(d.type)}</p>
          </div>
        ))}
      </main>
    </div>
  );
}
