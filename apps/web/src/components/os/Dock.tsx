'use client';

import { motion } from 'framer-motion';
import { dockAnimation } from '@/animations/transitions';
import { AppIcon } from './AppIcon';
import { useSearchStore } from '@/stores/searchStore';
import { usePremiumExperienceStore } from '@/stores/premiumExperienceStore';
import { useSound, useHaptic } from '@/hooks/useSound';
import { useAppLaunch } from '@/hooks/useAppLaunch';
import { getApp } from '@/services/appRouter';

const DEFAULT_DOCK = [
  'com.gulfos.phone',
  'com.gulfos.chat',
  'com.gulfos.store',
  'com.gulfos.settings',
];

const FALLBACK_APPS: Record<string, { name: string; icon: string }> = {
  'com.gulfos.phone': { name: 'Phone', icon: '📞' },
  'com.gulfos.chat': { name: 'GULF Chat', icon: '💬' },
  'com.gulfos.store': { name: 'GULF Store', icon: '🏬' },
  'com.gulfos.settings': { name: 'Settings', icon: '⚙️' },
  'com.gulfos.search': { name: 'Search', icon: '🔍' },
};

export function Dock() {
  const openSearch = useSearchStore((s) => s.open);
  const profile = usePremiumExperienceStore((s) => s.profile);
  const { launchApp } = useAppLaunch();
  const { playTap } = useSound();
  const { tap } = useHaptic();

  const dockBundleIds = profile?.dockApps?.length ? profile.dockApps : DEFAULT_DOCK;

  const dockApps = dockBundleIds.map((bundleId) => {
    const manifest = getApp(bundleId);
    const fallback = FALLBACK_APPS[bundleId];
    return {
      bundleId,
      name: manifest?.name ?? fallback?.name ?? bundleId,
      icon: manifest?.icon ?? fallback?.icon ?? '📱',
    };
  });

  const handlePress = (app: typeof dockApps[0]) => {
    if (app.bundleId === 'com.gulfos.search') {
      playTap();
      tap();
      openSearch();
      return;
    }
    void launchApp({ bundleId: app.bundleId, name: app.name });
  };

  return (
    <motion.div
      data-testid="gulfos-dock"
      className="absolute bottom-[14px] left-[13px] right-[13px] z-30"
      {...dockAnimation}
    >
      {/* iOS dock — frosted material, no labels */}
      <div className="ios-material-widget rounded-[34px] px-[14px] pt-[15px] pb-[15px]">
        <div className="flex items-center justify-around">
          {dockApps.map((app) => (
            <AppIcon
              key={app.bundleId}
              name={app.name}
              icon={app.icon}
              bundleId={app.bundleId}
              size="sm"
              showLabel={false}
              onPress={() => handlePress(app)}
            />
          ))}
        </div>
      </div>
      {/* Home indicator */}
      <div className="mx-auto mt-[10px] w-[148px] h-[5px] rounded-full bg-white/95" />
    </motion.div>
  );
}
