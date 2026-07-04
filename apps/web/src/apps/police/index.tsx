'use client';

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usePoliceStore } from './store/policeStore';
import { policeService } from './services/policeService';
import { usePoliceRealtime } from './hooks/usePoliceRealtime';
import { PoliceTabBar } from './components/PoliceTabBar';
import { AlertPulse } from './components/AlertPulse';
import { DashboardScreen } from './screens/DashboardScreen';
import { MDTScreen } from './screens/MDTScreen';
import { ReportsScreen } from './screens/ReportsScreen';
import { RankingsScreen } from './screens/RankingsScreen';
import { OfficersScreen } from './screens/OfficersScreen';
import { DispatchScreen } from './screens/DispatchScreen';
import { CasesScreen } from './screens/CasesScreen';
import { VehiclesScreen } from './screens/VehiclesScreen';
import { ChatScreen } from './screens/ChatScreen';
import { AdminScreen } from './screens/AdminScreen';
import { useAuthStore } from '@/stores/authStore';
import { useHaptic } from '@/hooks/useSound';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/shared/Button';
import type { PoliceTab } from './types';

export function PoliceApp() {
  const { activeTab, setTab, setLoading, loading, setPermissions } = usePoliceStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin');
  const { tap } = useHaptic();
  const queryClient = useQueryClient();
  const [showMore, setShowMore] = useState(false);
  const [moreTab, setMoreTab] = useState<PoliceTab | null>(null);
  const [provisioning, setProvisioning] = useState(false);

  usePoliceRealtime();

  const { data: officer, isLoading: officerLoading } = useQuery({
    queryKey: ['police', 'me'],
    queryFn: () => policeService.getMe(),
    enabled: isAuthenticated,
    retry: false,
  });

  const { isLoading: dashLoading } = useQuery({
    queryKey: ['police', 'dashboard'],
    queryFn: () => policeService.getDashboard(),
    enabled: isAuthenticated && !!officer,
    retry: false,
  });

  useEffect(() => {
    if (isAuthenticated) {
      policeService.getPermissions().then(setPermissions).catch(() => {});
    }
  }, [isAuthenticated, setPermissions]);

  useEffect(() => {
    if (!officerLoading && isAuthenticated) setLoading(false);
  }, [officerLoading, isAuthenticated, setLoading]);

  const handleProvision = async () => {
    tap();
    setProvisioning(true);
    try {
      await policeService.provision();
      queryClient.invalidateQueries({ queryKey: ['police'] });
    } finally {
      setProvisioning(false);
    }
  };

  const effectiveTab = moreTab ?? activeTab;

  const renderScreen = () => {
    switch (effectiveTab) {
      case 'dashboard': return <DashboardScreen />;
      case 'mdt': return <MDTScreen />;
      case 'reports': return <ReportsScreen />;
      case 'dispatch': return <DispatchScreen />;
      case 'cases': return <CasesScreen />;
      case 'officers': return <OfficersScreen />;
      case 'rankings': return <RankingsScreen />;
      case 'vehicles': return <VehiclesScreen />;
      case 'chat': return <ChatScreen />;
      case 'admin': return isAdmin ? <AdminScreen /> : null;
      default: return <DashboardScreen />;
    }
  };

  if (!isAuthenticated) {
    return <EmptyState icon="🚔" title="Sign In Required" description="Sign in to access the Police Department platform." />;
  }

  if (loading || officerLoading || (officer && dashLoading)) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-black gap-3">
        <div className="w-10 h-10 border-2 border-banana-gold border-t-transparent rounded-full animate-spin" />
        <p className="text-white/40 text-sm">Loading Police App...</p>
      </div>
    );
  }

  if (!officer) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center bg-black">
        <span className="text-5xl mb-4">🚔</span>
        <h2 className="text-white font-bold text-xl mb-2">Officer Registration</h2>
        <p className="text-white/50 text-sm mb-6">Register as a Banana City Police Department officer to access MDT, dispatch, and secure communications.</p>
        <Button label="Register as Officer" onClick={handleProvision} loading={provisioning} size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-black relative">
      <AlertPulse />

      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
        <div>
          <p className="text-banana-gold text-[10px] tracking-widest uppercase">Police</p>
          <p className="text-white/40 text-[9px]">Banana City Police Department</p>
        </div>
        {moreTab && (
          <button type="button" onClick={() => setMoreTab(null)} className="text-banana-gold text-xs">‹ Back</button>
        )}
      </div>

      <div className="flex-1 overflow-hidden">{renderScreen()}</div>

      {!moreTab && (
        <PoliceTabBar
          active={activeTab}
          onChange={(t) => { tap(); setTab(t); }}
          onMore={() => setShowMore(!showMore)}
        />
      )}

      {showMore && (
        <div className="absolute bottom-14 left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-white/10 p-3 z-10">
          <div className="grid grid-cols-3 gap-2">
            {[
              { tab: 'officers' as PoliceTab, icon: '👮', label: 'Officers' },
              { tab: 'rankings' as PoliceTab, icon: '🏅', label: 'Rankings' },
              { tab: 'vehicles' as PoliceTab, icon: '🚗', label: 'Vehicles' },
              { tab: 'chat' as PoliceTab, icon: '💬', label: 'Chat' },
              ...(isAdmin ? [{ tab: 'admin' as PoliceTab, icon: '⚙️', label: 'Admin' }] : []),
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

export { policeManifest } from './manifest';
