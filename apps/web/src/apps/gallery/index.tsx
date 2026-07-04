'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useGalleryItems } from '@/hooks/useSystemApps';
import { systemAppsService } from '@/services/systemAppsService';
import { useHaptic } from '@/hooks/useSound';
import { useQuery } from '@tanstack/react-query';

type Tab = 'photos' | 'albums' | 'favorites' | 'more';

export function GalleryApp() {
  const { tap } = useHaptic();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('photos');
  const { data: items, isLoading } = useGalleryItems({ trashed: 'false' });
  const { data: favorites } = useGalleryItems({ favorite: 'true', trashed: 'false' });
  const { data: albums } = useQuery({ queryKey: ['gallery', 'albums'], queryFn: () => systemAppsService.getGalleryAlbums() });
  const { data: aiCats } = useQuery({ queryKey: ['gallery', 'ai'], queryFn: () => systemAppsService.getAiCategories(), enabled: tab === 'more' });
  const { data: timeline } = useQuery({ queryKey: ['gallery', 'timeline'], queryFn: () => systemAppsService.getMemoryTimeline(), enabled: tab === 'more' });
  const { data: storage } = useQuery({ queryKey: ['gallery', 'storage'], queryFn: () => systemAppsService.getGalleryStorage(), enabled: tab === 'more' });

  const favorite = useMutation({
    mutationFn: (id: string) => systemAppsService.toggleFavorite(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system-apps', 'gallery'] }),
  });

  const displayItems = tab === 'favorites' ? favorites : items;

  return (
    <div className="h-full flex flex-col bg-black">
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-gulf-gold border-t-transparent rounded-full animate-spin" /></div>
        ) : tab === 'albums' ? (
          <div className="grid grid-cols-2 gap-3">
            {(albums ?? []).map((a) => (
              <div key={String(a.albumId)} className="aspect-square rounded-2xl bg-white/5 border border-white/10 p-4 flex flex-col justify-end">
                <p className="text-white font-semibold text-sm">{String(a.name)}</p>
                <p className="text-white/40 text-xs">{Number(a.itemCount)} items</p>
              </div>
            ))}
          </div>
        ) : tab === 'more' ? (
          <>
            <section className="mb-6">
              <h2 className="text-xs text-white/40 uppercase mb-3">AI Categories</h2>
              {(aiCats ?? []).map((c) => (
                <div key={c.name} className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-white text-sm">{c.name}</span>
                  <span className="text-white/40 text-sm">{c.count}</span>
                </div>
              ))}
            </section>
            <section className="mb-6">
              <h2 className="text-xs text-white/40 uppercase mb-3">Memory Timeline</h2>
              {(timeline ?? []).map((t) => (
                <div key={t.month} className="flex justify-between py-2">
                  <span className="text-white text-sm">{t.month}</span>
                  <span className="text-gulf-gold text-sm">{t.count} photos</span>
                </div>
              ))}
            </section>
            {storage && (
              <section className="p-4 rounded-xl bg-white/5">
                <h2 className="text-xs text-white/40 uppercase mb-2">Storage</h2>
                <p className="text-white text-sm">{storage.totalItems} items · {(storage.totalBytes / 1e6).toFixed(1)} MB</p>
              </section>
            )}
          </>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {(displayItems ?? []).map((item) => (
              <button
                key={String(item.itemId)}
                type="button"
                onClick={() => { tap(); favorite.mutate(String(item.itemId)); }}
                className="aspect-square bg-white/5 relative overflow-hidden"
              >
                <span className="text-3xl absolute inset-0 flex items-center justify-center">{item.type === 'video' ? '🎬' : '📸'}</span>
                {item.favorite ? <span className="absolute top-1 right-1 text-xs">⭐</span> : null}
              </button>
            ))}
          </div>
        )}
      </div>
      <nav className="flex border-t border-white/10">
        {(['photos', 'albums', 'favorites', 'more'] as Tab[]).map((t) => (
          <button key={t} type="button" onClick={() => { tap(); setTab(t); }} className={`flex-1 py-3 text-xs capitalize ${tab === t ? 'text-gulf-gold' : 'text-white/40'}`}>{t}</button>
        ))}
      </nav>
    </div>
  );
}
