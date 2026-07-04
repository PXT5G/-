import { create } from 'zustand';
import type { WindowState } from '@/types';

interface WindowManagerState {
  windows: WindowState[];
  activeWindowId: string | null;
  openWindow: (window: Omit<WindowState, 'zIndex' | 'isFocused'>) => void;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  updateWindow: (id: string, updates: Partial<WindowState>) => void;
  getActiveWindow: () => WindowState | undefined;
  getOpenWindows: () => WindowState[];
}

let zIndexCounter = 100;

export const useWindowManagerStore = create<WindowManagerState>((set, get) => ({
  windows: [],
  activeWindowId: null,

  openWindow: (windowData) => {
    zIndexCounter += 1;
    const newWindow: WindowState = {
      ...windowData,
      zIndex: zIndexCounter,
      isFocused: true,
    };

    set((s) => ({
      windows: [
        ...s.windows.map((w) => ({ ...w, isFocused: false })),
        newWindow,
      ],
      activeWindowId: newWindow.id,
    }));
  },

  closeWindow: (id) =>
    set((s) => {
      const windows = s.windows.filter((w) => w.id !== id);
      const activeWindowId =
        s.activeWindowId === id
          ? windows.length > 0
            ? windows[windows.length - 1].id
            : null
          : s.activeWindowId;
      return { windows, activeWindowId };
    }),

  minimizeWindow: (id) =>
    set((s) => ({
      windows: s.windows.map((w) =>
        w.id === id ? { ...w, isMinimized: true, isFocused: false } : w
      ),
      activeWindowId: s.activeWindowId === id ? null : s.activeWindowId,
    })),

  maximizeWindow: (id) =>
    set((s) => ({
      windows: s.windows.map((w) =>
        w.id === id ? { ...w, isMaximized: !w.isMaximized } : w
      ),
    })),

  focusWindow: (id) => {
    zIndexCounter += 1;
    set((s) => ({
      windows: s.windows.map((w) => ({
        ...w,
        isFocused: w.id === id,
        zIndex: w.id === id ? zIndexCounter : w.zIndex,
        isMinimized: w.id === id ? false : w.isMinimized,
      })),
      activeWindowId: id,
    }));
  },

  updateWindow: (id, updates) =>
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, ...updates } : w)),
    })),

  getActiveWindow: () => get().windows.find((w) => w.id === get().activeWindowId),

  getOpenWindows: () => get().windows.filter((w) => !w.isMinimized),
}));
