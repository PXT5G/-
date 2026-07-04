'use client';

import { motion } from 'framer-motion';
import { useAppStore } from '@/stores/appStore';
import { useWindowManagerStore } from '@/stores/windowManagerStore';
import { useSound, useHaptic } from '@/hooks/useSound';
import { AppIcon } from './AppIcon';
import { WidgetRenderer } from './WidgetRenderer';
import { staggerContainer, staggerItem } from '@/animations/transitions';
import { useGestures } from '@/hooks/useGestures';
import { v4 as uuidv4 } from 'uuid';

const SYSTEM_APPS = [
  { bundleId: 'com.bananaos.settings', name: 'Settings', icon: '⚙️', isSystemApp: true, route: '/settings' },
];

export function HomeScreen() {
  const { currentPage, setCurrentPage, pages, getAppsForPage } = useAppStore();
  const openWindow = useWindowManagerStore((s) => s.openWindow);
  const { playTap } = useSound();
  const { tap } = useHaptic();

  const apps = getAppsForPage(currentPage);
  const displayApps = apps.length > 0 ? apps : SYSTEM_APPS.map((app, i) => ({
    ...app,
    id: app.bundleId,
    version: '1.0.0',
    description: '',
    category: 'system' as const,
    permissions: [],
    minOSVersion: '1.0.0',
    installedAt: new Date().toISOString(),
    pageIndex: 0,
    position: { row: Math.floor(i / 4), col: i % 4 },
  }));

  const handleAppPress = (app: typeof displayApps[0]) => {
    playTap();
    tap();
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

  const gestures = useGestures({
    onSwipeLeft: () => {
      if (currentPage < pages.length - 1) setCurrentPage(currentPage + 1);
    },
    onSwipeRight: () => {
      if (currentPage > 0) setCurrentPage(currentPage - 1);
    },
  });

  return (
    <motion.div
      className="absolute inset-0 flex flex-col pt-14 pb-24"
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
      {...gestures}
    >
      <WidgetRenderer pageIndex={currentPage} />

      <motion.div
        className="flex-1 px-6 grid grid-cols-4 grid-rows-6 gap-y-6 gap-x-4 content-start"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {displayApps.map((app) => (
          <motion.div key={app.bundleId} variants={staggerItem}>
            <AppIcon
              name={app.name}
              icon={app.icon}
              onPress={() => handleAppPress(app)}
            />
          </motion.div>
        ))}
      </motion.div>

      <div className="flex justify-center gap-1.5 pb-2">
        {pages.map((page) => (
          <button
            key={page.index}
            onClick={() => setCurrentPage(page.index)}
            className={`w-1.5 h-1.5 rounded-full transition-all ${
              page.index === currentPage ? 'bg-white w-4' : 'bg-white/30'
            }`}
            aria-label={`Page ${page.index + 1}`}
          />
        ))}
      </div>
    </motion.div>
  );
}
