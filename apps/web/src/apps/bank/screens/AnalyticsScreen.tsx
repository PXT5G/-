'use client';

import { useQuery } from '@tanstack/react-query';
import { bankService } from '../services/bankService';

export function AnalyticsScreen() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['bank', 'analytics'],
    queryFn: () => bankService.getAnalytics('month'),
  });

  if (isLoading || !analytics) {
    return <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-banana-gold border-t-transparent rounded-full animate-spin" /></div>;
  }

  const maxBar = Math.max(...analytics.monthlyData.map((m) => Math.max(m.income, m.expenses)), 1);

  return (
    <div className="h-full overflow-y-auto px-4 py-4">
      <h1 className="text-white font-bold text-lg mb-4">Analytics</h1>

      <div className="grid grid-cols-3 gap-2 mb-5">
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-center">
          <p className="text-[9px] text-green-400/60">Income</p>
          <p className="text-green-400 font-bold">{analytics.totalIncome.toFixed(0)}</p>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
          <p className="text-[9px] text-red-400/60">Expenses</p>
          <p className="text-red-400 font-bold">{analytics.totalExpenses.toFixed(0)}</p>
        </div>
        <div className="bg-banana-gold/10 border border-banana-gold/20 rounded-xl p-3 text-center">
          <p className="text-[9px] text-banana-gold/60">Net</p>
          <p className="text-banana-gold font-bold">{analytics.netFlow.toFixed(0)}</p>
        </div>
      </div>

      <p className="text-sm text-white font-medium mb-2">Monthly Overview</p>
      <div className="flex items-end gap-1 h-24 mb-5 bg-white/5 rounded-xl p-3 border border-white/10">
        {analytics.monthlyData.map((m) => (
          <div key={m.label} className="flex-1 flex flex-col items-center gap-0.5">
            <div className="w-full flex flex-col items-center gap-0.5 flex-1 justify-end">
              <div className="w-full bg-green-500/60 rounded-t" style={{ height: `${(m.income / maxBar) * 60}px`, minHeight: m.income > 0 ? 2 : 0 }} />
              <div className="w-full bg-red-500/60 rounded-t" style={{ height: `${(m.expenses / maxBar) * 60}px`, minHeight: m.expenses > 0 ? 2 : 0 }} />
            </div>
            <span className="text-[8px] text-white/40">{m.label}</span>
          </div>
        ))}
      </div>

      <p className="text-sm text-white font-medium mb-2">Category Breakdown</p>
      <div className="space-y-2 mb-5">
        {Object.entries(analytics.categoryBreakdown).map(([cat, amt]) => (
          <div key={cat} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
            <span className="text-sm text-white capitalize">{cat}</span>
            <span className="text-sm text-red-400">-{amt.toFixed(2)} BNA</span>
          </div>
        ))}
      </div>

      <p className="text-sm text-white font-medium mb-2">Budget Tracking</p>
      <div className="space-y-2 mb-5">
        {analytics.budgets.map((b) => (
          <div key={b.category} className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="flex justify-between mb-1">
              <span className="text-sm text-white capitalize">{b.category}</span>
              <span className="text-xs text-white/50">{b.spent.toFixed(0)} / {b.limit.toFixed(0)}</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${b.percentUsed > 90 ? 'bg-red-500' : b.percentUsed > 70 ? 'bg-yellow-500' : 'bg-banana-gold'}`} style={{ width: `${Math.min(b.percentUsed, 100)}%` }} />
            </div>
          </div>
        ))}
      </div>

      <p className="text-sm text-white font-medium mb-2">Insights</p>
      {analytics.insights.map((insight, i) => (
        <div key={i} className="bg-banana-gold/10 border border-banana-gold/20 rounded-xl p-3 mb-2">
          <p className="text-xs text-banana-gold/90">{insight}</p>
        </div>
      ))}
    </div>
  );
}
