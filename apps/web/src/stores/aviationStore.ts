import { create } from 'zustand';

interface AviationStoreState {
  activeTab: string;
  selectedAircraftId: string | null;
  favorites: string[];
  searchQuery: string;
  searchFilters: Record<string, string>;
  setActiveTab: (tab: string) => void;
  setSelectedAircraft: (id: string | null) => void;
  setFavorites: (ids: string[]) => void;
  setSearchQuery: (q: string) => void;
  setSearchFilter: (key: string, value: string) => void;
}

export const useAviationStore = create<AviationStoreState>((set) => ({
  activeTab: 'home',
  selectedAircraftId: null,
  favorites: [],
  searchQuery: '',
  searchFilters: {},
  setActiveTab: (activeTab) => set({ activeTab }),
  setSelectedAircraft: (selectedAircraftId) => set({ selectedAircraftId }),
  setFavorites: (favorites) => set({ favorites }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSearchFilter: (key, value) =>
    set((s) => ({ searchFilters: { ...s.searchFilters, [key]: value } })),
}));
