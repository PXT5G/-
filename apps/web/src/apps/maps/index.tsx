'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { systemAppsService } from '@/services/systemAppsService';
import { useMapsState } from '@/hooks/useSystemApps';
import { useHaptic } from '@/hooks/useSound';
import { GtaMap } from '@/components/os/GtaMap';
import { apiRequest } from '@/utils/api';
import { useAuthStore } from '@/stores/authStore';
import { GlassPanel } from '@/components/ui/GlassPanel';

type Tab = 'map' | 'search' | 'saved' | 'offline';

/**
 * GULF Maps — full-quality GTA V terrain map (bundled Rockstar render tiles).
 * Your position is wherever you drop the pin: tap the map to set it,
 * and every location-aware app follows.
 */
export function MapsApp() {
  const { tap, success } = useHaptic();
  const qc = useQueryClient();
  const token = useAuthStore((s) => s.getAccessToken());
  const [tab, setTab] = useState<Tab>('map');
  const [searchQ, setSearchQ] = useState('');
  const { data: mapsState } = useMapsState();

  const world = mapsState?.world as Record<string, unknown> | undefined;
  const gps = mapsState?.gps as Record<string, unknown> | undefined;

  const { data: searchResults } = useQuery({
    queryKey: ['maps', 'search', searchQ],
    queryFn: () => systemAppsService.searchMaps(searchQ),
    enabled: searchQ.length >= 2,
  });

  const { data: offlineMaps } = useQuery({
    queryKey: ['maps', 'offline'],
    queryFn: () => systemAppsService.getOfflineMaps(),
    enabled: tab === 'offline',
  });

  const { data: districts } = useQuery({
    queryKey: ['maps', 'districts'],
    queryFn: () => systemAppsService.getDistricts(),
    enabled: tab === 'offline',
  });

  const { data: roadBlocks } = useQuery({
    queryKey: ['maps', 'roadblocks'],
    queryFn: () => systemAppsService.getRoadBlocks(),
  });

  const setPosition = useMutation({
    mutationFn: (pos: { latitude: number; longitude: number }) =>
      apiRequest<{ success: boolean; data: Record<string, unknown> }>('/api/world/gps/position', {
        method: 'POST',
        token: token!,
        body: JSON.stringify(pos),
      }),
    onSuccess: () => {
      success();
      qc.invalidateQueries({ queryKey: ['system-apps', 'maps'] });
      qc.invalidateQueries({ queryKey: ['system-apps', 'weather'] });
    },
  });

  const navigate = useMutation({
    mutationFn: (dest: Record<string, unknown>) => systemAppsService.planRoute(dest),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system-apps', 'maps'] }),
  });

  const downloadOffline = useMutation({
    mutationFn: (district: string) => systemAppsService.downloadOfflineMap(district),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['maps', 'offline'] }),
  });

  const stopNav = useMutation({
    mutationFn: () => systemAppsService.stopRoute(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system-apps', 'maps'] }),
  });

  const marker = world
    ? { latitude: Number(world.latitude ?? 34.05), longitude: Number(world.longitude ?? -118.24) }
    : null;

  return (
    <div className="h-full flex flex-col bg-black">
      {tab === 'map' ? (
        <div className="flex-1 relative">
          {/* Full-bleed GTA V map */}
          <GtaMap
            className="absolute inset-0"
            marker={marker}
            onSelect={(pos) => { tap(); setPosition.mutate(pos); }}
          />

          {/* Location card — floating iOS style */}
          <div className="absolute left-3 right-3 top-3 pointer-events-none">
            <div className="ios-material-thin rounded-[18px] px-4 py-3 ios-card-shadow pointer-events-auto">
              <p className="text-[11px] font-semibold text-ios-blue uppercase tracking-wide">
                📍 My Location — tap map to move
              </p>
              <p className="text-white text-[17px] font-semibold font-display leading-tight mt-0.5">
                {String(world?.district ?? 'Locating…')}
              </p>
              <p className="text-white/60 text-[13px]">
                {String(world?.street ?? '')}
                {world?.zone ? ` · ${String(world.zone)}` : ''}
              </p>
              <p className="text-white/40 text-[11px] font-mono tabular-nums mt-0.5">
                {marker ? `${marker.latitude.toFixed(5)}, ${marker.longitude.toFixed(5)}` : ''}
                {setPosition.isPending ? ' · updating…' : ''}
              </p>
            </div>

            {gps?.navigating ? (
              <div className="ios-material-thin rounded-[18px] px-4 py-3 mt-2 ios-card-shadow pointer-events-auto">
                <p className="text-gulf-gold text-[13px] font-semibold">Navigating — {(gps.destination as Record<string, unknown>)?.name as string}</p>
                <p className="text-white/50 text-[12px]">{Number(gps.distanceRemainingM ?? 0).toFixed(0)}m · ETA {Math.round(Number(gps.etaSeconds ?? 0) / 60)}min</p>
                <button type="button" onClick={() => { tap(); stopNav.mutate(); }} className="mt-1 text-[12px] text-ios-red">Stop Navigation</button>
              </div>
            ) : null}
          </div>

          {/* Roadblock alerts */}
          {(roadBlocks as { roadBlocks?: Array<Record<string, unknown>> })?.roadBlocks?.slice(0, 1).map((rb) => (
            <div key={String(rb.id)} className="absolute left-3 right-3 bottom-3 ios-material-thin rounded-[14px] px-3 py-2">
              <p className="text-ios-red text-[12px] font-semibold">🚧 Police Roadblock — {String(rb.reason)}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4">
          {tab === 'search' && (
            <>
              <input
                type="text"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Search locations..."
                className="w-full bg-[rgba(118,118,128,0.24)] text-white rounded-[12px] px-4 h-[38px] mb-4 text-[17px] outline-none placeholder:text-[rgba(235,235,245,0.6)]"
              />
              {(searchResults ?? []).map((loc) => (
                <button
                  key={String(loc.locationId ?? loc.name)}
                  type="button"
                  onClick={() => { tap(); navigate.mutate({ locationId: loc.locationId as string, name: loc.name as string }); setTab('map'); }}
                  className="w-full text-left p-3 mb-2 rounded-[14px] bg-[#1C1C1E]"
                >
                  <p className="text-white text-[15px]">{String(loc.name)}</p>
                  <p className="text-white/40 text-[12px]">{String(loc.district ?? '')} · {String(loc.category ?? '')}</p>
                </button>
              ))}
            </>
          )}

          {tab === 'saved' && (
            <>
              <p className="text-[13px] text-ios-label-secondary uppercase mb-3">Favorites</p>
              {((gps?.favoritePlaces as Array<Record<string, unknown>>) ?? []).map((p, i) => (
                <button key={i} type="button" onClick={() => navigate.mutate({ name: p.name as string, lat: p.lat as number, lng: p.lng as number })} className="w-full text-left p-3 mb-2 rounded-[14px] bg-[#1C1C1E]">
                  <p className="text-white text-[15px]">⭐ {String(p.name)}</p>
                </button>
              ))}
              <p className="text-[13px] text-ios-label-secondary uppercase mt-4 mb-3">Recent</p>
              {((gps?.recentPlaces as Array<Record<string, unknown>>) ?? []).map((p, i) => (
                <div key={i} className="p-3 mb-2 rounded-[14px] bg-[#1C1C1E]">
                  <p className="text-white text-[15px]">{String(p.name)}</p>
                </div>
              ))}
            </>
          )}

          {tab === 'offline' && (
            <>
              <p className="text-[13px] text-white/40 mb-3">Download district maps for offline use</p>
              {(districts ?? []).slice(0, 8).map((d) => (
                <button
                  key={d.name}
                  type="button"
                  onClick={() => { tap(); downloadOffline.mutate(d.name); }}
                  disabled={downloadOffline.isPending}
                  className="w-full text-left p-3 mb-2 rounded-[14px] bg-[#1C1C1E] disabled:opacity-50"
                >
                  <p className="text-white text-[15px]">{d.name}</p>
                  <p className="text-white/40 text-[12px] capitalize">{d.terrain}</p>
                </button>
              ))}
              <p className="text-[13px] text-ios-label-secondary uppercase mt-4 mb-2">Cached</p>
              {(offlineMaps ?? []).map((c) => (
                <div key={String(c.cacheId)} className="p-3 mb-2 rounded-[14px] bg-gulf-gold/10">
                  <p className="text-gulf-gold text-[15px]">{String(c.district)}</p>
                  <p className="text-white/40 text-[12px]">{Number(c.tileCount)} tiles · expires {new Date(String(c.expiresAt)).toLocaleDateString()}</p>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* Native UITabBar */}
      <nav className="ios-material-chrome border-t border-[rgba(84,84,88,0.35)] flex items-start justify-around pt-[7px] pb-[24px]">
        {([['map', '🗺️', 'Map'], ['search', '🔍', 'Search'], ['saved', '⭐', 'Saved'], ['offline', '⬇️', 'Offline']] as const).map(([t, icon, label]) => (
          <button
            key={t}
            type="button"
            onClick={() => { tap(); setTab(t); }}
            className={`flex flex-col items-center gap-[3px] px-3 min-w-[64px] ${tab === t ? 'text-gulf-gold' : 'text-[rgba(235,235,245,0.6)]'}`}
            aria-current={tab === t ? 'page' : undefined}
          >
            <span className="text-[22px] leading-none">{icon}</span>
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
