'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useContactsStore } from './store/contactsStore';
import { contactsService } from './services/contactsService';
import { useContactsRealtime } from './hooks/useContactsRealtime';
import { ContactsTabBar } from './components/ContactsTabBar';
import { HomeScreen } from './screens/HomeScreen';
import { ListScreen } from './screens/ListScreen';
import { FavoritesScreen } from './screens/FavoritesScreen';
import { GroupsScreen } from './screens/GroupsScreen';
import { EmergencyScreen } from './screens/EmergencyScreen';
import { BlockedScreen } from './screens/BlockedScreen';
import { ImportExportScreen } from './screens/ImportExportScreen';
import { AdminScreen } from './screens/AdminScreen';
import { useAuthStore } from '@/stores/authStore';
import { useHaptic } from '@/hooks/useSound';
import { EmptyState } from '@/components/shared/EmptyState';
import type { ContactsTab } from './types';

export function ContactsApp() {
  const { activeTab, setTab, setLoading, loading } = useContactsStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin');
  const { tap } = useHaptic();
  const [showMore, setShowMore] = useState(false);
  const [moreTab, setMoreTab] = useState<ContactsTab | null>(null);

  useContactsRealtime();

  const { isLoading: dashLoading } = useQuery({
    queryKey: ['contacts', 'dashboard'],
    queryFn: () => contactsService.getDashboard(),
    enabled: isAuthenticated,
    retry: false,
  });

  useEffect(() => {
    if (isAuthenticated) contactsService.initPermissions().catch(() => {});
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) setLoading(false);
  }, [isAuthenticated, setLoading]);

  const effectiveTab = moreTab ?? activeTab;

  const renderScreen = () => {
    switch (effectiveTab) {
      case 'home': return <HomeScreen />;
      case 'list': return <ListScreen />;
      case 'favorites': return <FavoritesScreen />;
      case 'groups': return <GroupsScreen />;
      case 'emergency': return <EmergencyScreen />;
      case 'blocked': return <BlockedScreen />;
      case 'import': return <ImportExportScreen />;
      case 'admin': return isAdmin ? <AdminScreen /> : null;
      default: return <HomeScreen />;
    }
  };

  if (!isAuthenticated) {
    return <EmptyState icon="👤" title="Sign In Required" description="Sign in to manage your contacts." />;
  }

  if (loading || dashLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-black gap-3">
        <div className="w-10 h-10 border-2 border-banana-gold border-t-transparent rounded-full animate-spin" />
        <p className="text-white/40 text-sm">Loading Contacts...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-black relative">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
        <div>
          <p className="text-banana-gold text-[10px] tracking-widest uppercase">Contacts</p>
          <p className="text-white/40 text-[9px]">Official BananaOS Application</p>
        </div>
        {moreTab && (
          <button type="button" onClick={() => setMoreTab(null)} className="text-banana-gold text-xs">‹ Back</button>
        )}
      </div>

      <div className="flex-1 overflow-hidden">{renderScreen()}</div>

      {!moreTab && (
        <ContactsTabBar
          active={activeTab}
          onChange={(t) => { tap(); setTab(t); }}
          onMore={() => setShowMore(!showMore)}
        />
      )}

      {showMore && (
        <div className="absolute bottom-14 left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-white/10 p-3 z-10">
          <div className="grid grid-cols-3 gap-2">
            {[
              { tab: 'blocked' as ContactsTab, icon: '🚫', label: 'Blocked' },
              { tab: 'import' as ContactsTab, icon: '📥', label: 'Import' },
              ...(isAdmin ? [{ tab: 'admin' as ContactsTab, icon: '⚙️', label: 'Admin' }] : []),
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

export { contactsManifest } from './manifest';
