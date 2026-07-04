'use client';

import { useQuery } from '@tanstack/react-query';
import { bananaAppService } from '../services/bananaAppService';
import type { StoreApp } from '../types';
import { AppCard } from '../components/AppCard';

interface DeveloperScreenProps {
  slug: string;
  onBack: () => void;
  onAppPress: (bundleId: string) => void;
}

export function DeveloperScreen({ slug, onBack, onAppPress }: DeveloperScreenProps) {
  const { data: developer, isLoading } = useQuery({
    queryKey: ['store', 'developer', slug],
    queryFn: () => bananaAppService.getDeveloper(slug),
  });

  if (isLoading || !developer) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-banana-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 bg-black/90 backdrop-blur-xl border-b border-white/5">
        <button type="button" onClick={onBack} className="text-banana-gold text-sm">‹ Back</button>
        <h1 className="text-sm font-semibold text-white flex-1 truncate">Developer</h1>
      </div>

      <div className="px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-3xl">
            {developer.logo}
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              {developer.name}
              {developer.verified && <span className="text-banana-gold text-sm">✓</span>}
            </h2>
            <p className="text-xs text-white/50">{developer.appCount} apps</p>
          </div>
        </div>

        {developer.description && (
          <p className="text-sm text-white/70 mb-6 leading-relaxed">{developer.description}</p>
        )}

        {developer.website && (
          <p className="text-sm text-banana-gold mb-6">{developer.website}</p>
        )}

        <h3 className="text-xs font-semibold text-white/40 uppercase mb-3">Apps</h3>
        <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
          {developer.apps?.map((app: StoreApp) => (
            <AppCard key={app.bundleId} app={app} onPress={() => onAppPress(app.bundleId)} />
          ))}
        </div>
      </div>
    </div>
  );
}
