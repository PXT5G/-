'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useBananaAppStore } from '../store/bananaAppStore';
import { bananaAppService } from '../services/bananaAppService';
import { Button, EmptyState, ProgressBar } from '@/components/shared';
import { useHaptic } from '@/hooks/useSound';

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

  const { data: installedData, isLoading } = useQuery({
    queryKey: ['store', 'installed'],
    queryFn: () => bananaAppService.getInstalled(),
  });

  const { data: downloadsData } = useQuery({
    queryKey: ['store', 'downloads'],
    queryFn: () => bananaAppService.getDownloads(),
    refetchInterval: 2000,
  });

  useEffect(() => {
    if (installedData) setInstalled(installedData);
  }, [installedData, setInstalled]);

  useEffect(() => {
    if (downloadsData) setDownloads(downloadsData);
  }, [downloadsData, setDownloads]);

  const uninstallMutation = useMutation({
    mutationFn: (bundleId: string) => bananaAppService.uninstall(bundleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store', 'installed'] });
    },
  });

  const formatSize = (bytes: number) => {
    if (bytes < 1_000_000) return `${(bytes / 1000).toFixed(0)} KB`;
    return `${(bytes / 1_000_000).toFixed(1)} MB`;
  };

  const activeDownloads = downloads.filter(
    (d) => d.status === 'downloading' || d.status === 'installing' || d.status === 'queued'
  );

  const totalStorage = installed.reduce((sum, a) => sum + a.storageBytes, 0);

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-4 pt-2 pb-4">
        <h1 className="text-2xl font-bold text-white mb-2">Library</h1>
        <p className="text-xs text-white/50 mb-4">
          {installed.length} apps · {formatSize(totalStorage)} used
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
                    <p className="text-[10px] text-white/50 capitalize">{d.status}</p>
                  </div>
                  <span className="text-xs text-banana-gold">{d.progress}%</span>
                </div>
                <ProgressBar value={d.progress} />
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
          <EmptyState
            icon="📚"
            title="No installed apps"
            description="Browse the store to find apps"
          />
        ) : (
          <div className="space-y-2">
            {installed.map((app) => (
              <div
                key={app.bundleId}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10"
              >
                <button type="button" onClick={() => onAppPress(app.bundleId)} className="flex items-center gap-3 flex-1 text-left">
                  <span className="text-3xl">{app.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white flex items-center gap-2">
                      {app.name}
                      {app.hasUpdate && (
                        <span className="text-[10px] bg-banana-gold/20 text-banana-gold px-1.5 rounded">UPDATE</span>
                      )}
                    </p>
                    <p className="text-xs text-white/50">v{app.installedVersion} · {formatSize(app.storageBytes)}</p>
                  </div>
                </button>
                {!app.isSystemApp && (
                  <Button
                    label="Remove"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      tap();
                      uninstallMutation.mutate(app.bundleId);
                      onUninstall(app.bundleId);
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
