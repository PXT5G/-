import { create } from 'zustand';

interface MarineStoreState {
  activeTab: string;
  selectedVesselId: string | null;
  favorites: string[];
  searchQuery: string;
  searchFilters: Record<string, string>;
  setActiveTab: (tab: string) => void;
  setSelectedVessel: (id: string | null) => void;
  setFavorites: (ids: string[]) => void;
  setSearchQuery: (q: string) => void;
  setSearchFilter: (key: string, value: string) => void;
}

export const useMarineStore = create<MarineStoreState>((set) => ({
  activeTab: 'home',
  selectedVesselId: null,
  favorites: [],
  searchQuery: '',
  searchFilters: {},
  setActiveTab: (activeTab) => set({ activeTab }),
  setSelectedVessel: (selectedVesselId) => set({ selectedVesselId }),
  setFavorites: (favorites) => set({ favorites }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSearchFilter: (key, value) =>
    set((s) => ({ searchFilters: { ...s.searchFilters, [key]: value } })),
}));
