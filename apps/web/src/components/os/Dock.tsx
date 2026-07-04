'use client';

import { motion } from 'framer-motion';
import { dockAnimation } from '@/animations/transitions';
import { AppIcon } from './AppIcon';
import { useWindowManagerStore } from '@/stores/windowManagerStore';
import { useSearchStore } from '@/stores/searchStore';
import { useSound, useHaptic } from '@/hooks/useSound';
import { v4 as uuidv4 } from 'uuid';

const DOCK_APPS = [
  { bundleId: 'com.bananaos.phone', name: 'Phone', icon: '📞' },
  { bundleId: 'com.bananaos.messages', name: 'Messages', icon: '💬' },
  { bundleId: 'com.bananaos.store', name: 'Banana App', icon: '🍌' },
  { bundleId: 'com.bananaos.settings', name: 'Settings', icon: '⚙️' },
];

export function Dock() {
  const openWindow = useWindowManagerStore((s) => s.openWindow);
  const openSearch = useSearchStore((s) => s.open);
  const { playTap } = useSound();
  const { tap } = useHaptic();

  const handlePress = (app: typeof DOCK_APPS[0]) => {
    playTap();
    tap();

    if (app.bundleId === 'com.bananaos.search') {
      openSearch();
      return;
    }

    openWindow({
      id: uuidv4(),
      appId: app.bundleId,
      title: app.name,
      isMinimized: false,
      isMaximized: false,
      position: { x: 0, y: 0 },
      size: { width: 390, height: 844 },
    });
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
