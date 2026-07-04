'use client';

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usePhoneStore } from './store/phoneStore';
import { phoneService } from './services/phoneService';
import { usePhoneRealtime } from './hooks/usePhoneRealtime';
import { PhoneTabBar } from './components/PhoneTabBar';
import { DashboardScreen } from './screens/DashboardScreen';
import { DialPadScreen } from './screens/DialPadScreen';
import { IncomingCallScreen } from './screens/IncomingCallScreen';
import { ActiveCallScreen } from './screens/ActiveCallScreen';
import { RecentCallsScreen } from './screens/RecentCallsScreen';
import { FavoritesScreen } from './screens/FavoritesScreen';
import { ContactsPickerScreen } from './screens/ContactsPickerScreen';
import { VoicemailScreen } from './screens/VoicemailScreen';
import { BlockedNumbersScreen } from './screens/BlockedNumbersScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { useAuthStore } from '@/stores/authStore';
import { identityService } from '@/apps/identity/services/identityService';
import { simService } from '@/apps/sim/services/simService';
import { useHaptic } from '@/hooks/useSound';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/shared/Button';
import type { PhoneTab } from './types';

export { phoneManifest } from './manifest';

export function PhoneApp() {
  const { activeTab, setTab, setLoading, loading, setPermissions, incomingCall, activeCall } = usePhoneStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { tap } = useHaptic();
  const queryClient = useQueryClient();
  const [showMore, setShowMore] = useState(false);
  const [moreTab, setMoreTab] = useState<PhoneTab | null>(null);
  const [needsIdentity, setNeedsIdentity] = useState(false);
  const [needsSim, setNeedsSim] = useState(false);
  const [initializing, setInitializing] = useState(false);

  usePhoneRealtime();

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
      phoneService.init().then(() => phoneService.getPermissions().then(setPermissions)).catch(() => {});
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
        <div className="w-10 h-10 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-white/40 text-sm">Loading Phone...</p>
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
        <span className="text-5xl mb-4">📞</span>
        <h2 className="text-white font-bold text-xl mb-2">Initialize Phone</h2>
        <p className="text-white/50 text-sm mb-6">Set up your dialer, permissions, and call settings.</p>
        <Button label="Initialize Phone" onClick={handleInit} loading={initializing} size="lg" />
      </div>
    );
  }

  const showTabBar = !['incoming', 'active'].includes(effectiveTab) && !moreTab;

  return (
    <div className="flex flex-col h-full bg-black relative">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
        <div>
          <p className="text-green-400 text-[10px] tracking-widest uppercase">Phone</p>
          <p className="text-white/40 text-[9px]">{dashboard?.phoneNumber ?? 'BananaOS Dialer'}</p>
        </div>
        {moreTab && (
          <button type="button" onClick={() => setMoreTab(null)} className="text-green-400 text-xs">‹ Back</button>
        )}
      </div>

      <div className="flex-1 overflow-hidden">{renderScreen()}</div>

      {showTabBar && (
        <PhoneTabBar
          active={activeTab}
          onChange={(t) => { tap(); setTab(t); }}
          onMore={() => setShowMore(!showMore)}
          missedCount={dashboard?.missedCalls ?? 0}
        />
      )}

      {showMore && (
        <div className="absolute bottom-14 left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-white/10 p-3 z-10">
          <div className="grid grid-cols-3 gap-2">
            {[
              { tab: 'contacts' as PhoneTab, icon: '👤', label: 'Contacts' },
              { tab: 'voicemail' as PhoneTab, icon: '📬', label: 'Voicemail' },
              { tab: 'blocked' as PhoneTab, icon: '🚫', label: 'Blocked' },
              { tab: 'settings' as PhoneTab, icon: '⚙️', label: 'Settings' },
            ].map((item) => (
              <button
                key={item.tab}
                type="button"
                onClick={() => { tap(); setMoreTab(item.tab); setShowMore(false); }}
                className="bg-white/5 rounded-xl py-3 flex flex-col items-center gap-1 border border-white/10"
              >
                <span>{item.icon}</span>
                <span className="text-white/60 text-[9px]">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
