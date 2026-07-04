'use client';

import { motion } from 'framer-motion';
import { dockAnimation } from '@/animations/transitions';
import { AppIcon } from './AppIcon';
import { useSearchStore } from '@/stores/searchStore';
import { useSound, useHaptic } from '@/hooks/useSound';
import { useAppLaunch } from '@/hooks/useAppLaunch';

const DOCK_APPS = [
  { bundleId: 'com.bananaos.phone', name: 'Phone', icon: '📞' },
  { bundleId: 'com.bananaos.messages', name: 'Messages', icon: '💬' },
  { bundleId: 'com.bananaos.store', name: 'Banana App', icon: '🍌' },
  { bundleId: 'com.bananaos.settings', name: 'Settings', icon: '⚙️' },
];

export function Dock() {
  const openSearch = useSearchStore((s) => s.open);
  const { launchApp } = useAppLaunch();
  const { playTap } = useSound();
  const { tap } = useHaptic();

  const handlePress = (app: typeof DOCK_APPS[0]) => {
    if (app.bundleId === 'com.bananaos.search') {
      playTap();
      tap();
      openSearch();
      return;
    }
    void launchApp({ bundleId: app.bundleId, name: app.name });
  };

  return (
    <motion.div
      className="absolute bottom-6 left-4 right-4 z-30"
      {...dockAnimation}
    >
      <div className="mx-auto max-w-sm rounded-3xl bg-white/10 backdrop-blur-2xl border border-white/15 shadow-2xl px-4 py-3">
        <div className="flex items-center justify-around">
          {DOCK_APPS.map((app) => (
            <AppIcon
              key={app.bundleId}
              name={app.name}
              icon={app.icon}
              size="sm"
              onPress={() => handlePress(app)}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
