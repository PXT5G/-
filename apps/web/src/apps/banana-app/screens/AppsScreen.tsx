'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useGulfStoreStore } from '../store/gulfStoreStore';
import { gulfStoreService } from '../services/gulfStoreService';
import { AppCard } from '../components/AppCard';
import { cn } from '@/utils/cn';

export function AppsScreen({ onAppPress }: { onAppPress: (bundleId: string) => void }) {
  const { categories, selectedCategory, categoryApps, setCategories, setCategoryApps, setSelectedCategory } =
    useGulfStoreStore();

  const { data: cats } = useQuery({
    queryKey: ['store', 'categories'],
    queryFn: () => gulfStoreService.getCategories(),
  });

  useEffect(() => {
    if (cats) setCategories(cats);
  }, [cats, setCategories]);

  const activeCategory = selectedCategory ?? categories[0]?.id;

  const { data: apps, isLoading } = useQuery({
    queryKey: ['store', 'category', activeCategory],
    queryFn: () => (activeCategory ? gulfStoreService.getByCategory(activeCategory) : Promise.resolve([])),
    enabled: !!activeCategory,
  });

  useEffect(() => {
    if (apps) setCategoryApps(apps);
  }, [apps, setCategoryApps]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-2 pb-3">
        <h1 className="text-2xl font-bold text-white mb-4">Categories</h1>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors',
                activeCategory === cat.id
                  ? 'bg-gulf-gold text-black'
                  : 'bg-white/10 text-white/70'
              )}
            >
              <span>{cat.icon}</span>
              {cat.name}
              <span className="opacity-60">({cat.count})</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-gulf-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : categoryApps.length === 0 ? (
          <p className="text-center text-white/40 py-16 text-sm">No apps in this category</p>
        ) : (
          <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden mb-4">
            {categoryApps.map((app) => (
              <AppCard key={app.bundleId} app={app} onPress={() => onAppPress(app.bundleId)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
