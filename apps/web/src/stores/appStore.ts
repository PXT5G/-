import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { InstalledApp, AppFolder, HomePage } from '@/types';

interface AppState {
  installedApps: InstalledApp[];
  folders: AppFolder[];
  pages: HomePage[];
  currentPage: number;
  isLauncherOpen: boolean;
  setInstalledApps: (apps: InstalledApp[]) => void;
  addApp: (app: InstalledApp) => void;
  removeApp: (bundleId: string) => void;
  updateAppPosition: (bundleId: string, pageIndex: number, position: { row: number; col: number }, folderId?: string) => void;
  addFolder: (folder: AppFolder) => void;
  removeFolder: (folderId: string) => void;
  setCurrentPage: (page: number) => void;
  setLauncherOpen: (open: boolean) => void;
  getAppsForPage: (pageIndex: number) => InstalledApp[];
}

const GRID_COLS = 4;
const GRID_ROWS = 6;

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      installedApps: [],
      folders: [],
      pages: [{ index: 0, apps: [], widgets: [] }],
      currentPage: 0,
      isLauncherOpen: false,

      setInstalledApps: (installedApps) => set({ installedApps }),

      addApp: (app) =>
        set((s) => ({
          installedApps: [...s.installedApps, app],
        })),

      removeApp: (bundleId) =>
        set((s) => ({
          installedApps: s.installedApps.filter((a) => a.bundleId !== bundleId),
        })),

      updateAppPosition: (bundleId, pageIndex, position, folderId) =>
        set((s) => ({
          installedApps: s.installedApps.map((a) =>
            a.bundleId === bundleId
              ? { ...a, pageIndex, position, folderId }
              : a
          ),
        })),

      addFolder: (folder) =>
        set((s) => ({ folders: [...s.folders, folder] })),

      removeFolder: (folderId) =>
        set((s) => ({
          folders: s.folders.filter((f) => f.id !== folderId),
          installedApps: s.installedApps.map((a) =>
            a.folderId === folderId ? { ...a, folderId: undefined } : a
          ),
        })),

      setCurrentPage: (currentPage) => set({ currentPage }),

      setLauncherOpen: (isLauncherOpen) => set({ isLauncherOpen }),

      getAppsForPage: (pageIndex) =>
        get().installedApps.filter(
          (a) => a.pageIndex === pageIndex && !a.folderId
        ),
    }),
    { name: 'bananaos-apps' }
  )
);

export { GRID_COLS, GRID_ROWS };
