'use client';

import { useControlStore } from './store/controlStore';
import { useControlRealtime } from './hooks/useControlRealtime';
import { ControlTabBar } from './components/ControlTabBar';
import { DashboardScreen } from './screens/DashboardScreen';
import { PermissionsScreen } from './screens/PermissionsScreen';
import { AuditScreen } from './screens/AuditScreen';
import { RealtimeScreen } from './screens/RealtimeScreen';
import { SessionsScreen } from './screens/SessionsScreen';
import { useAuthStore } from '@/stores/authStore';
import { EmptyState } from '@/components/shared/EmptyState';
import type { ControlTab } from './types';

export function ControlPanelApp() {
  const { activeTab, setTab } = useControlStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin');

  useControlRealtime();

  if (!isAuthenticated) {
    return <EmptyState icon="🎛️" title="Sign In Required" description="Authenticate to access the System Control Panel." />;
  }

  if (!isAdmin) {
    return <EmptyState icon="🔒" title="Admin Access Required" description="The System Control Panel is restricted to BananaOS administrators." />;
  }

  const renderScreen = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardScreen />;
      case 'permissions': return <PermissionsScreen />;
      case 'audit': return <AuditScreen />;
      case 'realtime': return <RealtimeScreen />;
      case 'sessions': return <SessionsScreen />;
      default: return <DashboardScreen />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0f] relative">
      <div className="absolute inset-0 bg-gradient-to-b from-banana-gold/[0.03] via-transparent to-transparent pointer-events-none" />

      <div className="relative flex items-center justify-between px-4 py-2 border-b border-white/5">
        <div>
          <p className="text-banana-gold text-[10px] tracking-[0.2em] uppercase">System Control</p>
          <p className="text-white/30 text-[9px]">BananaOS Platform Administration</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[9px] text-green-400/80">LIVE</span>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden">{renderScreen()}</div>
      <ControlTabBar active={activeTab} onChange={(t: ControlTab) => setTab(t)} />
    </div>
  );
}

export { controlPanelManifest } from './manifest';
