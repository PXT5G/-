'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchStore } from '@/stores/searchStore';
import { useAppStore } from '@/stores/appStore';
import { useHaptic } from '@/hooks/useSound';
import { useAppLaunch } from '@/hooks/useAppLaunch';
import { useGlobalSearch } from '@/hooks/usePhoneOs';
import { getAllApps } from '@/services/appRouter';
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
    const seen = new Set<string>();
    const candidates = [
      ...installedApps,
      // Registered system apps are always searchable, mirroring iOS Spotlight
      ...getAllApps().map((m) => ({ bundleId: m.bundleId, name: m.name, icon: m.icon })),
    ].filter((app) => {
      if (seen.has(app.bundleId)) return false;
      seen.add(app.bundleId);
      return true;
    });
    return candidates
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
          className="absolute inset-0 z-[50] flex flex-col ios-material-thick px-[13px] pt-[70px]"
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
        >
          {/* Spotlight search field */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 flex items-center gap-[6px] rounded-[12px] bg-[rgba(118,118,128,0.24)] px-[10px] h-[38px]">
              <svg width="17" height="17" viewBox="0 0 17 17" fill="none" className="text-[rgba(235,235,245,0.6)] shrink-0" aria-hidden>
                <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.7" />
                <path d="M11.5 11.5L15.5 15.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
              <input
                type="search"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search"
                className="flex-1 bg-transparent text-white placeholder:text-[rgba(235,235,245,0.6)] outline-none text-[17px]"
                autoFocus
                aria-label="Global search"
              />
            </div>
            <button onClick={() => { tap(); close(); }} className="text-gulf-gold text-[17px] shrink-0">
              Cancel
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isFetching && query.trim() && (
              <p className="text-center text-white/40 text-sm py-4">Searching...</p>
            )}

            {Object.keys(grouped).length > 0 ? (
              Object.entries(grouped).map(([category, items]) => (
                <div key={category} className="mb-5">
                  <h3 className="text-[13px] font-semibold text-ios-label-secondary uppercase mb-[7px] px-3">
                    {CATEGORY_LABELS[category] ?? category}
                  </h3>
                  <div className="rounded-[12px] bg-[#1C1C1E]/80 overflow-hidden divide-y divide-[rgba(84,84,88,0.4)]">
                    {items.map((result) => (
                      <motion.button
                        key={`${category}-${result.id}`}
                        onClick={() => openResult(result)}
                        className="w-full flex items-center gap-3 px-4 min-h-[52px] py-2 active:bg-[#2C2C2E] transition-colors"
                        whileTap={{ scale: 0.99 }}
                      >
                        <span className="text-[26px]">{result.icon ?? '📱'}</span>
                        <div className="text-left flex-1 min-w-0">
                          <p className="text-[17px] text-white truncate leading-tight">{result.title}</p>
                          {result.subtitle && (
                            <p className="text-[13px] text-ios-label-secondary truncate">{result.subtitle}</p>
                          )}
                        </div>
                        <svg width="8" height="14" viewBox="0 0 8 14" fill="none" className="text-[rgba(235,235,245,0.3)] shrink-0" aria-hidden>
                          <path d="M1 1l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </motion.button>
                    ))}
                  </div>
                </div>
              ))
            ) : query.trim() ? (
              <p className="text-center text-ios-label-secondary py-8 text-[17px]">No Results</p>
            ) : (
              <div>
                <h3 className="text-[13px] font-semibold text-ios-label-secondary uppercase mb-[7px] px-3">
                  Recent Searches
                </h3>
                <div className="rounded-[12px] bg-[#1C1C1E]/80 overflow-hidden divide-y divide-[rgba(84,84,88,0.4)]">
                  {recentSearches.map((term) => (
                    <button
                      key={term}
                      onClick={() => handleSearch(term)}
                      className="w-full text-left px-4 min-h-[44px] py-2 text-[17px] text-white/80 active:bg-[#2C2C2E] flex items-center gap-3"
                    >
                      <svg width="15" height="15" viewBox="0 0 17 17" fill="none" className="text-[rgba(235,235,245,0.4)]" aria-hidden>
                        <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.7" />
                        <path d="M11.5 11.5L15.5 15.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                      </svg>
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
