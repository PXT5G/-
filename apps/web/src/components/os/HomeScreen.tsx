'use client';

import { motion } from 'framer-motion';
import { useAppStore } from '@/stores/appStore';
import { usePremiumExperienceStore } from '@/stores/premiumExperienceStore';
import { AppIcon } from './AppIcon';
import { WidgetRenderer } from './WidgetRenderer';
import { staggerContainer, staggerItem } from '@/animations/transitions';
import { useMotionPreference } from '@/hooks/useMotionPreference';
import { useGestures } from '@/hooks/useGestures';
import { useAppLaunch } from '@/hooks/useAppLaunch';
import { useHaptic } from '@/hooks/useSound';
import { cn } from '@/utils/cn';

const SYSTEM_APPS = [
  { bundleId: 'com.gulfos.store', name: 'GULF Store', icon: '🏬', isSystemApp: true, route: '/store' },
  { bundleId: 'com.gulfos.settings', name: 'Settings', icon: '⚙️', isSystemApp: true, route: '/settings' },
];

const ICON_SIZE_MAP = { small: 'text-xs', medium: 'text-sm', large: 'text-base' };

export function HomeScreen() {
  const { currentPage, setCurrentPage, pages, getAppsForPage } = useAppStore();
  const profile = usePremiumExperienceStore((s) => s.profile);
  const setAppLibraryOpen = usePremiumExperienceStore((s) => s.setAppLibraryOpen);
  const { launchApp } = useAppLaunch();
  const { tap } = useHaptic();
  const { spring, unlockDuration, shouldReduceMotion } = useMotionPreference();

  const hiddenPages = new Set(profile?.hiddenPageIndexes ?? []);
  const visiblePages = pages.filter((p) => !hiddenPages.has(p.index));
  const iconSize = ICON_SIZE_MAP[profile?.iconSize as keyof typeof ICON_SIZE_MAP] ?? ICON_SIZE_MAP.medium;

  const apps = getAppsForPage(currentPage);
  const hiddenApps = new Set(profile?.hiddenApps ?? []);
  const displayApps = (apps.length > 0 ? apps : SYSTEM_APPS.map((app, i) => ({
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
  }))).filter((a) => !hiddenApps.has(a.bundleId));

  const handleAppPress = (app: typeof displayApps[0]) => {
    void launchApp({ bundleId: app.bundleId, name: app.name });
  };

  const gestures = useGestures({
    onSwipeLeft: () => {
      const idx = visiblePages.findIndex((p) => p.index === currentPage);
      if (idx < visiblePages.length - 1) setCurrentPage(visiblePages[idx + 1].index);
    },
    onSwipeRight: () => {
      const idx = visiblePages.findIndex((p) => p.index === currentPage);
      if (idx > 0) setCurrentPage(visiblePages[idx - 1].index);
    },
    onLongPress: () => {
      tap();
      setAppLibraryOpen(true);
    },
  });

  return (
    <motion.div
      data-testid="gulfos-home-screen"
      className="absolute inset-0 flex flex-col pt-14 pb-24"
      initial={shouldReduceMotion ? false : { scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: unlockDuration, ease: [0.32, 0.72, 0, 1] }}
      style={{
        filter: profile?.homeBlurIntensity ? `blur(${profile.homeBlurIntensity * 0.05}px)` : undefined,
      }}
      {...gestures}
    >
      <WidgetRenderer pageIndex={currentPage} />

      <motion.div
        className={cn('flex-1 px-6 grid grid-cols-4 grid-rows-6 gap-y-6 gap-x-4 content-start', iconSize)}
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

      <div className="flex justify-center gap-1.5 pb-2" role="tablist" aria-label="Home screen pages">
        {visiblePages.map((page) => (
          <motion.button
            key={page.index}
            onClick={() => { tap(); setCurrentPage(page.index); }}
            className={cn(
              'h-1.5 rounded-full',
              page.index === currentPage ? 'bg-white' : 'bg-white/30'
            )}
            animate={{ width: page.index === currentPage ? 16 : 6 }}
            transition={spring}
            aria-label={`Page ${page.index + 1}`}
            aria-selected={page.index === currentPage}
            role="tab"
          />
        ))}
      </div>
    </motion.div>
  );
}
