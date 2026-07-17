import { create } from 'zustand';

type Tab = 'home' | 'markets' | 'stocks' | 'portfolio' | 'orders' | 'news' | 'watchlist' | 'analytics' | 'more';

interface ExchangeState {
  activeTab: Tab;
  selectedStockId: string | null;
  searchQuery: string;
  setActiveTab: (tab: Tab) => void;
  setSelectedStockId: (id: string | null) => void;
  setSearchQuery: (q: string) => void;
}

export const useExchangeStore = create<ExchangeState>((set) => ({
  activeTab: 'home',
  selectedStockId: null,
  searchQuery: '',
  setActiveTab: (activeTab) => set({ activeTab }),
  setSelectedStockId: (selectedStockId) => set({ selectedStockId }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
}));
