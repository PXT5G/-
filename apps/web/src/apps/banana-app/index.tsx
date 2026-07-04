'use client';

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useBananaAppStore } from './store/bananaAppStore';
import { bananaAppService } from './services/bananaAppService';
import { StoreTabBar } from './components/StoreTabBar';
import { InstallOverlay } from './components/InstallOverlay';
import { TodayScreen } from './screens/TodayScreen';
import { AppsScreen } from './screens/AppsScreen';
import { SearchScreen } from './screens/SearchScreen';
import { UpdatesScreen } from './screens/UpdatesScreen';
import { LibraryScreen } from './screens/LibraryScreen';
import { AppDetailScreen } from './screens/AppDetailScreen';
import { DeveloperScreen } from './screens/DeveloperScreen';
import { useStoreRealtime } from './hooks/useStoreRealtime';
import { useHaptic, useSound } from '@/hooks/useSound';
import { useDynamicIslandStore } from '@/stores/dynamicIslandStore';

export function BananaApp() {
  const {
    activeTab,
    activeInstall,
    updates,
    setTab,
    setActiveInstall,
  } = useBananaAppStore();

  const [detailBundleId, setDetailBundleId] = useState<string | null>(null);
  const [developerSlug, setDeveloperSlug] = useState<string | null>(null);
  const { tap, success } = useHaptic();
  const { playTap } = useSound();
  const queryClient = useQueryClient();
  const islandShow = useDynamicIslandStore((s) => s.show);
  const islandHide = useDynamicIslandStore((s) => s.hide);

  useStoreRealtime();

  const openApp = useCallback((bundleId: string) => {
    tap();
    setDetailBundleId(bundleId);
    setDeveloperSlug(null);
  }, [tap]);

  const openDeveloper = useCallback((slug: string) => {
    tap();
    setDeveloperSlug(slug);
  }, [tap]);

  const handleInstall = useCallback(async (bundleId: string) => {
    try {
      playTap();
      const app = await bananaAppService.getAppDetail(bundleId);
      const { downloadId } = await bananaAppService.install(bundleId);

      setActiveInstall({
        downloadId,
        bundleId,
        appName: app.name,
        appIcon: app.icon,
        type: 'install',
        progress: 0,
        status: 'queued',
      });

      islandShow({
        mode: 'activity',
        title: `Installing ${app.name}`,
        icon: app.icon,
        progress: 0,
      });
    } catch (err) {
      console.error('[BananaApp] Install failed:', err);
    }
  }, [playTap, setActiveInstall, islandShow]);

  const handleUpdate = useCallback(async (bundleId: string) => {
    try {
      playTap();
      const app = await bananaAppService.getAppDetail(bundleId);
      const { downloadId } = await bananaAppService.update(bundleId);

      setActiveInstall({
        downloadId,
        bundleId,
        appName: app.name,
        appIcon: app.icon,
        type: 'update',
        progress: 0,
        status: 'queued',
      });

      islandShow({
        mode: 'activity',
        title: `Updating ${app.name}`,
        icon: app.icon,
        progress: 0,
      });
    } catch (err) {
      console.error('[BananaApp] Update failed:', err);
    }
  }, [playTap, setActiveInstall, islandShow]);

  const handleInstallComplete = useCallback(() => {
    success();
    setActiveInstall(null);
    islandHide();
    setDetailBundleId(null);
    queryClient.invalidateQueries({ queryKey: ['store'] });
  }, [success, setActiveInstall, islandHide, queryClient]);

  if (developerSlug) {
    return (
      <div className="h-full bg-black">
        <DeveloperScreen
          slug={developerSlug}
          onBack={() => setDeveloperSlug(null)}
          onAppPress={openApp}
        />
      </div>
    );
  }

  if (detailBundleId) {
    return (
      <div className="h-full bg-black relative">
        <AppDetailScreen
          bundleId={detailBundleId}
          onBack={() => setDetailBundleId(null)}
          onInstall={handleInstall}
          onUpdate={handleUpdate}
          onDeveloper={openDeveloper}
        />
        <InstallOverlay install={activeInstall} onComplete={handleInstallComplete} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-black relative">
      <div className="flex-1 overflow-hidden">
        {activeTab === 'today' && <TodayScreen onAppPress={openApp} />}
        {activeTab === 'apps' && <AppsScreen onAppPress={openApp} />}
        {activeTab === 'search' && <SearchScreen onAppPress={openApp} />}
        {activeTab === 'updates' && <UpdatesScreen onUpdate={handleUpdate} />}
        {activeTab === 'library' && (
          <LibraryScreen onAppPress={openApp} onUninstall={() => queryClient.invalidateQueries({ queryKey: ['store'] })} />
        )}
      </div>

      <StoreTabBar active={activeTab} onChange={(t) => { tap(); setTab(t); }} updateCount={updates.length} />
      <InstallOverlay install={activeInstall} onComplete={handleInstallComplete} />
    </div>
  );
}
