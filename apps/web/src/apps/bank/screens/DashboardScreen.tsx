'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { bankService } from '../services/bankService';
import { useBankStore } from '../store/bankStore';
import { AnimatedBalance } from '../components/AnimatedBalance';
import { TransactionItem } from '../components/TransactionItem';
import { useHaptic } from '@/hooks/useSound';

export function DashboardScreen({ onTransfer, onDeposit }: { onTransfer: () => void; onDeposit: () => void }) {
  const { setDashboard } = useBankStore();
  const { tap } = useHaptic();

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['bank', 'dashboard'],
    queryFn: async () => {
      const d = await bankService.getDashboard();
      setDashboard(d);
      return d;
    },
    refetchInterval: 30000,
  });

  if (isLoading || !dashboard) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-banana-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const quickActions = [
    { icon: '↗️', label: 'Send', action: onTransfer },
    { icon: '↓', label: 'Deposit', action: onDeposit },
    { icon: '📱', label: 'QR Pay', action: onTransfer },
    { icon: '📊', label: 'Stats', action: () => useBankStore.getState().setTab('analytics') },
  ];

  return (
    <div className="h-full overflow-y-auto px-4 py-4">
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
        <div className="bg-gradient-to-br from-banana-gold/20 via-black/60 to-black/80 backdrop-blur-2xl rounded-2xl border border-banana-gold/20 p-5 mb-4">
          <p className="text-[10px] text-banana-gold uppercase tracking-widest mb-1">Total Balance</p>
          <AnimatedBalance value={dashboard.totalBalance} />
          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/10">
            <div><p className="text-[9px] text-white/40">Income</p><p className="text-green-400 text-sm font-medium">+{dashboard.income.toFixed(0)}</p></div>
            <div><p className="text-[9px] text-white/40">Expenses</p><p className="text-red-400 text-sm font-medium">-{dashboard.expenses.toFixed(0)}</p></div>
            <div><p className="text-[9px] text-white/40">Savings</p><p className="text-banana-gold text-sm font-medium">{dashboard.savings.toFixed(0)}</p></div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-5">
          {quickActions.map((a) => (
            <button key={a.label} type="button" onClick={() => { tap(); a.action(); }} className="bg-white/5 border border-white/10 rounded-xl py-3 flex flex-col items-center gap-1 hover:bg-white/10 transition-colors">
              <span className="text-lg">{a.icon}</span>
              <span className="text-[9px] text-white/60">{a.label}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 mb-5">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <p className="text-[9px] text-white/40 uppercase">Total Assets</p>
            <p className="text-white font-bold">{dashboard.totalAssets.toFixed(2)} BNA</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <p className="text-[9px] text-white/40 uppercase">Investments</p>
            <p className="text-white font-bold">{dashboard.investmentOverview.toFixed(2)} BNA</p>
          </div>
        </div>

        <p className="text-sm text-white font-medium mb-2">Recent Activity</p>
        {dashboard.recentActivity.length === 0 ? (
          <p className="text-white/40 text-xs text-center py-6">No transactions yet</p>
        ) : (
          dashboard.recentActivity.map((tx) => <TransactionItem key={tx.id} transaction={tx} />)
        )}
      </motion.div>
    </div>
  );
}
