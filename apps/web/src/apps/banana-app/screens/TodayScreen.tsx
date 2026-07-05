'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useGulfStoreStore } from '../store/gulfStoreStore';
import { gulfStoreService } from '../services/gulfStoreService';
import { useGulfStoreAuth } from '../hooks/useGulfStoreAuth';
import { AppCard } from '../components/AppCard';

export function TodayScreen({ onAppPress }: { onAppPress: (bundleId: string) => void }) {
  const { featured, trending, editorsChoice, recommended, setFeatured, setTrending, setEditorsChoice, setRecommended } =
    useGulfStoreStore();
  const { storeReady } = useGulfStoreAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['store', 'today'],
    queryFn: async () => {
      const [f, t, e, r] = await Promise.all([
        gulfStoreService.getFeatured(),
        gulfStoreService.getTrending(),
        gulfStoreService.getEditorsChoice(),
        gulfStoreService.getRecommended(),
      ]);
      return { featured: f, trending: t, editorsChoice: e, recommended: r };
    },
    enabled: storeReady,
  });

  useEffect(() => {
    if (data) {
      setFeatured(data.featured);
      setTrending(data.trending);
      setEditorsChoice(data.editorsChoice);
      setRecommended(data.recommended);
    }
  }, [data, setFeatured, setTrending, setEditorsChoice, setRecommended]);

  if (!storeReady || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-gulf-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="overflow-y-auto h-full pb-4">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="px-4 pt-2">
        <h1 className="text-2xl font-bold text-white mb-1">GULF Store</h1>
        <p className="text-sm text-white/50 mb-6">Premium apps for GULFOS</p>

        {featured.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Featured</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              {featured.map((app) => (
                <AppCard key={app.bundleId} app={app} variant="large" onPress={() => onAppPress(app.bundleId)} />
              ))}
            </div>
          </section>
        )}

        {editorsChoice.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Editor&apos;s Choice</h2>
            <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
              {editorsChoice.slice(0, 3).map((app) => (
                <AppCard key={app.bundleId} app={app} onPress={() => onAppPress(app.bundleId)} />
              ))}
            </div>
          </section>
        )}

        {trending.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Trending</h2>
            <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
              {trending.slice(0, 5).map((app) => (
                <AppCard key={app.bundleId} app={app} onPress={() => onAppPress(app.bundleId)} />
              ))}
            </div>
          </section>
        )}

        {recommended.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Recommended</h2>
            <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
              {recommended.slice(0, 4).map((app) => (
                <AppCard key={app.bundleId} app={app} onPress={() => onAppPress(app.bundleId)} />
              ))}
            </div>
          </section>
        )}
      </motion.div>
    </div>
  );
}
