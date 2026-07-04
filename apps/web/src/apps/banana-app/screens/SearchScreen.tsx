'use client';

import { useState, useCallback } from 'react';
import { useGulfStoreStore } from '../store/gulfStoreStore';
import { gulfStoreService } from '../services/gulfStoreService';
import { SearchBar } from '@/components/shared';
import { AppCard } from '../components/AppCard';

export function SearchScreen({ onAppPress }: { onAppPress: (bundleId: string) => void }) {
  const { searchQuery, searchResults, setSearchQuery, setSearchResults } = useGulfStoreStore();
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = useCallback(
    async (q: string) => {
      setSearchQuery(q);
      if (!q.trim()) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const results = await gulfStoreService.search(q);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [setSearchQuery, setSearchResults]
  );

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-2 pb-4">
        <h1 className="text-2xl font-bold text-white mb-4">Search</h1>
        <SearchBar
          value={searchQuery}
          onChange={handleSearch}
          placeholder="Apps, games, and more"
          onCancel={() => handleSearch('')}
          autoFocus
        />
      </div>

      <div className="flex-1 overflow-y-auto px-4">
        {isSearching ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-gulf-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : searchResults.length > 0 ? (
          <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
            {searchResults.map((app) => (
              <AppCard key={app.bundleId} app={app} onPress={() => onAppPress(app.bundleId)} />
            ))}
          </div>
        ) : searchQuery ? (
          <p className="text-center text-white/40 py-16 text-sm">No results for &quot;{searchQuery}&quot;</p>
        ) : (
          <p className="text-center text-white/40 py-16 text-sm">Search the GULF Store Store</p>
        )}
      </div>
    </div>
  );
}
