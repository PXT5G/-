'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePremiumExperienceStore } from '@/stores/premiumExperienceStore';
import { useAppLibrary } from '@/hooks/usePremiumExperience';
import { useAppLaunch } from '@/hooks/useAppLaunch';
import { getApp } from '@/services/appRouter';
import { AppIcon } from './AppIcon';
import { useState } from 'react';
import { useHaptic } from '@/hooks/useSound';

interface AppEntry {
  bundleId: string;
  name: string;
  icon?: string;
  category?: string;
}

export function AppLibrary() {
  const isOpen = usePremiumExperienceStore((s) => s.isAppLibraryOpen);
  const setOpen = usePremiumExperienceStore((s) => s.setAppLibraryOpen);
  const { data } = useAppLibrary(isOpen);
  const { launchApp } = useAppLaunch();
  const { tap } = useHaptic();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'categories' | 'recent' | 'suggestions'>('categories');

  if (!isOpen) return null;

  const library = data as {
    categories?: Record<string, AppEntry[]>;
    recentlyAdded?: AppEntry[];
    mostUsed?: AppEntry[];
    suggestions?: AppEntry[];
    hidden?: string[];
  } | null;

  const categories = library?.categories ?? {};
  const recent = library?.recentlyAdded ?? library?.mostUsed ?? [];
  const suggestions = library?.suggestions ?? [];

  const filteredCategories = Object.entries(categories).reduce<Record<string, AppEntry[]>>(
    (acc, [cat, apps]) => {
      const filtered = apps.filter(
        (a) =>
          !search ||
          a.name.toLowerCase().includes(search.toLowerCase()) ||
          a.bundleId.toLowerCase().includes(search.toLowerCase())
      );
      if (filtered.length > 0) acc[cat] = filtered;
      return acc;
    },
    {}
  );

  const handleLaunch = (app: AppEntry) => {
    tap();
    const manifest = getApp(app.bundleId);
    void launchApp({ bundleId: app.bundleId, name: manifest?.name ?? app.name });
    setOpen(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="absolute inset-0 z-[47] flex flex-col"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="flex-1 bg-black/40 backdrop-blur-[6px]" onClick={() => setOpen(false)} />
        <motion.div
          className="max-h-[85%] overflow-hidden"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 320, damping: 34 }}
        >
          <div className="ios-material-thick rounded-t-[34px] p-5 h-full">
            {/* Sheet grabber */}
            <div className="mx-auto w-[36px] h-[5px] rounded-full bg-white/30 mb-4" />
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[22px] font-bold font-display text-white">App Library</h2>
              <button
                onClick={() => setOpen(false)}
                className="w-[30px] h-[30px] rounded-full bg-ios-fill-tertiary flex items-center justify-center text-white/80"
                aria-label="Close"
              >
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden>
                  <path d="M1 1l9 9M10 1l-9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <input
              type="search"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full mb-4 px-4 h-[36px] rounded-[12px] bg-[rgba(118,118,128,0.24)] text-white text-[17px] placeholder:text-[rgba(235,235,245,0.6)] outline-none"
            />

            <div className="flex p-[2px] rounded-[9px] bg-ios-fill-tertiary w-fit mb-4">
              {(['categories', 'recent', 'suggestions'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => { tap(); setTab(t); }}
                  className={`px-4 py-[5px] rounded-[7px] text-[13px] font-medium capitalize transition-colors ${
                    tab === t ? 'bg-[#636366] text-white shadow-sm' : 'text-white/60'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="overflow-y-auto max-h-[55vh] space-y-4">
              {tab === 'categories' &&
                Object.entries(filteredCategories).map(([category, apps]) => (
                  <div key={category}>
                    <p className="text-xs font-semibold text-white/50 uppercase mb-2">{category}</p>
                    <div className="grid grid-cols-4 gap-3">
                      {apps.map((app) => (
                        <AppIcon
                          key={app.bundleId}
                          name={app.name}
                          icon={app.icon ?? getApp(app.bundleId)?.icon ?? '📱'}
                          bundleId={app.bundleId}
                          size="sm"
                          onPress={() => handleLaunch(app)}
                        />
                      ))}
                    </div>
                  </div>
                ))}

              {tab === 'recent' && (
                <div className="grid grid-cols-4 gap-3">
                  {recent.map((app) => (
                    <AppIcon
                      key={app.bundleId}
                      name={app.name}
                      icon={app.icon ?? getApp(app.bundleId)?.icon ?? '📱'}
                      bundleId={app.bundleId}
                      size="sm"
                      onPress={() => handleLaunch(app)}
                    />
                  ))}
                  {recent.length === 0 && (
                    <p className="col-span-4 text-center text-white/40 text-sm py-8">No recent apps</p>
                  )}
                </div>
              )}

              {tab === 'suggestions' && (
                <div className="grid grid-cols-4 gap-3">
                  {suggestions.map((app) => (
                    <AppIcon
                      key={app.bundleId}
                      name={app.name}
                      icon={app.icon ?? getApp(app.bundleId)?.icon ?? '📱'}
                      bundleId={app.bundleId}
                      size="sm"
                      onPress={() => handleLaunch(app)}
                    />
                  ))}
                  {suggestions.length === 0 && (
                    <p className="col-span-4 text-center text-white/40 text-sm py-8">No suggestions yet</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
