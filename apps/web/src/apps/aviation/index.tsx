'use client';

import { type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useAviationInit, useAviationSocketSync, useAviationDashboard,
  useAviationSearch, useAviationAnalytics, useAviationAirports,
  useAviationFleet, useAviationFinance, useAviationAuctions,
  useAviationFavorites, useAviationOffers, useToggleAviationFavorite,
} from '@/hooks/useAviation';
import { useAviationStore } from '@/stores/aviationStore';
import { useHaptic } from '@/hooks/useSound';
import { cn } from '@/utils/cn';

type Tab = 'home' | 'browse' | 'airports' | 'fleet' | 'finance' | 'auctions' | 'analytics' | 'favorites' | 'messages' | 'more';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'browse', label: 'Browse', icon: '🔍' },
  { id: 'airports', label: 'Airports', icon: '🛫' },
  { id: 'fleet', label: 'Fleet', icon: '✈️' },
  { id: 'finance', label: 'Finance', icon: '💳' },
  { id: 'auctions', label: 'Auctions', icon: '🔨' },
  { id: 'analytics', label: 'Stats', icon: '📊' },
  { id: 'favorites', label: 'Saved', icon: '❤️' },
  { id: 'messages', label: 'Inbox', icon: '💬' },
  { id: 'more', label: 'More', icon: '⋯' },
];

function GlassCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md', className)}>
      {children}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center h-48">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        className="w-8 h-8 border-2 border-gulf-gold border-t-transparent rounded-full" />
    </div>
  );
}

function AircraftCard({ aircraft, onFavorite }: { aircraft: Record<string, unknown>; onFavorite?: () => void }) {
  const specs = aircraft.specs as Record<string, number> | undefined;
  return (
    <GlassCard className="p-3">
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate">
            {String(aircraft.year)} {String(aircraft.brand)} {String(aircraft.model)}
          </p>
          <p className="text-white/50 text-xs capitalize">{String(aircraft.category).replace(/_/g, ' ')}</p>
          <p className="text-white/40 text-xs mt-1">
            {String(aircraft.registrationNumber)} · {Number(aircraft.flightHours).toLocaleString()} hrs
          </p>
        </div>
        {onFavorite && (
          <button type="button" onClick={onFavorite} className="text-lg ml-2">🤍</button>
        )}
      </div>
      <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/5">
        <span className="text-gulf-gold font-bold text-sm">
          ₴ {Number(aircraft.listPrice).toLocaleString()}
        </span>
        <span className="text-white/40 text-xs">
          {specs?.passengerCapacity ?? 0} pax · {String(aircraft.status)}
        </span>
      </div>
    </GlassCard>
  );
}

function HomeView() {
  const { data, isLoading } = useAviationDashboard();
  if (isLoading) return <LoadingState />;
  const stats = (data as { stats?: Record<string, number> })?.stats ?? {};
  const featured = ((data as { featured?: Record<string, unknown>[] })?.featured ?? []);

  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {[
          ['Aircraft', stats.totalAircraft ?? 0],
          ['Listed', stats.totalListed ?? 0],
          ['Airports', stats.airports ?? 0],
          ['Auctions', stats.auctions ?? 0],
        ].map(([label, val]) => (
          <GlassCard key={String(label)} className="p-3 text-center">
            <p className="text-xl font-bold text-gulf-gold">{Number(val)}</p>
            <p className="text-[10px] text-white/50 uppercase">{String(label)}</p>
          </GlassCard>
        ))}
      </div>

      <GlassCard className="p-4">
        <h3 className="text-white/60 text-xs uppercase mb-3">Featured Aircraft</h3>
        {featured.length === 0 ? (
          <p className="text-white/40 text-sm">No featured listings yet</p>
        ) : (
          <div className="space-y-2">
            {featured.slice(0, 4).map((a) => (
              <AircraftCard key={String(a.aircraftId)} aircraft={a} />
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}

function BrowseView() {
  const searchQuery = useAviationStore((s) => s.searchQuery);
  const setSearchQuery = useAviationStore((s) => s.setSearchQuery);
  const searchFilters = useAviationStore((s) => s.searchFilters);
  const setSearchFilter = useAviationStore((s) => s.setSearchFilter);
  const { data, isLoading } = useAviationSearch(searchQuery, searchFilters);

  return (
    <div className="p-4 space-y-4">
      <GlassCard className="p-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search manufacturer, model, registration..."
          className="w-full bg-transparent text-white text-sm placeholder:text-white/40 outline-none"
        />
      </GlassCard>
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {['manufacturer', 'engineType', 'airportId', 'category'].map((filter) => (
          <input
            key={filter}
            type="text"
            value={searchFilters[filter] ?? ''}
            onChange={(e) => setSearchFilter(filter, e.target.value)}
            placeholder={filter}
            className="flex-shrink-0 w-24 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-white text-xs placeholder:text-white/30 outline-none"
          />
        ))}
      </div>
      {isLoading && <LoadingState />}
      {(searchQuery.length > 1 || Object.values(searchFilters).some(Boolean)) && !isLoading && (
        <div className="space-y-2">
          {((data ?? []) as Record<string, unknown>[]).length === 0 ? (
            <GlassCard className="p-6 text-center"><p className="text-white/40 text-sm">No results</p></GlassCard>
          ) : (
            ((data ?? []) as Record<string, unknown>[]).map((a) => (
              <AircraftCard key={String(a.aircraftId)} aircraft={a} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function AirportsView() {
  const { data, isLoading } = useAviationAirports();
  if (isLoading) return <LoadingState />;
  const airports = (data ?? []) as Record<string, unknown>[];

  return (
    <div className="p-4 space-y-2">
      <p className="text-white/60 text-xs uppercase">{airports.length} airports & facilities</p>
      {airports.length === 0 ? (
        <GlassCard className="p-6 text-center"><p className="text-white/40 text-sm">No airports registered</p></GlassCard>
      ) : (
        airports.map((a) => (
          <GlassCard key={String(a.airportId)} className="p-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-white font-medium text-sm">{String(a.name)}</p>
                <p className="text-gulf-gold text-xs font-mono">{String(a.code)}</p>
              </div>
              <span className="text-white/40 text-xs capitalize">{String(a.type).replace(/_/g, ' ')}</span>
            </div>
            <p className="text-white/40 text-xs mt-1">{String(a.city)}, {String(a.district)}</p>
            <div className="flex gap-3 mt-2 pt-2 border-t border-white/5 text-xs text-white/50">
              <span>{Number(a.runwayCount ?? 0)} runways</span>
              <span>{Number(a.hangarCount ?? 0)} hangars</span>
              {Boolean(a.hasFuelStation) && <span>⛽ Fuel</span>}
              {Boolean(a.hasMaintenance) && <span>🔧 MRO</span>}
            </div>
          </GlassCard>
        ))
      )}
    </div>
  );
}

function FleetView() {
  const { data, isLoading } = useAviationFleet({ available: true });
  const toggleFav = useToggleAviationFavorite();
  const { tap } = useHaptic();

  if (isLoading) return <LoadingState />;
  const items = (data as { items?: Record<string, unknown>[] })?.items ?? [];

  return (
    <div className="p-4 space-y-2">
      <p className="text-white/60 text-xs uppercase">{items.length} aircraft in fleet</p>
      {items.map((a) => (
        <motion.div key={String(a.aircraftId)} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
          <AircraftCard aircraft={a} onFavorite={() => { tap(); toggleFav.mutate(String(a.aircraftId)); }} />
        </motion.div>
      ))}
    </div>
  );
}

function FinanceView() {
  const { data, isLoading } = useAviationFinance();
  if (isLoading) return <LoadingState />;
  const items = (data ?? []) as Record<string, unknown>[];

  return (
    <div className="p-4 space-y-2">
      <p className="text-white/60 text-xs uppercase">Financing & Leasing</p>
      {items.length === 0 ? (
        <GlassCard className="p-6 text-center"><p className="text-white/40 text-sm">No active finance agreements</p></GlassCard>
      ) : (
        items.map((f) => (
          <GlassCard key={String(f.financeId)} className="p-3">
            <p className="text-white text-sm">Aircraft {String(f.aircraftId)}</p>
            <p className="text-gulf-gold font-bold">₴ {Number(f.principal).toLocaleString()}</p>
            <p className="text-white/40 text-xs capitalize">{String(f.type)} · {String(f.status)}</p>
          </GlassCard>
        ))
      )}
    </div>
  );
}

function AuctionsView() {
  const { data, isLoading } = useAviationAuctions();
  if (isLoading) return <LoadingState />;
  const items = (data ?? []) as Record<string, unknown>[];

  return (
    <div className="p-4 space-y-2">
      <p className="text-white/60 text-xs uppercase">Live Auctions</p>
      {items.length === 0 ? (
        <GlassCard className="p-6 text-center"><p className="text-white/40 text-sm">No active auctions</p></GlassCard>
      ) : (
        items.map((a) => (
          <GlassCard key={String(a.auctionId)} className="p-3">
            <p className="text-white text-sm">{String(a.aircraftId)}</p>
            <p className="text-gulf-gold font-bold">Current: ₴ {Number(a.currentBid ?? a.startingBid).toLocaleString()}</p>
            <p className="text-white/40 text-xs capitalize">{String(a.status)} · {Number(a.bidCount ?? 0)} bids</p>
          </GlassCard>
        ))
      )}
    </div>
  );
}

function AnalyticsView() {
  const { data, isLoading } = useAviationAnalytics();
  if (isLoading) return <LoadingState />;
  const a = (data ?? {}) as Record<string, number>;

  return (
    <div className="p-4 grid grid-cols-2 gap-2">
      {[
        ['Fleet Value', a.fleetValue], ['Inventory Value', a.inventoryValue],
        ['Total Revenue', a.totalRevenue], ['Net Profit', a.netProfit],
        ['Maintenance', a.maintenanceCost], ['Units Sold', a.unitsSold],
        ['Fleet Count', a.fleetCount], ['Avg Sale', a.averageSalePrice],
      ].map(([label, val]) => (
        <GlassCard key={String(label)} className="p-3 text-center">
          <p className="text-lg font-bold text-gulf-gold">
            {typeof val === 'number'
              ? (String(label).includes('Count') || String(label).includes('Sold')
                ? val
                : `₴ ${val.toLocaleString()}`)
              : '—'}
          </p>
          <p className="text-[10px] text-white/50 uppercase">{String(label)}</p>
        </GlassCard>
      ))}
    </div>
  );
}

function FavoritesView() {
  const { data, isLoading } = useAviationFavorites();
  if (isLoading) return <LoadingState />;
  return (
    <div className="p-4 space-y-2">
      {((data ?? []) as Record<string, unknown>[]).length === 0 ? (
        <GlassCard className="p-8 text-center">
          <p className="text-3xl mb-2">❤️</p>
          <p className="text-white/50 text-sm">No saved aircraft</p>
        </GlassCard>
      ) : (
        ((data ?? []) as Record<string, unknown>[]).map((a) => (
          <AircraftCard key={String(a.aircraftId)} aircraft={a} />
        ))
      )}
    </div>
  );
}

function MessagesView() {
  const { data } = useAviationOffers();
  const offers = (data ?? []) as Record<string, unknown>[];
  return (
    <div className="p-4 space-y-2">
      <p className="text-white/60 text-xs uppercase">Offers & Negotiations</p>
      {offers.length === 0 ? (
        <GlassCard className="p-6 text-center"><p className="text-white/40 text-sm">No messages yet</p></GlassCard>
      ) : (
        offers.map((o) => (
          <GlassCard key={String(o.offerId)} className="p-3">
            <p className="text-white text-sm">Offer on {String(o.aircraftId)}</p>
            <p className="text-gulf-gold">₴ {Number(o.amount).toLocaleString()}</p>
            <p className="text-white/40 text-xs capitalize">{String(o.status)}</p>
          </GlassCard>
        ))
      )}
    </div>
  );
}

function MoreView() {
  return (
    <div className="p-4 space-y-3">
      {['Aircraft Categories', 'Hangar Management', 'Pilot Panel', 'Inspections', 'Insurance', 'Audit Logs'].map((item) => (
        <GlassCard key={item} className="p-4 flex justify-between items-center">
          <span className="text-white text-sm">{item}</span>
          <span className="text-white/30">›</span>
        </GlassCard>
      ))}
    </div>
  );
}

export function AviationApp() {
  useAviationInit();
  useAviationSocketSync();

  const activeTab = useAviationStore((s) => s.activeTab);
  const setActiveTab = useAviationStore((s) => s.setActiveTab);
  const { tap } = useHaptic();

  const renderTab = () => {
    switch (activeTab) {
      case 'home': return <HomeView />;
      case 'browse': return <BrowseView />;
      case 'airports': return <AirportsView />;
      case 'fleet': return <FleetView />;
      case 'finance': return <FinanceView />;
      case 'auctions': return <AuctionsView />;
      case 'analytics': return <AnalyticsView />;
      case 'favorites': return <FavoritesView />;
      case 'messages': return <MessagesView />;
      case 'more': return <MoreView />;
      default: return <HomeView />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-[#0a1428] via-[#0e1e3a] to-[#081020] text-white overflow-hidden">
      <div className="flex-shrink-0 pt-2 pb-1 px-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-2xl">✈️</span>
          <div>
            <h1 className="text-base font-bold text-gulf-gold">GULF Aviation</h1>
            <p className="text-[10px] text-white/40 uppercase tracking-widest">Official Aviation Platform</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab}
            initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.15 }}>
            {renderTab()}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex-shrink-0 border-t border-white/10 bg-black/30 backdrop-blur-md">
        <div className="flex overflow-x-auto scrollbar-hide px-1 py-2 gap-0.5">
          {TABS.map((tab) => (
            <button key={tab.id} type="button"
              onClick={() => { tap(); setActiveTab(tab.id); }}
              className={cn(
                'flex-shrink-0 flex flex-col items-center px-2 py-1 rounded-xl min-w-[48px] transition-colors',
                activeTab === tab.id ? 'bg-gulf-gold/20 text-gulf-gold' : 'text-white/50 hover:text-white/80'
              )}>
              <span className="text-sm">{tab.icon}</span>
              <span className="text-[8px] mt-0.5">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
