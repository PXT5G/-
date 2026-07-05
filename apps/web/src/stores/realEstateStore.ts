import { create } from 'zustand';

interface RealEstateProperty {
  propertyId: string;
  title: string;
  category: string;
  status: string;
  listPrice: number;
  rentPriceMonthly: number;
  bedrooms: number;
  location: { city: string; district: string };
}

interface RealEstateStoreState {
  activeTab: string;
  selectedPropertyId: string | null;
  favorites: string[];
  searchQuery: string;
  setActiveTab: (tab: string) => void;
  setSelectedProperty: (id: string | null) => void;
  setFavorites: (ids: string[]) => void;
  setSearchQuery: (q: string) => void;
}

export const useRealEstateStore = create<RealEstateStoreState>((set) => ({
  activeTab: 'home',
  selectedPropertyId: null,
  favorites: [],
  searchQuery: '',
  setActiveTab: (activeTab) => set({ activeTab }),
  setSelectedProperty: (selectedPropertyId) => set({ selectedPropertyId }),
  setFavorites: (favorites) => set({ favorites }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
}));

export type { RealEstateProperty };
