'use client';

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSimStore } from './store/simStore';
import { simService } from './services/simService';
import { useSimRealtime } from './hooks/useSimRealtime';
import { SimTabBar } from './components/SimTabBar';
import { HomeScreen } from './screens/HomeScreen';
import { NumbersScreen } from './screens/NumbersScreen';
import { SIMManagementScreen } from './screens/SIMManagementScreen';
import { CallSettingsScreen } from './screens/CallSettingsScreen';
import { SMSSettingsScreen } from './screens/SMSSettingsScreen';
import { NetworkScreen } from './screens/NetworkScreen';
import { SecurityScreen } from './screens/SecurityScreen';
import { NotificationsScreen } from './screens/NotificationsScreen';
import { AdminScreen } from './screens/AdminScreen';
import { useAuthStore } from '@/stores/authStore';
import { identityService } from '@/apps/identity/services/identityService';
import { useHaptic } from '@/hooks/useSound';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/shared/Button';
import type { SimTab } from './types';

export function SimApp() {
  const { activeTab, setTab, setLoading, loading } = useSimStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin');
  const { tap } = useHaptic();
  const queryClient = useQueryClient();
  const [showMore, setShowMore] = useState(false);
  const [moreTab, setMoreTab] = useState<SimTab | null>(null);
  const [needsIdentity, setNeedsIdentity] = useState(false);
  const [provisioning, setProvisioning] = useState(false);

  useSimRealtime();

  const { data: identity, isLoading: identityLoading } = useQuery({
    queryKey: ['identity', 'me'],
    queryFn: () => identityService.getMe(),
    enabled: isAuthenticated,
  });

  const { data: dashboard, isLoading: simLoading, refetch } = useQuery({
    queryKey: ['sim', 'dashboard'],
    queryFn: () => simService.getDashboard(),
    enabled: isAuthenticated && !!identity?.verified,
    retry: false,
  });

  const { data: notifications } = useQuery({
    queryKey: ['sim', 'notifications'],
    queryFn: () => simService.getNotifications(),
    enabled: isAuthenticated && !!dashboard,
    refetchInterval: 60000,
  });

  useEffect(() => {
    if (isAuthenticated) simService.initPermissions().catch(() => {});
  }, [isAuthenticated]);

  useEffect(() => {
    if (!identityLoading && isAuthenticated) {
      setNeedsIdentity(!identity?.verified);
      setLoading(false);
    }
  }, [identity, identityLoading, isAuthenticated, setLoading]);

  const handleProvision = async () => {
    tap();
    setProvisioning(true);
    try {
      await simService.provision();
      await refetch();
      queryClient.invalidateQueries({ queryKey: ['sim'] });
    } finally {
      setProvisioning(false);
    }
  };

  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;
  const effectiveTab = moreTab ?? activeTab;

  const renderScreen = () => {
    switch (effectiveTab) {
      case 'home': return <HomeScreen />;
      case 'numbers': return <NumbersScreen />;
      case 'sim': return <SIMManagementScreen />;
      case 'call': return <CallSettingsScreen />;
      case 'sms': return <SMSSettingsScreen />;
      case 'network': return <NetworkScreen />;
      case 'security': return <SecurityScreen />;
      case 'notifications': return <NotificationsScreen />;
      case 'admin': return isAdmin ? <AdminScreen /> : null;
      default: return <HomeScreen />;
    }
  };

  if (!isAuthenticated) return <EmptyState icon="📶" title="Sign In Required" description="Sign in to manage your Banana SIM." />;
  if (loading || identityLoading) return <div className="flex flex-col items-center justify-center h-full gap-3"><div className="w-10 h-10 border-2 border-banana-gold border-t-transparent rounded-full animate-spin" /><p className="text-white/40 text-sm">Loading Banana SIM...</p></div>;
  if (needsIdentity) return <EmptyState icon="🪪" title="Identity Required" description="A verified BananaOS Identity is required to activate your SIM profile." />;

  if (!simLoading && !dashboard) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center">
        <span className="text-5xl mb-4">📶</span>
        <h2 className="text-white font-bold text-xl mb-2">Activate Banana SIM</h2>
        <p className="text-white/50 text-sm mb-6">Get your unique phone number and network subscription on Banana Mobile.</p>
        <Button label="Activate SIM" onClick={handleProvision} loading={provisioning} size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-black relative">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
        <div>
          <p className="text-banana-gold text-[10px] tracking-widest uppercase">Banana SIM</p>
          <p className="text-white/40 text-[9px]">Official BananaOS Application</p>
        </div>
        {moreTab && <button type="button" onClick={() => setMoreTab(null)} className="text-banana-gold text-xs">‹ Back</button>}
      </div>
      <div className="flex-1 overflow-hidden">{renderScreen()}</div>
      {!moreTab && (
        <SimTabBar active={activeTab} onChange={(t) => { tap(); setTab(t); }} onMore={() => setShowMore(!showMore)} unreadCount={unreadCount} />
      )}
      {showMore && (
        <div className="absolute bottom-14 left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-white/10 p-3 z-10">
          <div className="grid grid-cols-3 gap-2">
            {[
              { tab: 'sms' as SimTab, icon: '💬', label: 'SMS' },
              { tab: 'security' as SimTab, icon: '🔒', label: 'Security' },
              { tab: 'notifications' as SimTab, icon: '🔔', label: 'Alerts' },
              ...(isAdmin ? [{ tab: 'admin' as SimTab, icon: '⚙️', label: 'Admin' }] : []),
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

export { simManifest } from './manifest';
