'use client';

import { motion } from 'framer-motion';
import {
  useEconomyInit, useEconomySocketSync, useEconomyDashboard,
  useEconomyAnalytics, useEconomyGdp, useEconomyInflation,
  useEconomyValuations, useEconomyBankMetrics, useTriggerEconomyTick,
} from '@/hooks/useEconomy';
import { useAuthStore } from '@/stores/authStore';
import { useHaptic } from '@/hooks/useSound';
import { cn } from '@/utils/cn';

function GlassCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md', className)}>
      {children}
    </div>
  );
}

function BarChart({ data, valueKey, labelKey, color = 'bg-gulf-gold' }: {
  data: Record<string, unknown>[];
  valueKey: string;
  labelKey: string;
  color?: string;
}) {
  const max = Math.max(...data.map((d) => Number(d[valueKey]) || 0), 1);
  return (
    <div className="flex items-end gap-1 h-24">
      {data.map((d, i) => {
        const val = Number(d[valueKey]) || 0;
        const height = `${Math.max((val / max) * 100, 4)}%`;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex items-end h-20">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height }}
                className={cn('w-full rounded-t', color)}
              />
            </div>
            <span className="text-[8px] text-white/40 truncate w-full text-center">{String(d[labelKey]).slice(-5)}</span>
          </div>
        );
      })}
    </div>
  );
}

function HeatmapGrid({ items }: { items: { sector: string; intensity: number }[] }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map((item) => {
        const intensity = Math.min(item.intensity, 3) / 3;
        return (
          <div
            key={item.sector}
            className="rounded-xl p-3 text-center border border-white/10"
            style={{ background: `rgba(212, 175, 55, ${intensity * 0.4})` }}
          >
            <p className="text-[10px] text-white/70 uppercase">{item.sector.replace('_', ' ')}</p>
            <p className="text-sm font-bold text-gulf-gold">{item.intensity.toFixed(2)}</p>
          </div>
        );
      })}
    </div>
  );
}

export function EconomyAdminScreen({ onBack }: { onBack: () => void }) {
  const { tap } = useHaptic();
  const user = useAuthStore((s) => s.user);
  useEconomyInit();
  useEconomySocketSync();

  const { data: dashboard, isLoading } = useEconomyDashboard();
  const { data: analytics } = useEconomyAnalytics();
  const { data: gdpHistory } = useEconomyGdp();
  const { data: inflationHistory } = useEconomyInflation();
  const { data: valuations } = useEconomyValuations();
  const { data: bankMetrics } = useEconomyBankMetrics();
  const tickMutation = useTriggerEconomyTick();

  if (user?.role !== 'admin') {
    return (
      <div className="h-full overflow-y-auto bg-black p-4">
        <button type="button" onClick={() => { tap(); onBack(); }} className="text-gulf-gold text-sm mb-4">‹ Settings</button>
        <p className="text-white/60">Admin access required for Economy Engine.</p>
      </div>
    );
  }

  const state = (dashboard as { state?: Record<string, number> })?.state ?? {};
  const gdpChart = (analytics as { gdpChart?: Record<string, unknown>[] })?.gdpChart ?? (gdpHistory as Record<string, unknown>[]) ?? [];
  const inflationChart = (analytics as { inflationChart?: Record<string, unknown>[] })?.inflationChart ?? (inflationHistory as Record<string, unknown>[]) ?? [];
  const heatmap = (analytics as { heatmap?: { sector: string; intensity: number }[] })?.heatmap ?? [];
  const topCompanies = (valuations as { items?: Record<string, unknown>[] })?.items ?? (dashboard as { valuations?: Record<string, unknown>[] })?.valuations ?? [];

  return (
    <div className="h-full overflow-y-auto bg-black">
      <div className="p-4 pb-8">
        <button type="button" onClick={() => { tap(); onBack(); }} className="text-gulf-gold text-sm mb-4">‹ Settings</button>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Economy Engine</h1>
            <p className="text-xs text-white/40">Central economic simulation — admin only</p>
          </div>
          <button
            type="button"
            onClick={() => { tap(); tickMutation.mutate(); }}
            disabled={tickMutation.isPending}
            className="px-3 py-1.5 rounded-lg bg-gulf-gold/20 text-gulf-gold text-xs border border-gulf-gold/30"
          >
            {tickMutation.isPending ? 'Running…' : 'Run Tick'}
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="w-8 h-8 border-2 border-gulf-gold border-t-transparent rounded-full" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                ['GDP', state.gdp, true],
                ['Inflation', (state.inflationRate ?? 0) * 100, false, '%'],
                ['Confidence', (state.marketConfidence ?? 0) * 100, false, '%'],
                ['Liquidity', (state.liquidity ?? 0) * 100, false, '%'],
                ['Consumer Spend', state.consumerSpending, true],
                ['Companies', state.activeCompanies, false],
                ['Population', state.population, false],
                ['Listings', state.activeListings, false],
              ].map(([label, val, isCurrency, suffix]) => (
                <GlassCard key={String(label)} className="p-3 text-center">
                  <p className="text-lg font-bold text-gulf-gold">
                    {typeof val === 'number'
                      ? isCurrency
                        ? `₴ ${val.toLocaleString()}`
                        : `${val.toFixed?.(1) ?? val}${suffix ?? ''}`
                      : '—'}
                  </p>
                  <p className="text-[10px] text-white/50 uppercase">{String(label)}</p>
                </GlassCard>
              ))}
            </div>

            <GlassCard className="p-4 mb-4">
              <h2 className="text-xs font-semibold text-white/40 uppercase mb-3">GDP History</h2>
              {gdpChart.length > 0 ? (
                <BarChart data={gdpChart} valueKey="gdp" labelKey="period" />
              ) : (
                <p className="text-xs text-white/40">No GDP data yet — run a tick</p>
              )}
            </GlassCard>

            <GlassCard className="p-4 mb-4">
              <h2 className="text-xs font-semibold text-white/40 uppercase mb-3">Inflation</h2>
              {inflationChart.length > 0 ? (
                <BarChart data={inflationChart} valueKey="rate" labelKey="period" color="bg-red-400/70" />
              ) : (
                <p className="text-xs text-white/40">No inflation data yet</p>
              )}
            </GlassCard>

            <GlassCard className="p-4 mb-4">
              <h2 className="text-xs font-semibold text-white/40 uppercase mb-3">Market Heatmap</h2>
              {heatmap.length > 0 ? <HeatmapGrid items={heatmap} /> : <p className="text-xs text-white/40">No market data</p>}
            </GlassCard>

            <GlassCard className="p-4 mb-4">
              <h2 className="text-xs font-semibold text-white/40 uppercase mb-3">Company Rankings</h2>
              <div className="space-y-2">
                {(topCompanies as Record<string, unknown>[]).slice(0, 10).map((c, i) => (
                  <div key={String(c.companyId)} className="flex items-center justify-between py-1 border-b border-white/5">
                    <div className="flex items-center gap-2">
                      <span className="text-gulf-gold font-bold text-sm w-5">#{Number(c.rank ?? i + 1)}</span>
                      <span className="text-sm text-white/80">{String(c.companyName)}</span>
                    </div>
                    <span className="text-sm text-gulf-gold">₴ {Number(c.totalValuation ?? 0).toLocaleString()}</span>
                  </div>
                ))}
                {topCompanies.length === 0 && <p className="text-xs text-white/40">No valuations yet</p>}
              </div>
            </GlassCard>

            {bankMetrics && (
              <GlassCard className="p-4">
                <h2 className="text-xs font-semibold text-white/40 uppercase mb-3">Bank Integration</h2>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(bankMetrics as Record<string, number>).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-white/60">
                      <span className="capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
                      <span className="text-white">{typeof v === 'number' ? v.toLocaleString() : v}</span>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}
          </>
        )}
      </div>
    </div>
  );
}
