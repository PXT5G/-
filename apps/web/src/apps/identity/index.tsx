'use client';

import { useEffect, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useIdentityStore } from './store/identityStore';
import { identityService } from './services/identityService';
import { IdentityTabBar } from './components/IdentityTabBar';
import { HomeScreen } from './screens/HomeScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { SecurityScreen } from './screens/SecurityScreen';
import { VerificationScreen } from './screens/VerificationScreen';
import { DocumentsScreen } from './screens/DocumentsScreen';
import { NotificationsScreen } from './screens/NotificationsScreen';
import { AdminScreen } from './screens/AdminScreen';
import { SetupScreen } from './screens/SetupScreen';
import { useAuthStore } from '@/stores/authStore';
import { useHaptic } from '@/hooks/useSound';
import { EmptyState } from '@/components/shared/EmptyState';

export function IdentityApp() {
  const { activeTab, setTab, setIdentity, setSettings, setLoading, loading } = useIdentityStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin');
  const { tap } = useHaptic();
  const queryClient = useQueryClient();
  const [needsSetup, setNeedsSetup] = useState(false);

  const { data: identity, isLoading, refetch } = useQuery({
    queryKey: ['identity', 'me'],
    queryFn: () => identityService.getMe(),
    enabled: isAuthenticated,
  });

  const { data: notifications } = useQuery({
    queryKey: ['identity', 'notifications'],
    queryFn: () => identityService.getNotifications(),
    enabled: isAuthenticated && !!identity,
    refetchInterval: 60000,
  });

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      if (!identity) {
        setNeedsSetup(true);
        setIdentity(null);
      } else {
        setNeedsSetup(false);
        setIdentity(identity);
      }
      setLoading(false);
    }
  }, [identity, isLoading, isAuthenticated, setIdentity, setLoading]);

  useEffect(() => {
    if (isAuthenticated && identity) {
      identityService.getSettings().then(setSettings).catch(() => {});
      identityService.addDevice(
        `device-${typeof window !== 'undefined' ? window.navigator.userAgent.slice(0, 20) : 'unknown'}`,
        typeof window !== 'undefined' ? window.navigator.userAgent.slice(0, 50) : 'BananaOS Device'
      ).catch(() => {});
    }
  }, [isAuthenticated, identity, setSettings]);

  const handleSetupComplete = useCallback(() => {
    setNeedsSetup(false);
    refetch();
    queryClient.invalidateQueries({ queryKey: ['identity'] });
  }, [refetch, queryClient]);

  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;

  if (!isAuthenticated) {
    return (
      <EmptyState
        icon="🪪"
        title="Sign In Required"
        description="Sign in to access your BananaOS digital identity."
      />
    );
  }

  if (loading || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-black gap-3">
        <div className="w-10 h-10 border-2 border-banana-gold border-t-transparent rounded-full animate-spin" />
        <p className="text-white/40 text-sm">Loading identity...</p>
      </div>
    );
  }

  if (needsSetup) {
    return (
      <div className="h-full bg-black">
        <SetupScreen onComplete={handleSetupComplete} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-black relative">
      <div className="flex-1 overflow-hidden">
        {activeTab === 'home' && <HomeScreen />}
        {activeTab === 'profile' && <ProfileScreen />}
        {activeTab === 'security' && <SecurityScreen />}
        {activeTab === 'verify' && <VerificationScreen />}
        {activeTab === 'documents' && <DocumentsScreen />}
        {activeTab === 'notifications' && <NotificationsScreen />}
        {activeTab === 'admin' && isAdmin && <AdminScreen />}
      </div>

      <IdentityTabBar
        active={activeTab}
        onChange={(t) => { tap(); setTab(t); }}
        showAdmin={isAdmin}
        unreadCount={unreadCount}
      />
    </div>
  );
}

export { identityManifest } from './manifest';
