'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useBananaAppStore } from '../store/bananaAppStore';
import { bananaAppService } from '../services/bananaAppService';
import { Button, EmptyState, ProgressBar } from '@/components/shared';
import { useHaptic } from '@/hooks/useSound';
import { UninstallConfirmModal } from '../components/UninstallConfirmModal';
import { formatBytes } from '@/services/deviceStorageService';
import { useDeviceStorage } from '@/hooks/useDeviceStorage';
import type { AppStorageInfo } from '../types';

function formatSize(bytes: number) {
  if (bytes < 1_000_000) return `${(bytes / 1000).toFixed(0)} KB`;
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

function formatSpeed(bytesPerSec?: number) {
  if (!bytesPerSec) return '';
  if (bytesPerSec < 1_000_000) return `${(bytesPerSec / 1000).toFixed(0)} KB/s`;
  return `${(bytesPerSec / 1_000_000).toFixed(1)} MB/s`;
}

export function LibraryScreen({
  onAppPress,
  onUninstall,
}: {
  onAppPress: (bundleId: string) => void;
  onUninstall: (bundleId: string) => void;
}) {
  const { installed, downloads, setInstalled, setDownloads } = useBananaAppStore();
  const { tap } = useHaptic();
  const queryClient = useQueryClient();
  const [expandedBundleId, setExpandedBundleId] = useState<string | null>(null);
  const [uninstallTarget, setUninstallTarget] = useState<{
    bundleId: string;
    name: string;
    icon: string;
    storageBytes: number;
  } | null>(null);

  const { data: deviceStorage } = useDeviceStorage();
  const [storageInfo, setStorageInfo] = useState<AppStorageInfo | null>(null);

  const { data: installedData, isLoading } = useQuery({
    queryKey: ['store', 'installed'],
    queryFn: () => bananaAppService.getInstalled(),
  });

  const { data: downloadsData } = useQuery({
    queryKey: ['store', 'downloads'],
    queryFn: () => bananaAppService.getDownloads(),
    refetchInterval: 3000,
  });

  useEffect(() => {
    if (installedData) setInstalled(installedData.apps);
  }, [installedData, setInstalled]);

  useEffect(() => {
    if (downloadsData) setDownloads(downloadsData);
  }, [downloadsData, setDownloads]);

  const uninstallMutation = useMutation({
    mutationFn: ({
      bundleId,
      options,
    }: {
      bundleId: string;
      options: { keepUserData: boolean; keepSettings: boolean; keepSession: boolean };
    }) => bananaAppService.uninstall(bundleId, options),
    onSuccess: () => {
      setUninstallTarget(null);
      queryClient.invalidateQueries({ queryKey: ['store', 'installed'] });
      queryClient.invalidateQueries({ queryKey: ['device', 'storage'] });
    },
  });

  const clearCacheMutation = useMutation({
    mutationFn: (bundleId: string) => bananaAppService.clearCache(bundleId),
    onSuccess: (data) => setStorageInfo(data),
  });

  const clearDataMutation = useMutation({
    mutationFn: (bundleId: string) => bananaAppService.clearData(bundleId),
    onSuccess: (data) => setStorageInfo(data),
  });

  const pauseMutation = useMutation({
    mutationFn: (downloadId: string) => bananaAppService.pauseDownload(downloadId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['store', 'downloads'] }),
  });

  const resumeMutation = useMutation({
    mutationFn: (downloadId: string) => bananaAppService.resumeDownload(downloadId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['store', 'downloads'] }),
  });

  const cancelMutation = useMutation({
    mutationFn: (downloadId: string) => bananaAppService.cancelDownload(downloadId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['store', 'downloads'] }),
  });

  const retryMutation = useMutation({
    mutationFn: (downloadId: string) => bananaAppService.retryDownload(downloadId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['store', 'downloads'] }),
  });

  const activeDownloads = downloads.filter(
    (d) => ['downloading', 'installing', 'queued', 'paused'].includes(d.status)
  );

  const totalStorage = deviceStorage?.used ?? installed.reduce((sum, a) => sum + a.storageBytes, 0);
  const capacityLabel = deviceStorage
    ? `${formatBytes(deviceStorage.used)} of ${formatBytes(deviceStorage.total)}`
    : `${formatSize(totalStorage)} used`;

  const toggleStorage = async (bundleId: string) => {
    tap();
    if (expandedBundleId === bundleId) {
      setExpandedBundleId(null);
      setStorageInfo(null);
      return;
    }
    setExpandedBundleId(bundleId);
    const info = await bananaAppService.getAppStorage(bundleId);
    setStorageInfo(info);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-4 pt-2 pb-4">
        <h1 className="text-2xl font-bold text-white mb-2">Library</h1>
        <p className="text-xs text-white/50 mb-4">
          {installed.length} apps · {capacityLabel}
        </p>

        {activeDownloads.length > 0 && (
          <section className="mb-4">
            <h2 className="text-xs font-semibold text-white/40 uppercase mb-2">Downloads</h2>
            {activeDownloads.map((d) => (
              <div key={d.id} className="p-3 rounded-xl bg-white/5 border border-white/10 mb-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{d.appIcon}</span>
                  <div className="flex-1">
                    <p className="text-sm text-white">{d.appName}</p>
                    <p className="text-[10px] text-white/50 capitalize">
                      {d.status}
                      {d.queuePosition ? ` · Queue #${d.queuePosition}` : ''}
                    </p>
                  </div>
                  <span className="text-xs text-banana-gold">{d.progress}%</span>
                </div>
                <ProgressBar value={d.progress} />
                {d.status === 'downloading' && (
                  <p className="text-[10px] text-white/40 mt-1">
                    {formatSpeed(d.downloadSpeed)}
                    {d.etaSeconds ? ` · ${d.etaSeconds}s left` : ''}
                  </p>
                )}
                <div className="flex gap-2 mt-2">
                  {d.status === 'downloading' && (
                    <Button label="Pause" variant="ghost" size="sm" onClick={() => pauseMutation.mutate(d.id)} />
                  )}
                  {d.status === 'paused' && (
                    <Button label="Resume" size="sm" onClick={() => resumeMutation.mutate(d.id)} />
                  )}
                  {d.status === 'failed' && (
                    <Button label="Retry" size="sm" onClick={() => retryMutation.mutate(d.id)} />
                  )}
                  {['queued', 'downloading', 'paused'].includes(d.status) && (
                    <Button label="Cancel" variant="ghost" size="sm" onClick={() => cancelMutation.mutate(d.id)} />
                  )}
                </div>
              </div>
            ))}
          </section>
        )}
      </div>

      <div className="px-4 flex-1 pb-4">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-banana-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : installed.length === 0 ? (
          <EmptyState icon="📚" title="No installed apps" description="Browse the store to find apps" />
        ) : (
          <div className="space-y-2">
            {installed.map((app) => (
              <div key={app.bundleId} className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
                <div className="flex items-center gap-3 p-3">
                  <button type="button" onClick={() => onAppPress(app.bundleId)} className="flex items-center gap-3 flex-1 text-left">
                    <span className="text-3xl">{app.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white flex items-center gap-2">
                        {app.name}
                        {app.hasUpdate && (
                          <span className="text-[10px] bg-banana-gold/20 text-banana-gold px-1.5 rounded">UPDATE</span>
                        )}
                      </p>
                      <p className="text-xs text-white/50">
                        v{app.installedVersion} · {formatSize(app.storageBytes)}
                        {app.state ? ` · ${app.state.replace('_', ' ')}` : ''}
                      </p>
                    </div>
                  </button>
                  <button type="button" onClick={() => toggleStorage(app.bundleId)} className="text-xs text-banana-gold px-2">
                    Storage
                  </button>
                  {!app.isSystemApp && (
                    <Button
                      label="Remove"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        tap();
                        setUninstallTarget({
                          bundleId: app.bundleId,
                          name: app.name,
                          icon: app.icon,
                          storageBytes: app.storageBytes,
                        });
                      }}
                    />
                  )}
                </div>

                {expandedBundleId === app.bundleId && storageInfo && (
                  <div className="px-3 pb-3 border-t border-white/5 pt-3 space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="text-white/50">Application</div>
                      <div className="text-white text-right">{formatSize(storageInfo.appSize)}</div>
                      <div className="text-white/50">User Data</div>
                      <div className="text-white text-right">{formatSize(storageInfo.userDataSize)}</div>
                      <div className="text-white/50">Cache</div>
                      <div className="text-white text-right">{formatSize(storageInfo.cacheSize)}</div>
                      <div className="text-white/50">Temp Files</div>
                      <div className="text-white text-right">{formatSize(storageInfo.tempSize)}</div>
                      <div className="text-white/50">Downloads</div>
                      <div className="text-white text-right">{formatSize(storageInfo.downloadsSize)}</div>
                      <div className="text-white/50">Logs</div>
                      <div className="text-white text-right">{formatSize(storageInfo.logsSize)}</div>
                      <div className="text-white/50 font-medium">Total</div>
                      <div className="text-banana-gold text-right font-medium">{formatSize(storageInfo.totalSize)}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        label="Clear Cache"
                        variant="ghost"
                        size="sm"
                        onClick={() => clearCacheMutation.mutate(app.bundleId)}
                        loading={clearCacheMutation.isPending}
                      />
                      <Button
                        label="Clear Data"
                        variant="ghost"
                        size="sm"
                        onClick={() => clearDataMutation.mutate(app.bundleId)}
                        loading={clearDataMutation.isPending}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {uninstallTarget && (
        <UninstallConfirmModal
          appName={uninstallTarget.name}
          appIcon={uninstallTarget.icon}
          storageBytes={uninstallTarget.storageBytes}
          onConfirm={(options) => {
            uninstallMutation.mutate({ bundleId: uninstallTarget.bundleId, options });
            onUninstall(uninstallTarget.bundleId);
          }}
          onCancel={() => setUninstallTarget(null)}
        />
      )}
    </div>
  );
}
