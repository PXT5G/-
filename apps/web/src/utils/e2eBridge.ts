'use client';

import { useLockStore } from '@/stores/lockStore';
import { useOSStore } from '@/stores/osStore';
import { useControlCenterStore } from '@/stores/controlCenterStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useSearchStore } from '@/stores/searchStore';
import { usePremiumExperienceStore } from '@/stores/premiumExperienceStore';
import { usePhoneOsStore } from '@/stores/phoneOsStore';
import { useWindowManagerStore } from '@/stores/windowManagerStore';
import { useAppStore } from '@/stores/appStore';
import { useAuthStore } from '@/stores/authStore';
import { useGulfStoreStore } from '@/apps/banana-app/store/gulfStoreStore';
import { getApp } from '@/services/appRouter';
import type { User } from '@/types';

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
  shutdown: () => void;
  swipeHome: () => void;
  lock: () => void;
  applySession: (token: string, user: User) => void;
  openPictureInPicture: (bundleId?: string, title?: string) => void;
  closePictureInPicture: () => void;
  swapHomeIcons: () => void;
  dismissStoreInstall: () => void;
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
    shutdown: () => {
      const { windows, closeWindow } = useWindowManagerStore.getState();
      for (const w of windows) closeWindow(w.id);
      useControlCenterStore.getState().close();
      useNotificationStore.getState().setCenterOpen(false);
      useSearchStore.getState().close();
      usePremiumExperienceStore.getState().setAppLibraryOpen(false);
      usePhoneOsStore.getState().setMultitaskingOpen(false);
      useLockStore.getState().lock();
      useOSStore.getState().reset();
    },
    swipeHome: () => {
      useLockStore.getState().unlock();
      useOSStore.getState().setPhase('home');
    },
    lock: () => {
      const { windows, closeWindow } = useWindowManagerStore.getState();
      for (const w of windows) closeWindow(w.id);
      useControlCenterStore.getState().close();
      useNotificationStore.getState().setCenterOpen(false);
      useSearchStore.getState().close();
      usePremiumExperienceStore.getState().setAppLibraryOpen(false);
      usePhoneOsStore.getState().setMultitaskingOpen(false);
      useLockStore.getState().lock();
      useOSStore.getState().setPhase('locked');
    },
    applySession: (token, user) => {
      const tokens = { accessToken: token, refreshToken: token, expiresIn: 3600 };
      useAuthStore.getState().login(user, tokens);
    },
    openPictureInPicture: (bundleId = 'com.gulfos.phone', title = 'Phone') => {
      const manifest = getApp(bundleId);
      usePhoneOsStore.getState().setPipWindow({
        title: title ?? manifest?.name ?? 'App',
        icon: manifest?.icon ?? '📱',
      });
    },
    closePictureInPicture: () => {
      usePhoneOsStore.getState().setPipWindow(null);
    },
    swapHomeIcons: () => {
      const apps = useAppStore.getState().installedApps;
      if (apps.length < 2) return;
      const a = apps[0];
      const b = apps[1];
      const { updateAppPosition } = useAppStore.getState();
      const defaultPos = { row: 0, col: 0 };
      updateAppPosition(a.bundleId, a.pageIndex ?? 0, b.position ?? defaultPos);
      updateAppPosition(b.bundleId, b.pageIndex ?? 0, a.position ?? defaultPos);
      usePhoneOsStore.getState().setHomeEditMode(true);
      setTimeout(() => usePhoneOsStore.getState().setHomeEditMode(false), 2000);
    },
    dismissStoreInstall: () => {
      useGulfStoreStore.getState().setActiveInstall(null);
      useGulfStoreStore.getState().setTab('today');
    },
  };
}

if (typeof window !== 'undefined') {
  initE2EBridge();
}
