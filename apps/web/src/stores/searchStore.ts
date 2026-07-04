import { create } from 'zustand';
import type { SearchResult } from '@/types';

interface SearchState {
  isOpen: boolean;
  query: string;
  results: SearchResult[];
  recentSearches: string[];
  open: () => void;
  close: () => void;
  setQuery: (query: string) => void;
  setResults: (results: SearchResult[]) => void;
  addRecentSearch: (query: string) => void;
  clearRecent: () => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  isOpen: false,
  query: '',
  results: [],
  recentSearches: [],

  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false, query: '', results: [] }),
  setQuery: (query) => set({ query }),
  setResults: (results) => set({ results }),

  addRecentSearch: (query) =>
    set((s) => ({
      recentSearches: [query, ...s.recentSearches.filter((q) => q !== query)].slice(0, 10),
    })),

  clearRecent: () => set({ recentSearches: [] }),
}));
