'use client';

import { type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useBusinessInit, useBusinessSocketSync, useBusinessDashboard,
  useBusinessAnalytics, useBusinessEmployees, useBusinessInventory,
  useBusinessFinance, useBusinessCustomers, useBusinessSuppliers,
  useBusinessBranches, useBusinessReports, useBusinessSettings,
  useBusinessCompanies, useBusinessAttendance,
} from '@/hooks/useBusiness';
import { useBusinessStore } from '@/stores/businessStore';
import { useHaptic } from '@/hooks/useSound';
import { cn } from '@/utils/cn';

type Tab = 'dashboard' | 'analytics' | 'employees' | 'inventory' | 'finance' | 'customers' | 'suppliers' | 'reports' | 'branches' | 'settings';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Home', icon: '📊' },
  { id: 'analytics', label: 'Analytics', icon: '📈' },
  { id: 'employees', label: 'Staff', icon: '👥' },
  { id: 'inventory', label: 'Stock', icon: '📦' },
  { id: 'finance', label: 'Finance', icon: '💰' },
  { id: 'customers', label: 'Clients', icon: '🤝' },
  { id: 'suppliers', label: 'Supply', icon: '🚚' },
  { id: 'reports', label: 'Reports', icon: '📋' },
  { id: 'branches', label: 'Branches', icon: '🏪' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

const STATUS_COLORS: Record<string, string> = {
  active: 'text-green-400', pending: 'text-amber-400', suspended: 'text-red-400',
  under_inspection: 'text-orange-400', closed: 'text-gray-400', dissolved: 'text-gray-500',
};

function GlassCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md', className)}>
      {children}
    </div>
  );
}

function StatBox({ label, value, prefix, alert }: { label: string; value: number | string; prefix?: string; alert?: boolean }) {
  return (
    <GlassCard className={cn('p-3 text-center', alert && 'border-red-500/50')}>
      <p className={cn('text-xl font-bold', alert ? 'text-red-400' : 'text-gulf-gold')}>
        {prefix}{typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      <p className="text-[10px] text-white/50 uppercase tracking-wide">{label}</p>
    </GlassCard>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center h-64">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        className="w-8 h-8 border-2 border-gulf-gold border-t-transparent rounded-full" />
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <GlassCard className="p-6 m-4 text-center">
      <p className="text-red-400 text-sm">{message}</p>
    </GlassCard>
  );
}

function NoCompany({ onSelect }: { onSelect?: () => void }) {
  return (
    <GlassCard className="p-8 m-4 text-center">
      <p className="text-4xl mb-3">🏢</p>
      <p className="text-white font-semibold mb-1">No Company Selected</p>
      <p className="text-white/50 text-sm mb-4">Register or select a company to manage your business.</p>
      {onSelect && (
        <button type="button" onClick={onSelect}
          className="px-4 py-2 bg-gulf-gold text-black rounded-xl text-sm font-medium">
          View Companies
        </button>
      )}
    </GlassCard>
  );
}

function DashboardView({ companyId }: { companyId: string }) {
  const { data, isLoading, error } = useBusinessDashboard(companyId);
  const attendance = useBusinessAttendance();
  const { tap } = useHaptic();

  if (isLoading) return <LoadingState />;
  if (error || !data) return <ErrorState message="Failed to load dashboard" />;

  const company = data.company as Record<string, unknown>;
  const stats = data.stats;
  const bank = data.bank as Record<string, unknown>;

  return (
    <div className="p-4 space-y-4">
      <GlassCard className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-gulf-gold text-xs font-semibold uppercase tracking-wider">Company</p>
            <p className="text-white text-lg font-bold">{String(company.name)}</p>
            <p className="text-white/50 text-sm">{String(company.tradeName)} · {String(company.category).replace(/_/g, ' ')}</p>
          </div>
          <span className={cn('text-xs font-medium capitalize', STATUS_COLORS[String(company.status)] ?? 'text-white/60')}>
            {String(company.status).replace(/_/g, ' ')}
          </span>
        </div>
        <div className="mt-3 pt-3 border-t border-white/10">
          <p className="text-white/40 text-xs">IBAN</p>
          <p className="text-white/80 text-sm font-mono">{String(bank.iban ?? company.iban)}</p>
        </div>
      </GlassCard>

      <div className="grid grid-cols-3 gap-2">
        <StatBox label="Balance" value={Number(bank.availableBalance ?? 0)} prefix="₴ " />
        <StatBox label="Revenue" value={stats.monthlyRevenue} prefix="₴ " />
        <StatBox label="Profit" value={stats.profit} prefix="₴ " alert={stats.profit < 0} />
        <StatBox label="Employees" value={stats.employees} />
        <StatBox label="Customers" value={stats.customers} />
        <StatBox label="Inventory" value={stats.inventoryValue} prefix="₴ " />
      </div>

      <GlassCard className="p-4">
        <h3 className="text-white/60 text-xs uppercase mb-3">Quick Actions</h3>
        <div className="flex gap-2">
          {(['check_in', 'check_out'] as const).map((type) => (
            <button key={type} type="button"
              onClick={() => { tap(); attendance.mutate({ companyId, type }); }}
              className="flex-1 py-2 rounded-xl text-xs font-medium bg-white/10 text-white capitalize hover:bg-gulf-gold hover:text-black transition-colors">
              {type.replace('_', ' ')}
            </button>
          ))}
        </div>
      </GlassCard>

      <div className="grid grid-cols-2 gap-2">
        <StatBox label="Daily Rev" value={stats.dailyRevenue ?? 0} prefix="₴ " />
        <StatBox label="Yearly Rev" value={stats.yearlyRevenue ?? 0} prefix="₴ " />
      </div>
    </div>
  );
}

function AnalyticsView({ companyId }: { companyId: string }) {
  const { data, isLoading, error } = useBusinessAnalytics(companyId);
  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message="Failed to load analytics" />;
  const a = (data ?? {}) as Record<string, unknown>;

  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <StatBox label="Daily" value={Number(a.dailyRevenue ?? 0)} prefix="₴ " />
        <StatBox label="Weekly" value={Number(a.weeklyRevenue ?? 0)} prefix="₴ " />
        <StatBox label="Monthly" value={Number(a.monthlyRevenue ?? 0)} prefix="₴ " />
        <StatBox label="Yearly" value={Number(a.yearlyRevenue ?? 0)} prefix="₴ " />
        <StatBox label="Profit" value={Number(a.profit ?? 0)} prefix="₴ " />
        <StatBox label="Growth" value={`${Number(a.growth ?? 0).toFixed(1)}%`} />
      </div>

      <GlassCard className="p-4">
        <h3 className="text-white/60 text-xs uppercase mb-3">Top Products</h3>
        {((a.topProducts as Record<string, unknown>[]) ?? []).length === 0 ? (
          <p className="text-white/40 text-sm">No product data yet</p>
        ) : (
          ((a.topProducts as Record<string, unknown>[]) ?? []).map((p) => (
            <div key={String(p.productId)} className="flex justify-between py-2 border-b border-white/5 last:border-0">
              <span className="text-white text-sm">{String(p.name)}</span>
              <span className="text-gulf-gold text-sm">₴ {Number(p.revenue).toLocaleString()}</span>
            </div>
          ))
        )}
      </GlassCard>

      <GlassCard className="p-4">
        <h3 className="text-white/60 text-xs uppercase mb-3">Top Employees</h3>
        {((a.topEmployees as Record<string, unknown>[]) ?? []).map((e) => (
          <div key={String(e.employeeId)} className="flex justify-between py-2 border-b border-white/5 last:border-0">
            <span className="text-white text-sm">{String(e.name)}</span>
            <span className="text-white/60 text-sm">Score: {Number(e.revenue)}</span>
          </div>
        ))}
      </GlassCard>
    </div>
  );
}

function ListView({ title, items, renderItem }: { title: string; items: Record<string, unknown>[]; renderItem: (item: Record<string, unknown>) => ReactNode }) {
  return (
    <div className="p-4 space-y-3">
      <h2 className="text-white/60 text-xs uppercase tracking-wider">{title}</h2>
      {items.length === 0 ? (
        <GlassCard className="p-6 text-center"><p className="text-white/40 text-sm">No records yet</p></GlassCard>
      ) : (
        items.map((item, i) => (
          <motion.div key={String(item.id ?? item.employeeId ?? item.customerId ?? item.supplierId ?? item.branchId ?? item.inventoryId ?? i)}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
            <GlassCard className="p-3">{renderItem(item)}</GlassCard>
          </motion.div>
        ))
      )}
    </div>
  );
}

function EmployeesView({ companyId }: { companyId: string }) {
  const { data, isLoading } = useBusinessEmployees(companyId);
  if (isLoading) return <LoadingState />;
  return (
    <ListView title={`Employees (${(data ?? []).length})`} items={(data ?? []) as Record<string, unknown>[]}
      renderItem={(e) => (
        <div className="flex justify-between items-center">
          <div>
            <p className="text-white text-sm font-medium">{String(e.displayName ?? e.jobTitle)}</p>
            <p className="text-white/50 text-xs">{String(e.role)} · {String(e.rank)}</p>
          </div>
          <span className="text-xs text-white/60 capitalize">{String(e.status)}</span>
        </div>
      )} />
  );
}

function InventoryView({ companyId }: { companyId: string }) {
  const { data, isLoading } = useBusinessInventory(companyId);
  if (isLoading) return <LoadingState />;
  return (
    <ListView title={`Inventory (${(data ?? []).length})`} items={(data ?? []) as Record<string, unknown>[]}
      renderItem={(item) => (
        <div className="flex justify-between items-center">
          <div>
            <p className="text-white text-sm font-medium">{String(item.name)}</p>
            <p className="text-white/50 text-xs">SKU: {String(item.sku)}</p>
          </div>
          <div className="text-right">
            <p className="text-gulf-gold text-sm">{Number(item.stockQuantity)} units</p>
            <p className="text-white/40 text-xs">₴ {Number(item.sellingPrice).toLocaleString()}</p>
          </div>
        </div>
      )} />
  );
}

function FinanceView({ companyId }: { companyId: string }) {
  const { data, isLoading } = useBusinessFinance(companyId);
  if (isLoading) return <LoadingState />;
  const bank = (data?.bank ?? {}) as Record<string, unknown>;

  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <StatBox label="Available" value={Number(bank.availableBalance ?? 0)} prefix="₴ " />
        <StatBox label="Frozen" value={Number(bank.frozenBalance ?? 0)} prefix="₴ " />
        <StatBox label="Payroll Acct" value={Number(bank.payrollAccountBalance ?? 0)} prefix="₴ " />
        <StatBox label="Tax Acct" value={Number(bank.taxAccountBalance ?? 0)} prefix="₴ " />
      </div>

      <GlassCard className="p-4">
        <h3 className="text-white/60 text-xs uppercase mb-3">Recent Revenue</h3>
        {((data?.revenue ?? []) as Record<string, unknown>[]).slice(0, 5).map((r) => (
          <div key={String(r.revenueId)} className="flex justify-between py-2 border-b border-white/5 last:border-0">
            <span className="text-white text-sm">{String(r.source)}</span>
            <span className="text-green-400 text-sm">+₴ {Number(r.amount).toLocaleString()}</span>
          </div>
        ))}
      </GlassCard>

      <GlassCard className="p-4">
        <h3 className="text-white/60 text-xs uppercase mb-3">Recent Expenses</h3>
        {((data?.expenses ?? []) as Record<string, unknown>[]).slice(0, 5).map((e) => (
          <div key={String(e.expenseId)} className="flex justify-between py-2 border-b border-white/5 last:border-0">
            <span className="text-white text-sm">{String(e.category)}</span>
            <span className="text-red-400 text-sm">-₴ {Number(e.amount).toLocaleString()}</span>
          </div>
        ))}
      </GlassCard>
    </div>
  );
}

function CustomersView({ companyId }: { companyId: string }) {
  const { data, isLoading } = useBusinessCustomers(companyId);
  if (isLoading) return <LoadingState />;
  return (
    <ListView title={`Customers (${(data ?? []).length})`} items={(data ?? []) as Record<string, unknown>[]}
      renderItem={(c) => (
        <div className="flex justify-between items-center">
          <div>
            <p className="text-white text-sm font-medium">{String(c.name)}</p>
            <p className="text-white/50 text-xs">{String(c.email ?? c.phone ?? '')}</p>
          </div>
          <div className="text-right">
            <p className="text-gulf-gold text-sm">₴ {Number(c.totalSpent).toLocaleString()}</p>
            {Boolean(c.isBlacklisted) && <p className="text-red-400 text-xs">Blacklisted</p>}
          </div>
        </div>
      )} />
  );
}

function SuppliersView({ companyId }: { companyId: string }) {
  const { data, isLoading } = useBusinessSuppliers(companyId);
  if (isLoading) return <LoadingState />;
  return (
    <ListView title={`Suppliers (${(data ?? []).length})`} items={(data ?? []) as Record<string, unknown>[]}
      renderItem={(s) => (
        <div className="flex justify-between items-center">
          <div>
            <p className="text-white text-sm font-medium">{String(s.name)}</p>
            <p className="text-white/50 text-xs">{String(s.category)}</p>
          </div>
          <span className="text-xs text-white/60 capitalize">{String(s.status)}</span>
        </div>
      )} />
  );
}

function ReportsView({ companyId }: { companyId: string }) {
  const { data, isLoading } = useBusinessReports(companyId);
  if (isLoading) return <LoadingState />;
  const r = (data ?? {}) as Record<string, unknown>;

  return (
    <div className="p-4 space-y-4">
      <GlassCard className="p-4">
        <h3 className="text-gulf-gold text-xs font-semibold uppercase mb-3">Financial Statement</h3>
        <div className="space-y-2">
          {[
            ['Revenue', r.revenue, 'text-green-400'],
            ['Expenses', r.expenses, 'text-red-400'],
            ['Net Profit', r.netProfit, 'text-gulf-gold'],
            ['Payroll', r.payroll, 'text-white/70'],
            ['Taxes Paid', r.taxes, 'text-white/70'],
            ['Assets', r.assets, 'text-white/70'],
            ['Loans', r.loans, 'text-amber-400'],
            ['Cash Flow', r.cashFlow, 'text-green-400'],
          ].map(([label, val, color]) => (
            <div key={String(label)} className="flex justify-between">
              <span className="text-white/60 text-sm">{String(label)}</span>
              <span className={cn('text-sm font-medium', String(color))}>₴ {Number(val ?? 0).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

function BranchesView({ companyId }: { companyId: string }) {
  const { data, isLoading } = useBusinessBranches(companyId);
  if (isLoading) return <LoadingState />;
  return (
    <ListView title={`Branches (${(data ?? []).length})`} items={(data ?? []) as Record<string, unknown>[]}
      renderItem={(b) => (
        <div>
          <div className="flex justify-between items-center">
            <p className="text-white text-sm font-medium">{String(b.name)}</p>
            {Boolean(b.isHeadquarters) && <span className="text-gulf-gold text-xs">HQ</span>}
          </div>
          <p className="text-white/50 text-xs mt-1">{String(b.address)}, {String(b.city)}</p>
          <p className="text-white/40 text-xs">{String(b.phone)} · {Number(b.employeeCount)} staff</p>
        </div>
      )} />
  );
}

function SettingsView({ companyId }: { companyId: string }) {
  const { data, isLoading } = useBusinessSettings(companyId);
  if (isLoading) return <LoadingState />;
  const s = (data ?? {}) as Record<string, unknown>;
  const categories = (s.availableCategories as string[]) ?? [];

  return (
    <div className="p-4 space-y-4">
      <GlassCard className="p-4">
        <h3 className="text-white/60 text-xs uppercase mb-3">Business Categories</h3>
        <div className="flex flex-wrap gap-1">
          {categories.map((cat) => (
            <span key={cat} className="px-2 py-1 rounded-lg bg-white/10 text-white/70 text-xs capitalize">
              {cat.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      </GlassCard>
      <GlassCard className="p-4">
        <h3 className="text-white/60 text-xs uppercase mb-3">Company Categories</h3>
        <div className="flex flex-wrap gap-1">
          {((s.categories as string[]) ?? []).map((cat) => (
            <span key={cat} className="px-2 py-1 rounded-lg bg-gulf-gold/20 text-gulf-gold text-xs capitalize">
              {cat.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

function CompanySelector() {
  const companies = useBusinessStore((s) => s.companies);
  const activeCompanyId = useBusinessStore((s) => s.activeCompanyId);
  const setActiveCompany = useBusinessStore((s) => s.setActiveCompany);
  const { tap } = useHaptic();

  if (companies.length <= 1) return null;

  return (
    <div className="px-4 pt-3 flex gap-2 overflow-x-auto scrollbar-hide">
      {companies.map((c) => (
        <button key={c.companyId} type="button"
          onClick={() => { tap(); setActiveCompany(c.companyId); }}
          className={cn(
            'flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors',
            activeCompanyId === c.companyId ? 'bg-gulf-gold text-black' : 'bg-white/10 text-white/70'
          )}>
          {c.tradeName || c.name}
        </button>
      ))}
    </div>
  );
}

export function BusinessApp() {
  useBusinessInit();
  useBusinessSocketSync();
  useBusinessCompanies();

  const activeTab = useBusinessStore((s) => s.activeTab);
  const setActiveTab = useBusinessStore((s) => s.setActiveTab);
  const activeCompanyId = useBusinessStore((s) => s.activeCompanyId);
  const { tap } = useHaptic();

  const renderTab = () => {
    if (!activeCompanyId) return <NoCompany />;
    switch (activeTab) {
      case 'dashboard': return <DashboardView companyId={activeCompanyId} />;
      case 'analytics': return <AnalyticsView companyId={activeCompanyId} />;
      case 'employees': return <EmployeesView companyId={activeCompanyId} />;
      case 'inventory': return <InventoryView companyId={activeCompanyId} />;
      case 'finance': return <FinanceView companyId={activeCompanyId} />;
      case 'customers': return <CustomersView companyId={activeCompanyId} />;
      case 'suppliers': return <SuppliersView companyId={activeCompanyId} />;
      case 'reports': return <ReportsView companyId={activeCompanyId} />;
      case 'branches': return <BranchesView companyId={activeCompanyId} />;
      case 'settings': return <SettingsView companyId={activeCompanyId} />;
      default: return <DashboardView companyId={activeCompanyId} />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-[#0a1628] via-[#0d1f3c] to-[#0a1628] text-white overflow-hidden">
      <div className="flex-shrink-0 pt-2 pb-1 px-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏢</span>
          <div>
            <h1 className="text-base font-bold text-gulf-gold">GULF Business</h1>
            <p className="text-[10px] text-white/40 uppercase tracking-widest">Enterprise Platform</p>
          </div>
        </div>
      </div>

      <CompanySelector />

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div key={`${activeTab}-${activeCompanyId}`}
            initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}>
            {renderTab()}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex-shrink-0 border-t border-white/10 bg-black/30 backdrop-blur-md">
        <div className="flex overflow-x-auto scrollbar-hide px-1 py-2 gap-0.5">
          {TABS.map((tab) => (
            <button key={tab.id} type="button"
              onClick={() => { tap(); setActiveTab(tab.id); }}
              className={cn(
                'flex-shrink-0 flex flex-col items-center px-2 py-1 rounded-xl min-w-[52px] transition-colors',
                activeTab === tab.id ? 'bg-gulf-gold/20 text-gulf-gold' : 'text-white/50 hover:text-white/80'
              )}>
              <span className="text-base">{tab.icon}</span>
              <span className="text-[9px] mt-0.5">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
