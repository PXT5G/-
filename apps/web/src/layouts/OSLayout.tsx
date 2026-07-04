'use client';

import { AnimatePresence } from 'framer-motion';
import { useOSStore } from '@/stores/osStore';
import { useLockStore } from '@/stores/lockStore';
import { useGestures } from '@/hooks/useGestures';
import { useControlCenterStore } from '@/stores/controlCenterStore';
import { useSearchStore } from '@/stores/searchStore';
import { SplashScreen } from '@/components/os/SplashScreen';
import { BootAnimation } from '@/components/os/BootAnimation';
import { LockScreen } from '@/components/os/LockScreen';
import { HomeScreen } from '@/components/os/HomeScreen';
import { Wallpaper } from '@/components/os/Wallpaper';
import { StatusBar } from '@/components/os/StatusBar';
import { DynamicIsland } from '@/components/os/DynamicIsland';
import { Dock } from '@/components/os/Dock';
import { ControlCenter } from '@/components/os/ControlCenter';
import { NotificationCenter } from '@/components/os/NotificationCenter';
import { Search } from '@/components/os/Search';
import { WindowManager } from '@/components/os/WindowManager';
import { PermissionDialog } from '@/components/os/PermissionDialog';
import { PhoneFrame } from '@/layouts/PhoneFrame';

export function OSLayout() {
  const phase = useOSStore((s) => s.phase);
  const isLocked = useLockStore((s) => s.isLocked);
  const openControlCenter = useControlCenterStore((s) => s.open);
  const openSearch = useSearchStore((s) => s.open);

  const gestures = useGestures({
    onSwipeDown: () => openControlCenter(),
    onLongPress: () => openSearch(),
  });

  const showHome = phase === 'home' || (phase === 'locked' && !isLocked);
  const showLock = isLocked && phase !== 'splash' && phase !== 'booting';

  return (
    <PhoneFrame>
      <div className="relative w-full h-full overflow-hidden" {...gestures}>
        <Wallpaper />

        <AnimatePresence mode="wait">
          {phase === 'splash' && <SplashScreen key="splash" />}
          {phase === 'booting' && <BootAnimation key="boot" />}
        </AnimatePresence>

        {(showHome || showLock) && (
          <>
            <StatusBar />
            <DynamicIsland />
          </>
        )}

        <AnimatePresence>
          {showLock && <LockScreen key="lock" />}
        </AnimatePresence>

        {showHome && !showLock && (
          <>
            <HomeScreen />
            <Dock />
          </>
        )}

        <ControlCenter />
        <NotificationCenter />
        <Search />
        <WindowManager />
        <PermissionDialog />
      </div>
    </PhoneFrame>
  );
}
