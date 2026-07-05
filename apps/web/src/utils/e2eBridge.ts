'use client';

import { useLockStore } from '@/stores/lockStore';
import { useOSStore } from '@/stores/osStore';
import { useControlCenterStore } from '@/stores/controlCenterStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useSearchStore } from '@/stores/searchStore';
import { usePremiumExperienceStore } from '@/stores/premiumExperienceStore';
import { usePhoneOsStore } from '@/stores/phoneOsStore';
import { useWindowManagerStore } from '@/stores/windowManagerStore';
import { getApp } from '@/services/appRouter';

export interface GulfOSE2EBridge {
  unlock: () => void;
  getPhase: () => string;
  isLocked: () => boolean;
  openControlCenter: () => void;
  openNotificationCenter: () => void;
  openSearch: () => void;
  openAppLibrary: () => void;
  openMultitasking: () => void;
  closeAllPanels: () => void;
  launchApp: (bundleId: string, name?: string) => boolean;
  closeAllApps: () => void;
}

declare global {
  interface Window {
    __GULFOS_E2E__?: GulfOSE2EBridge;
  }
}

export function initE2EBridge(): void {
  if (typeof window === 'undefined') return;

  window.__GULFOS_E2E__ = {
    unlock: () => {
      useLockStore.getState().unlock();
      useOSStore.getState().setPhase('home');
    },
    getPhase: () => useOSStore.getState().phase,
    isLocked: () => useLockStore.getState().isLocked,
    openControlCenter: () => useControlCenterStore.getState().open(),
    openNotificationCenter: () => useNotificationStore.getState().setCenterOpen(true),
    openSearch: () => useSearchStore.getState().open(),
    openAppLibrary: () => usePremiumExperienceStore.getState().setAppLibraryOpen(true),
    openMultitasking: () => usePhoneOsStore.getState().setMultitaskingOpen(true),
    closeAllPanels: () => {
      useControlCenterStore.getState().close();
      useNotificationStore.getState().setCenterOpen(false);
      useSearchStore.getState().close();
      usePremiumExperienceStore.getState().setAppLibraryOpen(false);
      usePhoneOsStore.getState().setMultitaskingOpen(false);
    },
    launchApp: (bundleId: string, name?: string) => {
      const manifest = getApp(bundleId);
      const title = name ?? manifest?.name ?? bundleId;
      useWindowManagerStore.getState().openWindow({
        id: crypto.randomUUID(),
        appId: bundleId,
        title,
        isMinimized: false,
        isMaximized: false,
        position: { x: 0, y: 0 },
        size: { width: 390, height: 844 },
      });
      return !!manifest;
    },
    closeAllApps: () => {
      const { windows, closeWindow } = useWindowManagerStore.getState();
      for (const w of windows) closeWindow(w.id);
    },
  };
}

if (typeof window !== 'undefined') {
  initE2EBridge();
}
