import { create } from 'zustand';

interface VehicleListing {
  vehicleId: string;
  brand: string;
  model: string;
  year: number;
  category: string;
  status: string;
  listPrice: number;
  mileage: number;
  color: string;
}

interface VehicleStoreState {
  activeTab: string;
  selectedVehicleId: string | null;
  favorites: string[];
  searchQuery: string;
  searchFilters: Record<string, string>;
  setActiveTab: (tab: string) => void;
  setSelectedVehicle: (id: string | null) => void;
  setFavorites: (ids: string[]) => void;
  setSearchQuery: (q: string) => void;
  setSearchFilter: (key: string, value: string) => void;
}

export const useVehicleStore = create<VehicleStoreState>((set) => ({
  activeTab: 'home',
  selectedVehicleId: null,
  favorites: [],
  searchQuery: '',
  searchFilters: {},
  setActiveTab: (activeTab) => set({ activeTab }),
  setSelectedVehicle: (selectedVehicleId) => set({ selectedVehicleId }),
  setFavorites: (favorites) => set({ favorites }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSearchFilter: (key, value) =>
    set((s) => ({ searchFilters: { ...s.searchFilters, [key]: value } })),
}));

export type { VehicleListing };
