'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePremiumExperienceStore } from '@/stores/premiumExperienceStore';
import { useAppLibrary } from '@/hooks/usePremiumExperience';
import { useAppLaunch } from '@/hooks/useAppLaunch';
import { getApp } from '@/services/appRouter';
import { AppIcon } from './AppIcon';
import { useState } from 'react';
import { GlassPanel } from '@/components/ui/GlassPanel';
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
        <div className="flex-1 bg-black/50 backdrop-blur-md" onClick={() => setOpen(false)} />
        <motion.div
          className="max-h-[85%] overflow-hidden"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 35 }}
        >
          <GlassPanel className="rounded-t-3xl rounded-b-none p-4 h-full" intensity="high">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">App Library</h2>
              <button onClick={() => setOpen(false)} className="text-xs text-white/50">Close</button>
            </div>

            <input
              type="search"
              placeholder="Search apps..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full mb-4 px-4 py-2 rounded-xl bg-white/10 border border-white/10 text-white text-sm placeholder:text-white/40"
            />

            <div className="flex gap-2 mb-4">
              {(['categories', 'recent', 'suggestions'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => { tap(); setTab(t); }}
                  className={`px-3 py-1 rounded-full text-xs capitalize ${
                    tab === t ? 'bg-gulf-gold text-black' : 'bg-white/10 text-white/70'
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
          </GlassPanel>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
