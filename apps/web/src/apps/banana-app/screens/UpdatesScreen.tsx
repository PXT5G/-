'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useBananaAppStore } from '../store/bananaAppStore';
import { bananaAppService } from '../services/bananaAppService';
import { Button, EmptyState } from '@/components/shared';
import { useHaptic } from '@/hooks/useSound';

export function UpdatesScreen({
  onUpdate,
}: {
  onUpdate: (bundleId: string) => void;
}) {
  const { updates, settings, setUpdates, setSettings } = useBananaAppStore();
  const { tap } = useHaptic();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['store', 'updates'],
    queryFn: () => bananaAppService.getUpdates(),
    refetchInterval: 30000,
  });

  const { data: storeSettings } = useQuery({
    queryKey: ['store', 'settings'],
    queryFn: () => bananaAppService.getSettings(),
  });

  useEffect(() => {
    if (data) setUpdates(data as never);
  }, [data, setUpdates]);

  useEffect(() => {
    if (storeSettings) setSettings(storeSettings);
  }, [storeSettings, setSettings]);

  const toggleAutoUpdate = useMutation({
    mutationFn: () =>
      bananaAppService.updateSettings({ autoUpdate: !settings.autoUpdate }),
    onSuccess: (s) => {
      setSettings(s);
      queryClient.invalidateQueries({ queryKey: ['store', 'settings'] });
    },
  });

  const formatSize = (bytes: number) => {
    if (bytes < 1_000_000) return `${(bytes / 1000).toFixed(0)} KB`;
    return `${(bytes / 1_000_000).toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-4 pt-2 pb-4">
        <h1 className="text-2xl font-bold text-white mb-4">Updates</h1>

        <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 mb-4">
          <div>
            <p className="text-sm font-medium text-white">Automatic Updates</p>
            <p className="text-xs text-white/50">Download updates automatically</p>
          </div>
          <button
            type="button"
            onClick={() => { tap(); toggleAutoUpdate.mutate(); }}
            className={`w-12 h-7 rounded-full transition-colors ${settings.autoUpdate ? 'bg-banana-gold' : 'bg-white/20'}`}
            aria-pressed={settings.autoUpdate}
          >
            <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform mx-1 ${settings.autoUpdate ? 'translate-x-5' : ''}`} />
          </button>
        </div>
      </div>

      <div className="px-4 flex-1">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-banana-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : updates.length === 0 ? (
          <EmptyState icon="✅" title="All apps up to date" description="Check back later for new updates" />
        ) : (
          <div className="space-y-3">
            {updates.map((app) => (
              <div
                key={app.bundleId}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10"
              >
                <span className="text-3xl">{app.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">{app.name}</p>
                  <p className="text-xs text-white/50">
                    {app.installedVersion} → {app.latestVersion}
                  </p>
                  <p className="text-[10px] text-white/40">{formatSize(app.storageBytes)}</p>
                </div>
                <Button
                  label="Update"
                  size="sm"
                  onClick={() => { tap(); onUpdate(app.bundleId); }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
