'use client';

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useBankStore } from './store/bankStore';
import { bankService } from './services/bankService';
import { useBankRealtime } from './hooks/useBankRealtime';
import { BankTabBar } from './components/BankTabBar';
import { DashboardScreen } from './screens/DashboardScreen';
import { AccountsScreen } from './screens/AccountsScreen';
import { CardsScreen } from './screens/CardsScreen';
import { TransferScreen } from './screens/TransferScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { AnalyticsScreen } from './screens/AnalyticsScreen';
import { PaymentsScreen } from './screens/PaymentsScreen';
import { SecurityScreen } from './screens/SecurityScreen';
import { NotificationsScreen } from './screens/NotificationsScreen';
import { AdminScreen } from './screens/AdminScreen';
import { useAuthStore } from '@/stores/authStore';
import { identityService } from '@/apps/identity/services/identityService';
import { useHaptic } from '@/hooks/useSound';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/shared/Button';
import type { BankTab } from './types';

export function BankApp() {
  const { activeTab, setTab, setLoading, loading } = useBankStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin');
  const { tap } = useHaptic();
  const queryClient = useQueryClient();
  const [showMore, setShowMore] = useState(false);
  const [moreTab, setMoreTab] = useState<BankTab | null>(null);
  const [needsIdentity, setNeedsIdentity] = useState(false);
  const [provisioning, setProvisioning] = useState(false);

  useBankRealtime();

  const { data: identity, isLoading: identityLoading } = useQuery({
    queryKey: ['identity', 'me'],
    queryFn: () => identityService.getMe(),
    enabled: isAuthenticated,
  });

  const { data: dashboard, isLoading: bankLoading, refetch } = useQuery({
    queryKey: ['bank', 'dashboard'],
    queryFn: () => bankService.getDashboard(),
    enabled: isAuthenticated && !!identity?.verified,
  });

  const { data: notifications } = useQuery({
    queryKey: ['bank', 'notifications'],
    queryFn: () => bankService.getNotifications(),
    enabled: isAuthenticated && !!dashboard,
    refetchInterval: 60000,
  });

  useEffect(() => {
    if (!identityLoading && isAuthenticated) {
      if (!identity) {
        setNeedsIdentity(true);
      } else if (!identity.verified) {
        setNeedsIdentity(true);
      } else {
        setNeedsIdentity(false);
      }
      setLoading(false);
    }
  }, [identity, identityLoading, isAuthenticated, setLoading]);

  const handleProvision = async () => {
    tap();
    setProvisioning(true);
    try {
      await bankService.provision();
      await refetch();
      queryClient.invalidateQueries({ queryKey: ['bank'] });
    } finally {
      setProvisioning(false);
    }
  };

  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;
  const effectiveTab = moreTab ?? activeTab;

  const renderScreen = () => {
    switch (effectiveTab) {
      case 'home': return <DashboardScreen onTransfer={() => setTab('transfer')} onDeposit={() => setTab('payments')} />;
      case 'accounts': return <AccountsScreen />;
      case 'cards': return <CardsScreen />;
      case 'transfer': return <TransferScreen />;
      case 'history': return <HistoryScreen />;
      case 'analytics': return <AnalyticsScreen />;
      case 'payments': return <PaymentsScreen />;
      case 'security': return <SecurityScreen />;
      case 'notifications': return <NotificationsScreen />;
      case 'admin': return isAdmin ? <AdminScreen /> : null;
      default: return <DashboardScreen onTransfer={() => setTab('transfer')} onDeposit={() => setTab('payments')} />;
    }
  };

  if (!isAuthenticated) {
    return <EmptyState icon="🏦" title="Sign In Required" description="Sign in to access Banana Bank." />;
  }

  if (loading || identityLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-black gap-3">
        <div className="w-10 h-10 border-2 border-banana-gold border-t-transparent rounded-full animate-spin" />
        <p className="text-white/40 text-sm">Loading Banana Bank...</p>
      </div>
    );
  }

  if (needsIdentity) {
    return (
      <EmptyState
        icon="🪪"
        title="Identity Required"
        description="A verified BananaOS Identity is required to open a bank account. Complete your identity verification first."
      />
    );
  }

  if (!bankLoading && dashboard?.accountCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center">
        <span className="text-5xl mb-4">🏦</span>
        <h2 className="text-white font-bold text-xl mb-2">Open Your Bank Account</h2>
        <p className="text-white/50 text-sm mb-6">Your verified identity qualifies you for a secure Banana Bank account with welcome bonus.</p>
        <Button label="Open Account" onClick={handleProvision} loading={provisioning} size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-black relative">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
        <div>
          <p className="text-banana-gold text-[10px] tracking-widest uppercase">Banana Bank</p>
          <p className="text-white/40 text-[9px]">Verified by BananaOS</p>
        </div>
        {moreTab && (
          <button type="button" onClick={() => setMoreTab(null)} className="text-banana-gold text-xs">‹ Back</button>
        )}
      </div>

      <div className="flex-1 overflow-hidden">{renderScreen()}</div>

      {!moreTab && (
        <BankTabBar
          active={activeTab}
          onChange={(t) => { tap(); setTab(t); }}
          unreadCount={unreadCount}
          onMore={() => setShowMore(!showMore)}
        />
      )}

      {showMore && (
        <div className="absolute bottom-14 left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-white/10 p-3 z-10">
          <div className="grid grid-cols-3 gap-2">
            {[
              { tab: 'payments' as BankTab, icon: '💸', label: 'Payments' },
              { tab: 'security' as BankTab, icon: '🔒', label: 'Security' },
              { tab: 'notifications' as BankTab, icon: '🔔', label: 'Alerts' },
              ...(isAdmin ? [{ tab: 'admin' as BankTab, icon: '⚙️', label: 'Admin' }] : []),
            ].map((item) => (
              <button key={item.tab} type="button" onClick={() => { tap(); setMoreTab(item.tab); setShowMore(false); }} className="bg-white/5 rounded-xl py-3 flex flex-col items-center gap-1 border border-white/10">
                <span>{item.icon}</span>
                <span className="text-[9px] text-white/60">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export { bankManifest } from './manifest';
