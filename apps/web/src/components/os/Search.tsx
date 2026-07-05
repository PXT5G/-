'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchStore } from '@/stores/searchStore';
import { useAppStore } from '@/stores/appStore';
import { useHaptic } from '@/hooks/useSound';
import { useAppLaunch } from '@/hooks/useAppLaunch';
import { useGlobalSearch } from '@/hooks/usePhoneOs';
import { GlassPanel } from '@/components/ui/GlassPanel';
import type { GlobalSearchResult } from '@/types';

const CATEGORY_LABELS: Record<string, string> = {
  apps: 'Apps',
  messages: 'Messages',
  settings: 'Settings',
  businesses: 'Businesses',
  properties: 'Properties',
  vehicles: 'Vehicles',
  aircraft: 'Aircraft',
  marine: 'Marine',
  stocks: 'Stocks',
  notes: 'Notes',
  calendar: 'Calendar',
  police: 'Police',
  justice: 'Justice',
  ems: 'EMS',
};

export function Search() {
  const { isOpen, close, query, setQuery, recentSearches, addRecentSearch } = useSearchStore();
  const installedApps = useAppStore((s) => s.installedApps);
  const { launchApp } = useAppLaunch();
  const { tap } = useHaptic();
  const { data: globalResults, isFetching } = useGlobalSearch(query, isOpen);

  const localResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return installedApps
      .filter(
        (app) =>
          app.name.toLowerCase().includes(q) ||
          app.bundleId.toLowerCase().includes(q)
      )
      .map(
        (app): GlobalSearchResult => ({
          id: app.bundleId,
          category: 'apps',
          title: app.name,
          subtitle: app.bundleId,
          icon: app.icon,
          route: app.bundleId,
        })
      );
  }, [query, installedApps]);

  const results = useMemo(() => {
    if (globalResults?.results?.length) return globalResults.results;
    return localResults;
  }, [globalResults, localResults]);

  const grouped = useMemo(() => {
    const groups: Record<string, GlobalSearchResult[]> = {};
    for (const r of results) {
      if (!groups[r.category]) groups[r.category] = [];
      groups[r.category].push(r);
    }
    return groups;
  }, [results]);

  const handleSearch = (term: string) => {
    setQuery(term);
    if (term.trim()) addRecentSearch(term.trim());
  };

  const openResult = (result: GlobalSearchResult) => {
    tap();
    if (result.route) {
      void launchApp({ bundleId: result.route, name: result.title });
    }
    close();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="absolute inset-0 z-[50] flex flex-col bg-black/60 backdrop-blur-xl p-4 pt-14"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <GlassPanel className="p-3 mb-4" intensity="medium">
            <div className="flex items-center gap-3">
              <span className="text-white/50">🔍</span>
              <input
                type="search"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search apps, contacts, files, settings..."
                className="flex-1 bg-transparent text-white placeholder:text-white/40 outline-none text-sm"
                autoFocus
                aria-label="Global search"
              />
              <button onClick={() => { tap(); close(); }} className="text-white/50 text-sm">
                Cancel
              </button>
            </div>
          </GlassPanel>

          <div className="flex-1 overflow-y-auto">
            {isFetching && query.trim() && (
              <p className="text-center text-white/40 text-sm py-4">Searching...</p>
            )}

            {Object.keys(grouped).length > 0 ? (
              Object.entries(grouped).map(([category, items]) => (
                <div key={category} className="mb-4">
                  <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 px-1">
                    {CATEGORY_LABELS[category] ?? category}
                  </h3>
                  <div className="space-y-1">
                    {items.map((result) => (
                      <motion.button
                        key={`${category}-${result.id}`}
                        onClick={() => openResult(result)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-colors backdrop-blur-sm"
                        whileTap={{ scale: 0.98 }}
                      >
                        <span className="text-2xl">{result.icon ?? '📱'}</span>
                        <div className="text-left flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{result.title}</p>
                          {result.subtitle && (
                            <p className="text-xs text-white/40 truncate">{result.subtitle}</p>
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              ))
            ) : query.trim() ? (
              <p className="text-center text-white/40 py-8 text-sm">No results found</p>
            ) : (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                  Recent Searches
                </h3>
                {recentSearches.map((term) => (
                  <button
                    key={term}
                    onClick={() => handleSearch(term)}
                    className="w-full text-left p-3 rounded-xl hover:bg-white/10 text-sm text-white/70"
                  >
                    🔍 {term}
                  </button>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
