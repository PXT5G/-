'use client';

import { type ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useBankInit, useBankSocketSync, useBankDashboard, useBankAccounts,
  useBankCards, useBankTransactions, useBankBudget, useBankAnalytics,
  useFreezeCard, useInternalTransfer,
} from '@/hooks/useBank';
import { useHaptic } from '@/hooks/useSound';
import { cn } from '@/utils/cn';

type Tab = 'home' | 'accounts' | 'cards' | 'transactions' | 'transfer' | 'budget' | 'analytics';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'accounts', label: 'Accounts', icon: '💳' },
  { id: 'cards', label: 'Cards', icon: '🪪' },
  { id: 'transactions', label: 'History', icon: '📋' },
  { id: 'transfer', label: 'Transfer', icon: '↔️' },
  { id: 'budget', label: 'Budget', icon: '📊' },
  { id: 'analytics', label: 'Analytics', icon: '📈' },
];

function GlassCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md', className)}>
      {children}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center h-48">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        className="w-8 h-8 border-2 border-gulf-gold border-t-transparent rounded-full" />
    </div>
  );
}

function HomeTab() {
  const { data, isLoading } = useBankDashboard();
  if (isLoading) return <LoadingState />;
  if (!data) return null;
  return (
    <div className="space-y-4 p-4">
      <GlassCard className="p-6 text-center">
        <p className="text-sm text-white/50 uppercase tracking-wide">Total Balance</p>
        <p className="text-4xl font-bold text-gulf-gold mt-1">{data.totalBalance.toLocaleString()} GULF</p>
        <p className="text-xs text-white/40 mt-2">{data.accountCount} accounts · {data.activeCards} active cards</p>
      </GlassCard>
      <div className="grid grid-cols-2 gap-3">
        <GlassCard className="p-4 text-center">
          <p className="text-lg font-bold text-white">{data.monthlySpending.toLocaleString()}</p>
          <p className="text-[10px] text-white/50 uppercase">Monthly Spending</p>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <p className="text-lg font-bold text-white">{data.cardCount}</p>
          <p className="text-[10px] text-white/50 uppercase">Cards</p>
        </GlassCard>
      </div>
      <GlassCard className="p-4">
        <h3 className="text-sm font-semibold text-white/70 mb-3">Recent Transactions</h3>
        {data.recentTransactions.length === 0 ? (
          <p className="text-xs text-white/40">No transactions yet</p>
        ) : (
          <div className="space-y-2">
            {data.recentTransactions.slice(0, 5).map((t) => (
              <div key={t.transactionId} className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-white">{t.description}</p>
                  <p className="text-[10px] text-white/40">{t.type}</p>
                </div>
                <p className={cn('text-sm font-medium', t.type.includes('in') || t.type === 'deposit' ? 'text-green-400' : 'text-red-400')}>
                  {t.type.includes('in') || t.type === 'deposit' ? '+' : '-'}{t.amount.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}

function AccountsTab() {
  const { data, isLoading } = useBankAccounts();
  if (isLoading) return <LoadingState />;
  return (
    <div className="space-y-3 p-4">
      {(data ?? []).map((a) => (
        <GlassCard key={a.accountId} className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold text-white">{a.name}</p>
              <p className="text-xs text-white/40 capitalize">{a.accountType}</p>
              <p className="text-[10px] text-white/30 mt-1 font-mono">{a.iban}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-gulf-gold">{a.availableBalance.toLocaleString()}</p>
              <p className="text-[10px] text-white/40">{a.currency}</p>
              {a.isPrimary && <span className="text-[10px] text-gulf-gold">Primary</span>}
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}

function CardsTab() {
  const { data, isLoading } = useBankCards();
  const freezeCard = useFreezeCard();
  const { tap } = useHaptic();
  if (isLoading) return <LoadingState />;
  return (
    <div className="space-y-3 p-4">
      {(data ?? []).map((c) => (
        <GlassCard key={c.cardId} className={cn('p-4', c.status === 'frozen' && 'border-blue-400/50')}>
          <div className="flex justify-between items-center">
            <div>
              <p className="font-semibold text-white capitalize">{c.cardType} Card</p>
              <p className="text-lg font-mono text-white/80">•••• {c.lastFour}</p>
              <p className="text-xs text-white/40">{c.expiryMonth}/{c.expiryYear} · {c.holderName}</p>
            </div>
            <div className="text-right space-y-2">
              <span className={cn('text-xs px-2 py-0.5 rounded-full',
                c.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400')}>
                {c.status}
              </span>
              {c.status === 'active' && (
                <button
                  onClick={() => { tap(); freezeCard.mutate(c.cardId); }}
                  className="block text-xs text-red-400 hover:text-red-300"
                >
                  Freeze
                </button>
              )}
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}

function TransactionsTab() {
  const { data, isLoading } = useBankTransactions({ limit: 30 });
  if (isLoading) return <LoadingState />;
  const txns = data?.transactions ?? [];
  return (
    <div className="space-y-2 p-4">
      {txns.length === 0 ? (
        <p className="text-center text-white/40 text-sm py-8">No transactions</p>
      ) : txns.map((t) => (
        <GlassCard key={t.transactionId} className="p-3 flex justify-between items-center">
          <div>
            <p className="text-sm text-white">{t.description}</p>
            <p className="text-[10px] text-white/40">{new Date(t.createdAt).toLocaleDateString()}</p>
          </div>
          <p className={cn('font-medium', t.type.includes('in') || t.type === 'deposit' ? 'text-green-400' : 'text-white')}>
            {t.type.includes('in') || t.type === 'deposit' ? '+' : '-'}{t.amount.toLocaleString()}
          </p>
        </GlassCard>
      ))}
    </div>
  );
}

function TransferTab() {
  const { data: accounts } = useBankAccounts();
  const transfer = useInternalTransfer();
  const { tap } = useHaptic();
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const handleTransfer = () => {
    if (!fromId || !toId || !amount) return;
    tap();
    transfer.mutate({ fromAccountId: fromId, toAccountId: toId, amount: parseFloat(amount), description: description || 'Transfer' });
  };

  return (
    <div className="space-y-4 p-4">
      <GlassCard className="p-4 space-y-3">
        <select value={fromId} onChange={(e) => setFromId(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm">
          <option value="">From Account</option>
          {(accounts ?? []).map((a) => <option key={a.accountId} value={a.accountId}>{a.name} ({a.availableBalance.toLocaleString()})</option>)}
        </select>
        <select value={toId} onChange={(e) => setToId(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm">
          <option value="">To Account</option>
          {(accounts ?? []).filter((a) => a.accountId !== fromId).map((a) => <option key={a.accountId} value={a.accountId}>{a.name}</option>)}
        </select>
        <input type="number" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm" />
        <input type="text" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm" />
        <button onClick={handleTransfer} disabled={transfer.isPending}
          className="w-full py-3 rounded-xl bg-gulf-gold text-black font-semibold text-sm disabled:opacity-50">
          {transfer.isPending ? 'Processing...' : 'Transfer'}
        </button>
        {transfer.isSuccess && <p className="text-green-400 text-xs text-center">Transfer completed</p>}
      </GlassCard>
    </div>
  );
}

function BudgetTab() {
  const { data, isLoading } = useBankBudget();
  if (isLoading) return <LoadingState />;
  const budget = data as { totalSpent?: number; categories?: { category: string; spent: number }[] } | undefined;
  return (
    <div className="space-y-4 p-4">
      <GlassCard className="p-4 text-center">
        <p className="text-sm text-white/50">Total Spent This Month</p>
        <p className="text-2xl font-bold text-white">{(budget?.totalSpent ?? 0).toLocaleString()} GULF</p>
      </GlassCard>
      <div className="space-y-2">
        {(budget?.categories ?? []).filter((c) => c.spent > 0).map((c) => (
          <GlassCard key={c.category} className="p-3 flex justify-between">
            <span className="text-sm text-white capitalize">{c.category.replace('_', ' ')}</span>
            <span className="text-sm text-gulf-gold">{c.spent.toLocaleString()}</span>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

function AnalyticsTab() {
  const { data, isLoading } = useBankAnalytics();
  if (isLoading) return <LoadingState />;
  const analytics = data as { totalBalance?: number; monthlyIncome?: number; monthlyExpenses?: number; cashFlow?: number } | undefined;
  return (
    <div className="grid grid-cols-2 gap-3 p-4">
      <GlassCard className="p-4 text-center col-span-2">
        <p className="text-xs text-white/50">Cash Flow (30 days)</p>
        <p className={cn('text-2xl font-bold', (analytics?.cashFlow ?? 0) >= 0 ? 'text-green-400' : 'text-red-400')}>
          {(analytics?.cashFlow ?? 0).toLocaleString()} GULF
        </p>
      </GlassCard>
      <GlassCard className="p-4 text-center">
        <p className="text-xs text-white/50">Income</p>
        <p className="text-lg font-bold text-green-400">{(analytics?.monthlyIncome ?? 0).toLocaleString()}</p>
      </GlassCard>
      <GlassCard className="p-4 text-center">
        <p className="text-xs text-white/50">Expenses</p>
        <p className="text-lg font-bold text-red-400">{(analytics?.monthlyExpenses ?? 0).toLocaleString()}</p>
      </GlassCard>
    </div>
  );
}

export function BankApp() {
  const [tab, setTab] = useState<Tab>('home');
  const { tap } = useHaptic();
  useBankInit();
  useBankSocketSync();

  const renderTab = () => {
    switch (tab) {
      case 'home': return <HomeTab />;
      case 'accounts': return <AccountsTab />;
      case 'cards': return <CardsTab />;
      case 'transactions': return <TransactionsTab />;
      case 'transfer': return <TransferTab />;
      case 'budget': return <BudgetTab />;
      case 'analytics': return <AnalyticsTab />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#0a1628] to-[#1a1a2e] text-white">
      <header className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold text-gulf-gold">GULF Bank</h1>
      </header>
      <main className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {renderTab()}
          </motion.div>
        </AnimatePresence>
      </main>
      <nav className="flex border-t border-white/10 bg-black/30 backdrop-blur-md overflow-x-auto">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => { tap(); setTab(t.id); }}
            className={cn('flex-1 min-w-[60px] py-2 flex flex-col items-center gap-0.5 text-[10px]',
              tab === t.id ? 'text-gulf-gold' : 'text-white/40')}>
            <span className="text-base">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
