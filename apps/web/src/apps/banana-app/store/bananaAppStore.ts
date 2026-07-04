import { create } from 'zustand';
import type {
  StoreApp,
  StoreCategory,
  StoreTab,
  InstalledStoreApp,
  StoreDownload,
  StoreSettings,
  ActiveInstall,
  StoreDeveloper,
} from '../types';

interface BananaAppState {
  activeTab: StoreTab;
  selectedCategory: string | null;
  selectedApp: StoreApp | null;
  selectedDeveloper: StoreDeveloper | null;
  featured: StoreApp[];
  trending: StoreApp[];
  recommended: StoreApp[];
  editorsChoice: StoreApp[];
  categories: StoreCategory[];
  categoryApps: StoreApp[];
  searchResults: StoreApp[];
  searchQuery: string;
  installed: InstalledStoreApp[];
  updates: InstalledStoreApp[];
  downloads: StoreDownload[];
  settings: StoreSettings;
  activeInstall: ActiveInstall | null;
  isLoading: boolean;
  error: string | null;

  setTab: (tab: StoreTab) => void;
  setSelectedCategory: (category: string | null) => void;
  setSelectedApp: (app: StoreApp | null) => void;
  setSelectedDeveloper: (dev: StoreDeveloper | null) => void;
  setFeatured: (apps: StoreApp[]) => void;
  setTrending: (apps: StoreApp[]) => void;
  setRecommended: (apps: StoreApp[]) => void;
  setEditorsChoice: (apps: StoreApp[]) => void;
  setCategories: (cats: StoreCategory[]) => void;
  setCategoryApps: (apps: StoreApp[]) => void;
  setSearchResults: (apps: StoreApp[]) => void;
  setSearchQuery: (q: string) => void;
  setInstalled: (apps: InstalledStoreApp[]) => void;
  setUpdates: (apps: InstalledStoreApp[]) => void;
  setDownloads: (downloads: StoreDownload[]) => void;
  setSettings: (settings: StoreSettings) => void;
  setActiveInstall: (install: ActiveInstall | null) => void;
  updateDownloadProgress: (downloadId: string, progress: number, status: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useBananaAppStore = create<BananaAppState>((set) => ({
  activeTab: 'today',
  selectedCategory: null,
  selectedApp: null,
  selectedDeveloper: null,
  featured: [],
  trending: [],
  recommended: [],
  editorsChoice: [],
  categories: [],
  categoryApps: [],
  searchResults: [],
  searchQuery: '',
  installed: [],
  updates: [],
  downloads: [],
  settings: { autoUpdate: true, cellularDownloads: false, notifyUpdates: true },
  activeInstall: null,
  isLoading: false,
  error: null,

  setTab: (activeTab) => set({ activeTab, selectedApp: null, selectedDeveloper: null }),
  setSelectedCategory: (selectedCategory) => set({ selectedCategory }),
  setSelectedApp: (selectedApp) => set({ selectedApp }),
  setSelectedDeveloper: (selectedDeveloper) => set({ selectedDeveloper }),
  setFeatured: (featured) => set({ featured }),
  setTrending: (trending) => set({ trending }),
  setRecommended: (recommended) => set({ recommended }),
  setEditorsChoice: (editorsChoice) => set({ editorsChoice }),
  setCategories: (categories) => set({ categories }),
  setCategoryApps: (categoryApps) => set({ categoryApps }),
  setSearchResults: (searchResults) => set({ searchResults }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setInstalled: (installed) => set({ installed }),
  setUpdates: (updates) => set({ updates }),
  setDownloads: (downloads) => set({ downloads }),
  setSettings: (settings) => set({ settings }),
  setActiveInstall: (activeInstall) => set({ activeInstall }),
  updateDownloadProgress: (downloadId, progress, status) =>
    set((s) => ({
      activeInstall:
        s.activeInstall?.downloadId === downloadId
          ? { ...s.activeInstall, progress, status }
          : s.activeInstall,
      downloads: s.downloads.map((d) =>
        d.id === downloadId ? { ...d, progress, status: status as StoreDownload['status'] } : d
      ),
    })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
