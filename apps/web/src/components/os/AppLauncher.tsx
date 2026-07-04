'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/stores/appStore';
import { appService } from '@/services/appService';
import { useAuthStore } from '@/stores/authStore';
import { AppIcon } from '@/components/os/AppIcon';
import { GlassPanel } from '@/components/ui/GlassPanel';
import type { AppManifest } from '@/types';

interface AppLauncherProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AppLauncher({ isOpen, onClose }: AppLauncherProps) {
  const [catalog, setCatalog] = useState<AppManifest[]>([]);
  const [loading, setLoading] = useState(false);
  const installedApps = useAppStore((s) => s.installedApps);
  const addApp = useAppStore((s) => s.addApp);
  const token = useAuthStore((s) => s.getAccessToken());

  const loadCatalog = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const apps = await appService.getCatalog(token);
      setCatalog(apps);
    } catch {
      setCatalog([]);
    } finally {
      setLoading(false);
    }
  };

  const installApp = async (app: AppManifest) => {
    if (!token) return;
    try {
      const installed = await appService.install(app.bundleId, token);
      addApp(installed);
    } catch (error) {
      console.error('Install failed:', error);
    }
  };

  const isInstalled = (bundleId: string) =>
    installedApps.some((a) => a.bundleId === bundleId);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="absolute inset-0 z-[50] bg-black/80 backdrop-blur-xl p-4 pt-14"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">App Store</h2>
            <button onClick={onClose} className="text-gulf-gold text-sm">Close</button>
          </div>

          {!catalog.length && !loading && (
            <button
              onClick={loadCatalog}
              className="w-full py-3 text-center text-gulf-gold text-sm mb-4"
            >
              Load Available Apps
            </button>
          )}

          {loading && <p className="text-center text-white/40 py-8">Loading...</p>}

          <div className="grid grid-cols-3 gap-4 overflow-y-auto max-h-[70%]">
            {catalog.map((app) => (
              <GlassPanel key={app.bundleId} className="p-3 flex flex-col items-center" intensity="low">
                <AppIcon name={app.name} icon={app.icon} size="sm" />
                <button
                  onClick={() => !isInstalled(app.bundleId) && installApp(app)}
                  disabled={isInstalled(app.bundleId)}
                  className={`mt-2 text-[10px] px-3 py-1 rounded-full ${
                    isInstalled(app.bundleId)
                      ? 'bg-white/10 text-white/40'
                      : 'bg-gulf-gold text-black font-medium'
                  }`}
                >
                  {isInstalled(app.bundleId) ? 'Installed' : 'Install'}
                </button>
              </GlassPanel>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
