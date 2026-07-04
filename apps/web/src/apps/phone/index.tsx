'use client';

import { useEffect, useState, Suspense, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usePhoneStore } from './store/phoneStore';
import { phoneService } from './services/phoneService';
import { usePhoneRealtime } from './hooks/usePhoneRealtime';
import { usePhoneOfflineSync } from './hooks/usePhoneOffline';
import { PhoneTabBar } from './components/PhoneTabBar';
import { useAuthStore } from '@/stores/authStore';
import { identityService } from '@/apps/identity/services/identityService';
import { simService } from '@/apps/sim/services/simService';
import { useHaptic } from '@/hooks/useSound';
import { EmptyState, OfflineBanner, ToastContainer, LoadingSkeleton } from '@/components/shared';
import { Button } from '@/components/shared/Button';
import type { PhoneTab } from './types';

const screenFallback = <LoadingSkeleton rows={3} />;

const DashboardScreen = dynamic(() => import('./screens/DashboardScreen').then((m) => m.DashboardScreen), { loading: () => screenFallback });
const DialPadScreen = dynamic(() => import('./screens/DialPadScreen').then((m) => m.DialPadScreen), { loading: () => screenFallback });
const IncomingCallScreen = dynamic(() => import('./screens/IncomingCallScreen').then((m) => m.IncomingCallScreen), { loading: () => screenFallback });
const ActiveCallScreen = dynamic(() => import('./screens/ActiveCallScreen').then((m) => m.ActiveCallScreen), { loading: () => screenFallback });
const RecentCallsScreen = dynamic(() => import('./screens/RecentCallsScreen').then((m) => m.RecentCallsScreen), { loading: () => screenFallback });
const FavoritesScreen = dynamic(() => import('./screens/FavoritesScreen').then((m) => m.FavoritesScreen), { loading: () => screenFallback });
const ContactsPickerScreen = dynamic(() => import('./screens/ContactsPickerScreen').then((m) => m.ContactsPickerScreen), { loading: () => screenFallback });
const VoicemailScreen = dynamic(() => import('./screens/VoicemailScreen').then((m) => m.VoicemailScreen), { loading: () => screenFallback });
const BlockedNumbersScreen = dynamic(() => import('./screens/BlockedNumbersScreen').then((m) => m.BlockedNumbersScreen), { loading: () => screenFallback });
const SettingsScreen = dynamic(() => import('./screens/SettingsScreen').then((m) => m.SettingsScreen), { loading: () => screenFallback });

export { phoneManifest } from './manifest';

export function PhoneApp() {
  const activeTab = usePhoneStore((s) => s.activeTab);
  const setTab = usePhoneStore((s) => s.setTab);
  const loading = usePhoneStore((s) => s.loading);
  const setLoading = usePhoneStore((s) => s.setLoading);
  const setPermissions = usePhoneStore((s) => s.setPermissions);
  const incomingCall = usePhoneStore((s) => s.incomingCall);
  const activeCall = usePhoneStore((s) => s.activeCall);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { tap } = useHaptic();
  const queryClient = useQueryClient();
  const [showMore, setShowMore] = useState(false);
  const [moreTab, setMoreTab] = useState<PhoneTab | null>(null);
  const [needsIdentity, setNeedsIdentity] = useState(false);
  const [needsSim, setNeedsSim] = useState(false);
  const [initializing, setInitializing] = useState(false);

  usePhoneRealtime();
  usePhoneOfflineSync();

  const { data: identity, isLoading: identityLoading } = useQuery({
    queryKey: ['identity', 'me'],
    queryFn: () => identityService.getMe(),
    enabled: isAuthenticated,
  });

  const { data: simDashboard, isLoading: simLoading } = useQuery({
    queryKey: ['sim', 'dashboard'],
    queryFn: () => simService.getDashboard(),
    enabled: isAuthenticated && !!identity?.verified,
    retry: false,
  });

  const { data: dashboard } = useQuery({
    queryKey: ['phone', 'dashboard'],
    queryFn: () => phoneService.getDashboard(),
    enabled: isAuthenticated && !!simDashboard,
    retry: false,
  });

  useEffect(() => {
    if (isAuthenticated && simDashboard) {
      phoneService
        .init()
        .then(() => phoneService.getPermissions().then(setPermissions))
        .catch((err) => {
          console.error('[Phone] init failed:', err);
        });
    }
  }, [isAuthenticated, simDashboard, setPermissions]);

  useEffect(() => {
    if (!identityLoading && isAuthenticated) {
      setNeedsIdentity(!identity?.verified);
      if (identity?.verified && !simLoading) {
        setNeedsSim(!simDashboard);
      }
      setLoading(false);
    }
  }, [identity, identityLoading, simDashboard, simLoading, isAuthenticated, setLoading]);

  const handleInit = async () => {
    tap();
    setInitializing(true);
    try {
      await phoneService.init();
      queryClient.invalidateQueries({ queryKey: ['phone'] });
    } finally {
      setInitializing(false);
    }
  };

  const handleTabChange = useCallback((t: PhoneTab) => {
    tap();
    setTab(t);
  }, [tap, setTab]);

  const effectiveTab = incomingCall ? 'incoming' : activeCall ? 'active' : (moreTab ?? activeTab);

  const renderScreen = () => {
    switch (effectiveTab) {
      case 'dashboard': return <DashboardScreen />;
      case 'dialpad': return <DialPadScreen />;
      case 'incoming': return <IncomingCallScreen />;
      case 'active': return <ActiveCallScreen />;
      case 'recents': return <RecentCallsScreen />;
      case 'favorites': return <FavoritesScreen />;
      case 'contacts': return <ContactsPickerScreen />;
      case 'voicemail': return <VoicemailScreen />;
      case 'blocked': return <BlockedNumbersScreen />;
      case 'settings': return <SettingsScreen />;
      default: return <DashboardScreen />;
    }
  };

  if (!isAuthenticated) {
    return <EmptyState icon="📞" title="Sign In Required" description="Sign in to use BananaOS Phone." />;
  }

  if (loading || identityLoading || (identity?.verified && simLoading)) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-black gap-3">
        <div className="w-10 h-10 border-2 border-banana-gold border-t-transparent rounded-full animate-spin" aria-hidden="true" />
        <p className="text-white/40 text-sm" role="status">Loading Phone...</p>
      </div>
    );
  }

  if (needsIdentity) {
    return <EmptyState icon="🪪" title="Identity Required" description="A verified BananaOS Identity is required to use Phone." />;
  }

  if (needsSim) {
    return (
      <EmptyState
        icon="📶"
        title="SIM Required"
        description="Activate your Banana SIM to get a phone number before using the dialer."
      />
    );
  }

  if (!dashboard && !initializing) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center bg-black">
        <span className="text-5xl mb-4" aria-hidden="true">📞</span>
        <h2 className="text-white font-bold text-xl mb-2">Initialize Phone</h2>
        <p className="text-white/50 text-sm mb-6">Set up your dialer, permissions, and call settings.</p>
        <Button label="Initialize Phone" onClick={handleInit} loading={initializing} size="lg" />
      </div>
    );
  }

  const showTabBar = !['incoming', 'active'].includes(effectiveTab) && !moreTab;

  return (
    <div className="flex flex-col h-full bg-black relative">
      <ToastContainer />
      <OfflineBanner />
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
        <div>
          <p className="text-banana-gold text-[10px] tracking-widest uppercase">Phone</p>
          <p className="text-white/40 text-[9px]">{dashboard?.phoneNumber ?? 'BananaOS Dialer'}</p>
        </div>
        {moreTab && (
          <button type="button" onClick={() => setMoreTab(null)} className="text-banana-gold text-xs min-h-[44px] px-2" aria-label="Go back">‹ Back</button>
        )}
      </div>

      <div className="flex-1 overflow-hidden">
        <Suspense fallback={screenFallback}>{renderScreen()}</Suspense>
      </div>

      {showTabBar && (
        <PhoneTabBar
          active={activeTab}
          onChange={handleTabChange}
          onMore={() => setShowMore(!showMore)}
          missedCount={dashboard?.missedCalls ?? 0}
        />
      )}

      {showMore && (
        <div className="absolute bottom-14 left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-white/10 p-3 z-10" role="menu" aria-label="More phone options">
          <div className="grid grid-cols-3 gap-2">
            {[
              { tab: 'contacts' as PhoneTab, label: 'Contacts' },
              { tab: 'voicemail' as PhoneTab, label: 'Voicemail' },
              { tab: 'blocked' as PhoneTab, label: 'Blocked' },
              { tab: 'settings' as PhoneTab, label: 'Settings' },
            ].map((item) => (
              <button
                key={item.tab}
                type="button"
                role="menuitem"
                onClick={() => { tap(); setMoreTab(item.tab); setShowMore(false); }}
                className="bg-white/5 rounded-xl py-3 flex flex-col items-center gap-1 border border-white/10 min-h-[44px]"
              >
                <span className="text-white/60 text-[10px] font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
