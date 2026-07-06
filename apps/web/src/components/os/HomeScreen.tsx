'use client';

import { motion } from 'framer-motion';
import { useAppStore } from '@/stores/appStore';
import { usePremiumExperienceStore } from '@/stores/premiumExperienceStore';
import { usePhoneOsStore } from '@/stores/phoneOsStore';
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
  const homeEditMode = usePhoneOsStore((s) => s.homeEditMode);
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
      className="absolute inset-0 flex flex-col pt-[62px] pb-[118px]"
      initial={shouldReduceMotion ? false : { scale: 1.08, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: unlockDuration, ease: [0.32, 0.72, 0, 1] }}
      style={{
        filter: profile?.homeBlurIntensity ? `blur(${profile.homeBlurIntensity * 0.05}px)` : undefined,
      }}
      {...gestures}
    >
      <WidgetRenderer pageIndex={currentPage} />

      {homeEditMode && (
        <div
          data-testid="gulfos-home-edit-mode"
          className="mx-7 mb-2 px-3 py-2 rounded-[14px] ios-material-thin text-center text-[13px] font-medium text-white"
        >
          Icons rearranged
        </div>
      )}

      {/* iOS home grid — 4 columns, generous vertical rhythm */}
      <motion.div
        className={cn('flex-1 px-[22px] grid grid-cols-4 gap-y-[26px] gap-x-[8px] content-start justify-items-center', iconSize)}
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {displayApps.map((app) => (
          <motion.div key={app.bundleId} variants={staggerItem}>
            <AppIcon
              name={app.name}
              icon={app.icon}
              bundleId={app.bundleId}
              onPress={() => handleAppPress(app)}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Page dots */}
      <div className="flex justify-center items-center gap-[9px] pb-1" role="tablist" aria-label="Home screen pages">
        {visiblePages.map((page) => (
          <motion.button
            key={page.index}
            onClick={() => { tap(); setCurrentPage(page.index); }}
            className={cn(
              'w-[8px] h-[8px] rounded-full',
              page.index === currentPage ? 'bg-white' : 'bg-white/35'
            )}
            animate={{ scale: page.index === currentPage ? 1 : 0.85 }}
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
