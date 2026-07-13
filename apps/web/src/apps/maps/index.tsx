'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { systemAppsService } from '@/services/systemAppsService';
import { useMapsState } from '@/hooks/useSystemApps';
import { useRealGeo } from '@/hooks/useRealGeo';
import { useHaptic } from '@/hooks/useSound';
import { GlassPanel } from '@/components/ui/GlassPanel';

type Tab = 'map' | 'search' | 'saved' | 'offline';

export function MapsApp() {
  const { tap } = useHaptic();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('map');
  const [searchQ, setSearchQ] = useState('');
  const { data: mapsState } = useMapsState();
  const { data: geo } = useRealGeo();

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

  return (
    <div className="h-full flex flex-col bg-black">
      <div className="flex-1 overflow-y-auto p-4">
        {tab === 'map' && (
          <>
            {/* Real device GPS position */}
            <GlassPanel className="p-4 mb-4" intensity="low">
              <p className="text-ios-blue text-xs uppercase tracking-wider mb-2">📍 My Location (GPS)</p>
              <p className="text-white text-lg font-semibold">
                {geo ? `${geo.city}${geo.region ? `, ${geo.region}` : ''}` : 'Locating…'}
              </p>
              <p className="text-white/60 text-sm">{geo?.country ?? ''}</p>
              <p className="text-white/40 text-xs font-mono mt-1 tabular-nums">
                {geo ? `${geo.latitude.toFixed(5)}, ${geo.longitude.toFixed(5)}` : '— , —'}
              </p>
              {geo && (
                <p className="text-white/50 text-xs mt-2">
                  {geo.weather ? `${geo.weather.icon} ${geo.weather.tempC}° ${geo.weather.label} · ` : ''}
                  {geo.source === 'gps' ? 'Device GPS' : geo.source === 'ip' ? 'Network location' : 'Default location'} · {geo.timezone}
                </p>
              )}
            </GlassPanel>

            <div className="relative h-48 rounded-2xl bg-gradient-to-br from-emerald-900/40 via-black to-gulf-gold/10 border border-white/10 mb-4 overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="relative flex">
                  <span className="animate-ping absolute inline-flex h-5 w-5 rounded-full bg-ios-blue opacity-40" />
                  <span className="relative inline-flex w-5 h-5 rounded-full bg-ios-blue border-[3px] border-white shadow-lg" />
                </span>
              </div>
              {geo && (
                <p className="absolute top-2 left-3 text-[11px] text-white/70 font-medium">{geo.city}</p>
              )}
              <p className="absolute bottom-2 left-3 text-[10px] text-white/40">GULF Maps · Live GPS</p>
            </div>

            {/* Simulated world position (game engine) */}
            <GlassPanel className="p-4 mb-4" intensity="low">
              <p className="text-gulf-gold text-xs uppercase tracking-wider mb-2">World Position</p>
              <p className="text-white text-lg font-semibold">{String(world?.district ?? '—')}</p>
              <p className="text-white/60 text-sm">{String(world?.street ?? '')}</p>
              <p className="text-white/40 text-xs font-mono mt-1">
                {Number(world?.latitude ?? 0).toFixed(5)}, {Number(world?.longitude ?? 0).toFixed(5)}
              </p>
              <p className="text-white/50 text-xs mt-2">Weather: {String(world?.weather ?? 'clear')} · Speed: {Number(world?.speed ?? 0).toFixed(0)} km/h</p>
            </GlassPanel>

            {gps?.navigating ? (
              <GlassPanel className="p-4 mb-4 border-gulf-gold/30" intensity="low">
                <p className="text-gulf-gold text-sm font-semibold">Navigating</p>
                <p className="text-white text-sm">{(gps.destination as Record<string, unknown>)?.name as string}</p>
                <p className="text-white/50 text-xs">{Number(gps.distanceRemainingM ?? 0).toFixed(0)}m · ETA {Math.round(Number(gps.etaSeconds ?? 0) / 60)}min</p>
                <button type="button" onClick={() => { tap(); stopNav.mutate(); }} className="mt-2 text-xs text-red-400">Stop Navigation</button>
              </GlassPanel>
            ) : null}

            {(roadBlocks as { roadBlocks?: Array<Record<string, unknown>> })?.roadBlocks?.map((rb) => (
              <div key={String(rb.id)} className="p-3 mb-2 rounded-xl bg-red-500/10 border border-red-500/30">
                <p className="text-red-400 text-xs font-semibold">🚧 Police Roadblock</p>
                <p className="text-white/60 text-xs">{String(rb.reason)}</p>
              </div>
            ))}
          </>
        )}

        {tab === 'search' && (
          <>
            <input
              type="text"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Search locations..."
              className="w-full bg-white/10 text-white rounded-xl px-4 py-3 mb-4 text-sm"
            />
            {(searchResults ?? []).map((loc) => (
              <button
                key={String(loc.locationId ?? loc.name)}
                type="button"
                onClick={() => { tap(); navigate.mutate({ locationId: loc.locationId as string, name: loc.name as string }); setTab('map'); }}
                className="w-full text-left p-3 mb-2 rounded-xl bg-white/5 border border-white/10"
              >
                <p className="text-white text-sm">{String(loc.name)}</p>
                <p className="text-white/40 text-xs">{String(loc.district ?? '')} · {String(loc.category ?? '')}</p>
              </button>
            ))}
          </>
        )}

        {tab === 'saved' && (
          <>
            <p className="text-xs text-white/40 uppercase mb-3">Favorites</p>
            {((gps?.favoritePlaces as Array<Record<string, unknown>>) ?? []).map((p, i) => (
              <button key={i} type="button" onClick={() => navigate.mutate({ name: p.name as string, lat: p.lat as number, lng: p.lng as number })} className="w-full text-left p-3 mb-2 rounded-xl bg-white/5">
                <p className="text-white text-sm">⭐ {String(p.name)}</p>
              </button>
            ))}
            <p className="text-xs text-white/40 uppercase mt-4 mb-3">Recent</p>
            {((gps?.recentPlaces as Array<Record<string, unknown>>) ?? []).map((p, i) => (
              <div key={i} className="p-3 mb-2 rounded-xl bg-white/5">
                <p className="text-white text-sm">{String(p.name)}</p>
              </div>
            ))}
          </>
        )}

        {tab === 'offline' && (
          <>
            <p className="text-xs text-white/40 mb-3">Download district maps for offline use</p>
            {(districts ?? []).slice(0, 8).map((d) => (
              <button
                key={d.name}
                type="button"
                onClick={() => { tap(); downloadOffline.mutate(d.name); }}
                disabled={downloadOffline.isPending}
                className="w-full text-left p-3 mb-2 rounded-xl bg-white/5 border border-white/10 disabled:opacity-50"
              >
                <p className="text-white text-sm">{d.name}</p>
                <p className="text-white/40 text-xs capitalize">{d.terrain}</p>
              </button>
            ))}
            <p className="text-xs text-white/40 uppercase mt-4 mb-2">Cached</p>
            {(offlineMaps ?? []).map((c) => (
              <div key={String(c.cacheId)} className="p-3 mb-2 rounded-xl bg-gulf-gold/10 border border-gulf-gold/20">
                <p className="text-gulf-gold text-sm">{String(c.district)}</p>
                <p className="text-white/40 text-xs">{Number(c.tileCount)} tiles · expires {new Date(String(c.expiresAt)).toLocaleDateString()}</p>
              </div>
            ))}
          </>
        )}
      </div>

      <nav className="flex border-t border-white/10 bg-black/90">
        {(['map', 'search', 'saved', 'offline'] as Tab[]).map((t) => (
          <button key={t} type="button" onClick={() => { tap(); setTab(t); }} className={`flex-1 py-3 text-xs capitalize ${tab === t ? 'text-gulf-gold' : 'text-white/40'}`}>
            {t}
          </button>
        ))}
      </nav>
    </div>
  );
}
