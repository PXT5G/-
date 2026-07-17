'use client';

import { useCallback, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useWindowManagerStore } from '@/stores/windowManagerStore';
import { useSound, useHaptic } from '@/hooks/useSound';
import { deviceStorageService } from '@/services/deviceStorageService';
import { premiumExperienceService } from '@/services/premiumExperienceService';
import { useDynamicIslandStore } from '@/stores/dynamicIslandStore';
import type { WindowState } from '@/types';

interface AppLaunchTarget {
  bundleId: string;
  name: string;
}

export function useAppLaunch() {
  const openWindow = useWindowManagerStore((s) => s.openWindow);
  const { playTap } = useSound();
  const { tap } = useHaptic();
  const islandShow = useDynamicIslandStore((s) => s.show);
  const islandHide = useDynamicIslandStore((s) => s.hide);
  const [memoryError, setMemoryError] = useState<string | null>(null);

  const launchApp = useCallback(async (app: AppLaunchTarget) => {
    playTap();
    tap();

    try {
      const result = await deviceStorageService.launchApp(app.bundleId);
      if (!result.allowed) {
        setMemoryError(result.reason ?? 'Insufficient memory');
        islandShow({
          mode: 'compact',
          title: 'Cannot Open',
          subtitle: result.reason ?? 'Close other apps first',
          icon: '⚠️',
        });
        setTimeout(() => islandHide(), 4000);
        return false;
      }
    } catch {
      // Allow offline launch if API unavailable
    }

    const windowData: Omit<WindowState, 'zIndex' | 'isFocused'> = {
      id: uuidv4(),
      appId: app.bundleId,
      title: app.name,
      isMinimized: false,
      isMaximized: false,
      position: { x: 0, y: 0 },
      size: { width: 390, height: 844 },
    };
    openWindow(windowData);
    setMemoryError(null);
    premiumExperienceService.trackAppUsage(app.bundleId).catch(() => {});
    return true;
  }, [openWindow, playTap, tap, islandShow, islandHide]);

  const backgroundApp = useCallback((bundleId: string) => {
    deviceStorageService.backgroundApp(bundleId).catch(() => {});
  }, []);

  const stopApp = useCallback((bundleId: string) => {
    deviceStorageService.stopApp(bundleId).catch(() => {});
  }, []);

  return { launchApp, backgroundApp, stopApp, memoryError };
}
