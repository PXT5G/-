'use client';

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useBananaAppStore } from './store/bananaAppStore';
import { bananaAppService } from './services/bananaAppService';
import { StoreTabBar } from './components/StoreTabBar';
import { InstallOverlay } from './components/InstallOverlay';
import { PermissionApprovalModal } from './components/PermissionApprovalModal';
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
import { InsufficientStorageModal } from './components/InsufficientStorageModal';
import { deviceStorageService } from '@/services/deviceStorageService';
import { ApiError } from '@/utils/api';
import type { PendingInstall } from './types';

interface StorageError {
  required: number;
  free: number;
}

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
  const [pendingInstall, setPendingInstall] = useState<PendingInstall | null>(null);
  const [storageError, setStorageError] = useState<StorageError | null>(null);
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

  const beginInstallFlow = useCallback(async (bundleId: string, type: 'install' | 'update') => {
    try {
      playTap();
      const check = await deviceStorageService.checkInstall(bundleId);
      if (!check.available) {
        setStorageError({ required: check.required, free: check.free });
        return;
      }
      const app = await bananaAppService.getAppDetail(bundleId);
      const { manifest } = await bananaAppService.getPackageManifest(bundleId, app.version);
      setPendingInstall({
        bundleId,
        appName: app.name,
        appIcon: app.icon,
        type,
        manifest,
      });
    } catch (err) {
      console.error('[BananaApp] Failed to load package manifest:', err);
    }
  }, [playTap]);

  const handleInstall = useCallback((bundleId: string) => {
    beginInstallFlow(bundleId, 'install');
  }, [beginInstallFlow]);

  const handleUpdate = useCallback((bundleId: string) => {
    beginInstallFlow(bundleId, 'update');
  }, [beginInstallFlow]);

  const startDownload = useCallback(async (approvedPermissions: string[]) => {
    if (!pendingInstall) return;
    try {
      const { bundleId, appName, appIcon, type } = pendingInstall;
      const result =
        type === 'update'
          ? await bananaAppService.update(bundleId, approvedPermissions)
          : await bananaAppService.install(bundleId, approvedPermissions);

      setPendingInstall(null);
      setActiveInstall({
        downloadId: result.downloadId,
        bundleId,
        appName,
        appIcon,
        type,
        progress: 0,
        status: 'queued',
        size: pendingInstall.manifest.storageRequired,
        downloadedBytes: 0,
      });

      islandShow({
        mode: 'activity',
        title: `${type === 'update' ? 'Updating' : 'Installing'} ${appName}`,
        icon: appIcon,
        progress: 0,
      });
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 507) {
        setStorageError({
          required: pendingInstall.manifest.storageRequired,
          free: 0,
        });
      }
      console.error('[BananaApp] Install failed:', err);
      setPendingInstall(null);
    }
  }, [pendingInstall, setActiveInstall, islandShow]);

  const handleClearCache = useCallback(async () => {
    await deviceStorageService.clearAllCache();
    setStorageError(null);
    queryClient.invalidateQueries({ queryKey: ['device'] });
  }, [queryClient]);

  const handlePause = useCallback(async () => {
    if (!activeInstall) return;
    await bananaAppService.pauseDownload(activeInstall.downloadId);
  }, [activeInstall]);

  const handleResume = useCallback(async () => {
    if (!activeInstall) return;
    await bananaAppService.resumeDownload(activeInstall.downloadId);
  }, [activeInstall]);

  const handleCancel = useCallback(async () => {
    if (!activeInstall) return;
    await bananaAppService.cancelDownload(activeInstall.downloadId);
    setActiveInstall(null);
    islandHide();
  }, [activeInstall, setActiveInstall, islandHide]);

  const handleRetry = useCallback(async () => {
    if (!activeInstall) return;
    await bananaAppService.retryDownload(activeInstall.downloadId);
    setActiveInstall({ ...activeInstall, status: 'queued', progress: 0 });
  }, [activeInstall, setActiveInstall]);

  const handleInstallComplete = useCallback(() => {
    success();
    setActiveInstall(null);
    islandHide();
    setDetailBundleId(null);
    queryClient.invalidateQueries({ queryKey: ['store'] });
  }, [success, setActiveInstall, islandHide, queryClient]);

  const overlay = (
    <>
      {storageError && (
        <InsufficientStorageModal
          required={storageError.required}
          free={storageError.free}
          onClearCache={handleClearCache}
          onOpenStorageManager={() => {
            setStorageError(null);
            setTab('library');
          }}
          onCancel={() => setStorageError(null)}
        />
      )}
      {pendingInstall && (
        <PermissionApprovalModal
          manifest={pendingInstall.manifest}
          appName={pendingInstall.appName}
          appIcon={pendingInstall.appIcon}
          type={pendingInstall.type}
          onApprove={startDownload}
          onCancel={() => setPendingInstall(null)}
        />
      )}
      <InstallOverlay
        install={activeInstall}
        onComplete={handleInstallComplete}
        onPause={handlePause}
        onResume={handleResume}
        onCancel={handleCancel}
        onRetry={handleRetry}
      />
    </>
  );

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
        {overlay}
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
      {overlay}
    </div>
  );
}
