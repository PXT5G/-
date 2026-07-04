'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchStore } from '@/stores/searchStore';
import { useAppStore } from '@/stores/appStore';
import { useHaptic } from '@/hooks/useSound';
import { useAppLaunch } from '@/hooks/useAppLaunch';
import { GlassPanel } from '@/components/ui/GlassPanel';

export function Search() {
  const { isOpen, close, query, setQuery, recentSearches, addRecentSearch } = useSearchStore();
  const installedApps = useAppStore((s) => s.installedApps);
  const { launchApp } = useAppLaunch();
  const { tap } = useHaptic();

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return installedApps.filter(
      (app) =>
        app.name.toLowerCase().includes(q) ||
        app.bundleId.toLowerCase().includes(q)
    );
  }, [query, installedApps]);

  const handleSearch = (term: string) => {
    setQuery(term);
    if (term.trim()) addRecentSearch(term.trim());
  };

  const openApp = (app: typeof installedApps[0]) => {
    tap();
    void launchApp({ bundleId: app.bundleId, name: app.name });
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
                placeholder="Search apps, settings..."
                className="flex-1 bg-transparent text-white placeholder:text-white/40 outline-none text-sm"
                autoFocus
                aria-label="Search"
              />
              <button onClick={() => { tap(); close(); }} className="text-white/50 text-sm">
                Cancel
              </button>
            </div>
          </GlassPanel>

          <div className="flex-1 overflow-y-auto">
            {results.length > 0 ? (
              <div className="space-y-1">
                {results.map((app) => (
                  <button
                    key={app.bundleId}
                    onClick={() => openApp(app)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-colors"
                  >
                    <span className="text-2xl">{app.icon}</span>
                    <div className="text-left">
                      <p className="text-sm font-medium text-white">{app.name}</p>
                      <p className="text-xs text-white/40">{app.bundleId}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : query ? (
              <p className="text-center text-white/40 py-8 text-sm">No results found</p>
            ) : (
              <div>
                {recentSearches.length > 0 && (
                  <>
                    <p className="text-xs text-white/40 mb-2 px-1">Recent</p>
                    {recentSearches.map((term) => (
                      <button
                        key={term}
                        onClick={() => handleSearch(term)}
                        className="w-full text-left p-3 text-sm text-white/70 hover:bg-white/5 rounded-xl"
                      >
                        🕐 {term}
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
