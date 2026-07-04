'use client';

import { useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  usePoliceDashboard, usePoliceDispatches, usePoliceOfficers, usePoliceUnits,
  usePoliceBolos, usePoliceWanted, usePoliceWarrants, usePoliceAnalytics,
  useUpdatePoliceStatus, usePoliceSearch, usePolicePanic, usePoliceSocketSync, usePoliceInit,
} from '@/hooks/usePolice';
import { useAuthStore } from '@/stores/authStore';
import { policeService } from '@/services/policeService';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useHaptic } from '@/hooks/useSound';
import { cn } from '@/utils/cn';

type Tab = 'mdt' | 'units' | 'dispatch' | 'search' | 'more';
type SubScreen = string | null;

const STATUS_COLORS: Record<string, string> = {
  on_duty: 'bg-green-500', off_duty: 'bg-gray-500', break: 'bg-yellow-500',
  en_route: 'bg-blue-500', on_scene: 'bg-purple-500', panic: 'bg-red-600 animate-pulse',
};

function GlassCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md', className)}>
      {children}
    </div>
  );
}

function StatBox({ label, value, alert }: { label: string; value: number; alert?: boolean }) {
  return (
    <GlassCard className={cn('p-3 text-center', alert && value > 0 && 'border-red-500/50')}>
      <p className={cn('text-2xl font-bold', alert && value > 0 ? 'text-red-400' : 'text-banana-gold')}>{value}</p>
      <p className="text-[10px] text-white/50 uppercase tracking-wide">{label}</p>
    </GlassCard>
  );
}

function MdtDashboard({ onNavigate }: { onNavigate: (s: string) => void }) {
  const { data, isLoading, error } = usePoliceDashboard();
  const updateStatus = useUpdatePoliceStatus();
  const panic = usePolicePanic();
  const { tap } = useHaptic();

  if (isLoading) return <LoadingState />;
  if (error || !data) return <ErrorState message="Failed to load MDT" />;

  const officer = data.officer as Record<string, string>;
  const stats = data.stats;

  return (
    <div className="p-4 space-y-4">
      <GlassCard className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-banana-gold text-xs font-semibold uppercase tracking-wider">Officer</p>
            <p className="text-white text-lg font-bold">{officer.displayName ?? 'Officer'}</p>
            <p className="text-white/50 text-sm">{officer.badgeNumber} · {officer.rank}</p>
          </div>
          <div className="text-right">
            <span className={cn('inline-block w-3 h-3 rounded-full mr-1', STATUS_COLORS[officer.status] ?? 'bg-gray-500')} />
            <span className="text-white/70 text-sm capitalize">{officer.status?.replace('_', ' ')}</span>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          {['on_duty', 'break', 'off_duty'].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => { tap(); updateStatus.mutate(s); }}
              className={cn(
                'flex-1 py-2 rounded-xl text-xs font-medium capitalize transition-colors',
                officer.status === s ? 'bg-banana-gold text-black' : 'bg-white/10 text-white'
              )}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </GlassCard>

      <div className="grid grid-cols-3 gap-2">
        <StatBox label="911 Calls" value={stats.calls911} alert />
        <StatBox label="Active" value={stats.activeDispatches} />
        <StatBox label="On Duty" value={stats.onDutyOfficers} />
        <StatBox label="BOLOs" value={stats.activeBolos} />
        <StatBox label="Warrants" value={stats.activeWarrants} />
        <StatBox label="Cases" value={stats.openCases} />
      </div>

      <button
        type="button"
        onClick={() => { tap(); panic.mutate(); }}
        className="w-full py-4 rounded-2xl bg-red-600/90 text-white font-bold text-sm uppercase tracking-wider border border-red-400/50"
      >
        🚨 Panic Button
      </button>

      <GlassCard className="p-4">
        <h3 className="text-white/60 text-xs uppercase mb-3">Quick Access</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            ['bolo', 'BOLO'], ['wanted', 'Wanted'], ['warrants', 'Warrants'],
            ['reports', 'Reports'], ['citations', 'Citations'], ['cases', 'Cases'],
            ['evidence', 'Evidence'], ['analytics', 'Analytics'],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => { tap(); onNavigate(id); }}
              className="py-3 rounded-xl bg-white/5 text-white text-sm hover:bg-white/10 transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
      </GlassCard>

      {(data.recentDispatches as Record<string, unknown>[]).length > 0 && (
        <GlassCard className="p-4">
          <h3 className="text-white/60 text-xs uppercase mb-3">Recent Dispatches</h3>
          {(data.recentDispatches as Record<string, unknown>[]).map((d) => (
            <div key={String(d.dispatchId)} className="py-2 border-b border-white/5 last:border-0">
              <div className="flex justify-between">
                <span className="text-white text-sm">{String(d.title)}</span>
                {Boolean(d.is911) && <span className="text-red-400 text-xs font-bold">911</span>}
              </div>
              <p className="text-white/40 text-xs">{String(d.district ?? d.address ?? '')}</p>
            </div>
          ))}
        </GlassCard>
      )}
    </div>
  );
}

function UnitsScreen() {
  const { data: officers, isLoading: oLoad } = usePoliceOfficers();
  const { data: units, isLoading: uLoad } = usePoliceUnits();
  if (oLoad || uLoad) return <LoadingState />;

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-white font-bold text-lg">Live Units</h2>
      {(units as Record<string, unknown>[] ?? []).map((u) => (
        <GlassCard key={String(u.unitId)} className="p-4">
          <div className="flex justify-between">
            <div>
              <p className="text-banana-gold font-semibold">{String(u.code)}</p>
              <p className="text-white text-sm">{String(u.name)}</p>
            </div>
            <span className="text-white/50 text-xs capitalize">{String(u.status)}</span>
          </div>
          <p className="text-white/40 text-xs mt-1">{String(u.radioChannel ?? '')} · {String(u.district ?? 'No GPS')}</p>
        </GlassCard>
      ))}
      <h3 className="text-white/60 text-sm uppercase mt-4">Officers</h3>
      {(officers as Record<string, unknown>[] ?? []).map((o) => (
        <GlassCard key={String(o.badgeNumber)} className="p-3 flex justify-between items-center">
          <div>
            <p className="text-white text-sm">{String(o.displayName ?? o.badgeNumber)}</p>
            <p className="text-white/40 text-xs">{String(o.badgeNumber)} · {String(o.rank)}</p>
          </div>
          <span className={cn('w-2 h-2 rounded-full', STATUS_COLORS[String(o.status)] ?? 'bg-gray-500')} />
        </GlassCard>
      ))}
    </div>
  );
}

function DispatchScreen() {
  const { data: all, isLoading } = usePoliceDispatches();
  const { data: calls911 } = usePoliceDispatches(true);
  const token = useAuthStore((s) => s.getAccessToken());
  const qc = useQueryClient();
  const { tap } = useHaptic();

  const assign = useMutation({
    mutationFn: (dispatchId: string) => policeService.updateDispatch(token!, dispatchId, { status: 'assigned' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['police'] }),
  });

  if (isLoading) return <LoadingState />;

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-white font-bold text-lg">Dispatch</h2>
      {(calls911 as Record<string, unknown>[] ?? []).length > 0 && (
        <>
          <p className="text-red-400 text-xs font-bold uppercase">911 Calls</p>
          {(calls911 as Record<string, unknown>[]).map((d) => (
            <DispatchCard key={String(d.dispatchId)} dispatch={d} onAssign={() => { tap(); assign.mutate(String(d.dispatchId)); }} />
          ))}
        </>
      )}
      <p className="text-white/60 text-xs uppercase">Active Calls</p>
      {(all as Record<string, unknown>[] ?? []).filter((d) => d.status !== 'resolved').map((d) => (
        <DispatchCard key={String(d.dispatchId)} dispatch={d} onAssign={() => { tap(); assign.mutate(String(d.dispatchId)); }} />
      ))}
      {(all as Record<string, unknown>[] ?? []).length === 0 && <EmptyState message="No active dispatches" />}
    </div>
  );
}

function DispatchCard({ dispatch: d, onAssign }: { dispatch: Record<string, unknown>; onAssign: () => void }) {
  const priority = Number(d.priority);
  return (
    <GlassCard className={cn('p-4', priority === 1 && 'border-red-500/40')}>
      <div className="flex justify-between mb-2">
        <span className="text-white font-medium text-sm">{String(d.title)}</span>
        <span className={cn('text-xs px-2 py-0.5 rounded-full', priority === 1 ? 'bg-red-500/30 text-red-300' : 'bg-white/10 text-white/60')}>
          P{priority}
        </span>
      </div>
      <p className="text-white/50 text-xs mb-2">{String(d.description)}</p>
      <p className="text-white/40 text-xs">{String(d.address ?? d.district ?? '')}</p>
      {d.status === 'pending' && (
        <button type="button" onClick={onAssign} className="mt-3 w-full py-2 rounded-xl bg-banana-gold/20 text-banana-gold text-xs font-semibold">
          Accept Dispatch
        </button>
      )}
    </GlassCard>
  );
}

function SearchScreen() {
  const [searchType, setSearchType] = useState('person');
  const [query, setQuery] = useState('');
  const search = usePoliceSearch();
  const { tap } = useHaptic();

  const types = [
    ['person', 'Person'], ['vehicle', 'Vehicle'], ['plate', 'Plate'],
    ['phone', 'Phone'], ['identity', 'Identity'], ['property', 'Property'],
    ['business', 'Business'], ['weapon', 'Weapon License'],
  ];

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-white font-bold text-lg">MDT Search</h2>
      <div className="flex flex-wrap gap-2">
        {types.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setSearchType(id)}
            className={cn('px-3 py-1.5 rounded-full text-xs', searchType === id ? 'bg-banana-gold text-black' : 'bg-white/10 text-white')}
          >
            {label}
          </button>
        ))}
      </div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Enter search query..."
        className="w-full bg-white/10 text-white rounded-xl px-4 py-3 text-sm"
      />
      <button
        type="button"
        disabled={!query || search.isPending}
        onClick={() => { tap(); search.mutate({ searchType, query }); }}
        className="w-full py-3 bg-banana-gold text-black rounded-xl font-semibold disabled:opacity-50"
      >
        {search.isPending ? 'Searching...' : 'Search'}
      </button>
      {search.data && (
        <GlassCard className="p-4">
          <pre className="text-white/80 text-xs overflow-auto max-h-64 whitespace-pre-wrap">
            {JSON.stringify((search.data as Record<string, unknown>).results, null, 2)}
          </pre>
        </GlassCard>
      )}
      {search.isError && <ErrorState message="Search failed" />}
    </div>
  );
}

function ListScreen({ title, useHook }: { title: string; useHook: () => { data?: unknown[]; isLoading: boolean } }) {
  const { data, isLoading } = useHook();
  if (isLoading) return <LoadingState />;
  if (!data?.length) return <EmptyState message={`No ${title.toLowerCase()} records`} />;
  return (
    <div className="p-4 space-y-3">
      <h2 className="text-white font-bold text-lg">{title}</h2>
      {data.map((item, i) => (
        <GlassCard key={i} className="p-4">
          <pre className="text-white/80 text-xs whitespace-pre-wrap">{JSON.stringify(item, null, 2)}</pre>
        </GlassCard>
      ))}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-10 h-10 border-2 border-banana-gold border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return <p className="text-red-400 text-center py-12 text-sm">{message}</p>;
}

function EmptyState({ message }: { message: string }) {
  return <p className="text-white/40 text-center py-12 text-sm">{message}</p>;
}

export function PoliceApp() {
  const [tab, setTab] = useState<Tab>('mdt');
  const [subScreen, setSubScreen] = useState<SubScreen>(null);
  const { tap } = useHaptic();

  usePoliceInit();
  usePoliceSocketSync();

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'mdt', label: 'MDT', icon: '📟' },
    { id: 'units', label: 'Units', icon: '👮' },
    { id: 'dispatch', label: 'Dispatch', icon: '📡' },
    { id: 'search', label: 'Search', icon: '🔍' },
    { id: 'more', label: 'More', icon: '⋯' },
  ];

  if (subScreen) {
    const screens: Record<string, ReactNode> = {
      bolo: <ListScreen title="BOLO" useHook={usePoliceBolos} />,
      wanted: <ListScreen title="Wanted List" useHook={usePoliceWanted} />,
      warrants: <ListScreen title="Arrest Warrants" useHook={usePoliceWarrants} />,
      analytics: <AnalyticsScreen />,
    };
    return (
      <div className="h-full flex flex-col bg-gradient-to-b from-[#0a0a12] to-black">
        <button type="button" onClick={() => { tap(); setSubScreen(null); }} className="text-banana-gold text-sm p-4">‹ MDT</button>
        <div className="flex-1 overflow-y-auto">{screens[subScreen] ?? <EmptyState message="Section coming soon" />}</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-[#0a0a12] to-black">
      <header className="px-4 pt-4 pb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🚔</span>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">Banana Police</h1>
            <p className="text-banana-gold/80 text-[10px] uppercase tracking-widest">Mobile Data Terminal</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {tab === 'mdt' && <MdtDashboard onNavigate={setSubScreen} />}
            {tab === 'units' && <UnitsScreen />}
            {tab === 'dispatch' && <DispatchScreen />}
            {tab === 'search' && <SearchScreen />}
            {tab === 'more' && (
              <div className="p-4 grid grid-cols-2 gap-3">
                {[
                  ['bolo', 'BOLO'], ['wanted', 'Wanted'], ['warrants', 'Warrants'],
                  ['reports', 'Reports'], ['citations', 'Citations'], ['cases', 'Cases'],
                  ['evidence', 'Evidence'], ['analytics', 'Analytics'],
                ].map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => { tap(); setSubScreen(id); }}
                    className="py-6 rounded-2xl bg-white/5 border border-white/10 text-white text-sm font-medium hover:bg-white/10"
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <nav className="border-t border-white/10 bg-black/80 backdrop-blur-lg px-2 py-2 flex">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => { tap(); setTab(t.id); }}
            className={cn(
              'flex-1 flex flex-col items-center py-2 rounded-xl transition-colors',
              tab === t.id ? 'text-banana-gold' : 'text-white/40'
            )}
          >
            <span className="text-lg">{t.icon}</span>
            <span className="text-[10px] mt-0.5">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function AnalyticsScreen() {
  const { data, isLoading } = usePoliceAnalytics();
  if (isLoading) return <LoadingState />;
  const analytics = data as Record<string, unknown>;
  const totals = analytics.totals as Record<string, number>;
  const heatMap = analytics.heatMap as { district: string; incidents: number }[];

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-white font-bold text-lg">Analytics</h2>
      <div className="grid grid-cols-2 gap-2">
        <StatBox label="Dispatches" value={totals?.dispatches ?? 0} />
        <StatBox label="Citations" value={totals?.citations ?? 0} />
        <StatBox label="Reports" value={totals?.reports ?? 0} />
        <StatBox label="Arrests" value={totals?.arrests ?? 0} />
      </div>
      <GlassCard className="p-4">
        <h3 className="text-white/60 text-xs uppercase mb-3">Heat Map — By District</h3>
        {(heatMap ?? []).map((h) => (
          <div key={h.district} className="flex justify-between py-2 border-b border-white/5">
            <span className="text-white text-sm">{h.district}</span>
            <span className="text-banana-gold text-sm">{h.incidents}</span>
          </div>
        ))}
      </GlassCard>
    </div>
  );
}
