'use client';

import { useQuery } from '@tanstack/react-query';
import { gulfStoreService } from '@/apps/banana-app/services/gulfStoreService';

function formatSize(bytes: number) {
  if (bytes < 1_000_000) return `${(bytes / 1000).toFixed(0)} KB`;
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

export function InstalledAppsSettings({ onBack }: { onBack: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['store', 'installed'],
    queryFn: () => gulfStoreService.getInstalled(),
  });

  const apps = data?.apps ?? [];

  return (
    <div className="h-full overflow-y-auto bg-black p-4">
      <button type="button" onClick={onBack} className="text-gulf-gold text-sm mb-4">‹ Settings</button>
      <h2 className="text-xl font-bold text-white mb-4">Installed Apps</h2>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-gulf-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : apps.length === 0 ? (
        <p className="text-sm text-white/50 text-center py-8">No apps installed yet.</p>
      ) : (
        <div className="space-y-2">
          {apps.map((app) => (
            <div key={app.bundleId} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
              <span className="text-2xl">{app.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{app.name}</p>
                <p className="text-xs text-white/50">
                  v{app.installedVersion} · {formatSize(app.storageBytes)}
                  {app.state ? ` · ${app.state.replace('_', ' ')}` : ''}
                </p>
              </div>
              {app.isSystemApp && (
                <span className="text-[10px] text-white/40">System</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
