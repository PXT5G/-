'use client';

import { type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useVehiclesInit, useVehiclesSocketSync, useVehiclesDashboard,
  useVehiclesSearch, useVehiclesAnalytics,
  useVehiclesDealers, useVehiclesInventory, useVehiclesFinance,
  useVehiclesAuctions, useVehiclesFavorites, useVehiclesOffers,
  useToggleVehicleFavorite,
} from '@/hooks/useVehicles';
import { useVehicleStore } from '@/stores/vehicleStore';
import { useHaptic } from '@/hooks/useSound';
import { cn } from '@/utils/cn';

type Tab = 'home' | 'browse' | 'dealers' | 'inventory' | 'finance' | 'auctions' | 'analytics' | 'favorites' | 'messages' | 'more';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'browse', label: 'Browse', icon: '🔍' },
  { id: 'dealers', label: 'Dealers', icon: '🏪' },
  { id: 'inventory', label: 'Inventory', icon: '📦' },
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

function VehicleCard({ vehicle, onFavorite }: { vehicle: Record<string, unknown>; onFavorite?: () => void }) {
  return (
    <GlassCard className="p-3">
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate">
            {String(vehicle.year)} {String(vehicle.brand)} {String(vehicle.model)}
          </p>
          <p className="text-white/50 text-xs capitalize">{String(vehicle.category).replace(/_/g, ' ')}</p>
          <p className="text-white/40 text-xs mt-1">
            {Number(vehicle.mileage).toLocaleString()} km · {String(vehicle.color ?? '—')}
          </p>
        </div>
        {onFavorite && (
          <button type="button" onClick={onFavorite} className="text-lg ml-2">🤍</button>
        )}
      </div>
      <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/5">
        <span className="text-gulf-gold font-bold text-sm">
          ₴ {Number(vehicle.listPrice).toLocaleString()}
        </span>
        <span className="text-white/40 text-xs capitalize">{String(vehicle.status)}</span>
      </div>
    </GlassCard>
  );
}

function HomeView() {
  const { data, isLoading } = useVehiclesDashboard();
  if (isLoading) return <LoadingState />;
  const stats = (data as { stats?: Record<string, number> })?.stats ?? {};
  const featured = ((data as { featured?: Record<string, unknown>[] })?.featured ?? []);

  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {[
          ['Vehicles', stats.totalVehicles ?? 0],
          ['Listed', stats.listed ?? 0],
          ['Dealers', stats.dealers ?? 0],
          ['Sold', stats.sold ?? 0],
        ].map(([label, val]) => (
          <GlassCard key={String(label)} className="p-3 text-center">
            <p className="text-xl font-bold text-gulf-gold">{Number(val)}</p>
            <p className="text-[10px] text-white/50 uppercase">{String(label)}</p>
          </GlassCard>
        ))}
      </div>

      <GlassCard className="p-4">
        <h3 className="text-white/60 text-xs uppercase mb-3">Featured Vehicles</h3>
        {featured.length === 0 ? (
          <p className="text-white/40 text-sm">No featured listings yet</p>
        ) : (
          <div className="space-y-2">
            {featured.slice(0, 4).map((v) => (
              <VehicleCard key={String(v.vehicleId)} vehicle={v} />
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}

function BrowseView() {
  const searchQuery = useVehicleStore((s) => s.searchQuery);
  const setSearchQuery = useVehicleStore((s) => s.setSearchQuery);
  const searchFilters = useVehicleStore((s) => s.searchFilters);
  const setSearchFilter = useVehicleStore((s) => s.setSearchFilter);
  const { data, isLoading } = useVehiclesSearch(searchQuery, searchFilters);

  return (
    <div className="p-4 space-y-4">
      <GlassCard className="p-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search brand, model, VIN, plate..."
          className="w-full bg-transparent text-white text-sm placeholder:text-white/40 outline-none"
        />
      </GlassCard>
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {['brand', 'fuelType', 'transmission', 'color'].map((filter) => (
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
            ((data ?? []) as Record<string, unknown>[]).map((v) => (
              <VehicleCard key={String(v.vehicleId)} vehicle={v} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function DealersView() {
  const { data, isLoading } = useVehiclesDealers();
  if (isLoading) return <LoadingState />;
  const dealers = (data ?? []) as Record<string, unknown>[];

  return (
    <div className="p-4 space-y-2">
      <p className="text-white/60 text-xs uppercase">{dealers.length} authorized dealers</p>
      {dealers.length === 0 ? (
        <GlassCard className="p-6 text-center"><p className="text-white/40 text-sm">No dealers registered</p></GlassCard>
      ) : (
        dealers.map((d) => (
          <GlassCard key={String(d.dealerId)} className="p-3">
            <p className="text-white font-medium text-sm">{String(d.name)}</p>
            <p className="text-white/50 text-xs">{String(d.tradeName)}</p>
            <p className="text-white/40 text-xs mt-1">{String(d.city)}, {String(d.district)}</p>
            <div className="flex justify-between mt-2 pt-2 border-t border-white/5 text-xs">
              <span className="text-white/50">{Number(d.inventoryCount ?? 0)} in stock</span>
              <span className="text-gulf-gold">₴ {Number(d.totalRevenue ?? 0).toLocaleString()}</span>
            </div>
          </GlassCard>
        ))
      )}
    </div>
  );
}

function InventoryView() {
  const { data, isLoading } = useVehiclesInventory();
  const toggleFav = useToggleVehicleFavorite();
  const { tap } = useHaptic();

  if (isLoading) return <LoadingState />;
  const items = (data as { items?: Record<string, unknown>[] })?.items ?? [];

  return (
    <div className="p-4 space-y-2">
      <p className="text-white/60 text-xs uppercase">{items.length} vehicles in inventory</p>
      {items.map((v) => (
        <motion.div key={String(v.vehicleId)} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
          <VehicleCard vehicle={v} onFavorite={() => { tap(); toggleFav.mutate(String(v.vehicleId)); }} />
        </motion.div>
      ))}
    </div>
  );
}

function FinanceView() {
  const { data, isLoading } = useVehiclesFinance();
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
            <p className="text-white text-sm">Vehicle {String(f.vehicleId)}</p>
            <p className="text-gulf-gold font-bold">₴ {Number(f.principal).toLocaleString()}</p>
            <p className="text-white/40 text-xs capitalize">{String(f.type)} · {String(f.status)}</p>
          </GlassCard>
        ))
      )}
    </div>
  );
}

function AuctionsView() {
  const { data, isLoading } = useVehiclesAuctions();
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
            <p className="text-white text-sm">{String(a.vehicleId)}</p>
            <p className="text-gulf-gold font-bold">Current: ₴ {Number(a.currentBid ?? a.startingBid).toLocaleString()}</p>
            <p className="text-white/40 text-xs capitalize">{String(a.status)} · {Number(a.bidCount ?? 0)} bids</p>
          </GlassCard>
        ))
      )}
    </div>
  );
}

function AnalyticsView() {
  const { data, isLoading } = useVehiclesAnalytics();
  if (isLoading) return <LoadingState />;
  const a = (data ?? {}) as Record<string, number>;

  return (
    <div className="p-4 grid grid-cols-2 gap-2">
      {[
        ['Inventory Value', a.inventoryValue], ['Total Revenue', a.totalRevenue],
        ['Units Sold', a.unitsSold], ['Units Listed', a.unitsListed],
        ['Avg Sale Price', a.averageSalePrice], ['Net Profit', a.netProfit],
        ['Total Inventory', a.totalInventory], ['Commission', a.commission],
      ].map(([label, val]) => (
        <GlassCard key={String(label)} className="p-3 text-center">
          <p className="text-lg font-bold text-gulf-gold">
            {typeof val === 'number' ? (String(label).includes('Units') ? val : `₴ ${val.toLocaleString()}`) : '—'}
          </p>
          <p className="text-[10px] text-white/50 uppercase">{String(label)}</p>
        </GlassCard>
      ))}
    </div>
  );
}

function FavoritesView() {
  const { data, isLoading } = useVehiclesFavorites();
  if (isLoading) return <LoadingState />;
  return (
    <div className="p-4 space-y-2">
      {((data ?? []) as Record<string, unknown>[]).length === 0 ? (
        <GlassCard className="p-8 text-center">
          <p className="text-3xl mb-2">❤️</p>
          <p className="text-white/50 text-sm">No saved vehicles</p>
        </GlassCard>
      ) : (
        ((data ?? []) as Record<string, unknown>[]).map((v) => (
          <VehicleCard key={String(v.vehicleId)} vehicle={v} />
        ))
      )}
    </div>
  );
}

function MessagesView() {
  const { data } = useVehiclesOffers();
  const offers = (data ?? []) as Record<string, unknown>[];
  return (
    <div className="p-4 space-y-2">
      <p className="text-white/60 text-xs uppercase">Offers & Negotiations</p>
      {offers.length === 0 ? (
        <GlassCard className="p-6 text-center"><p className="text-white/40 text-sm">No messages yet</p></GlassCard>
      ) : (
        offers.map((o) => (
          <GlassCard key={String(o.offerId)} className="p-3">
            <p className="text-white text-sm">Offer on {String(o.vehicleId)}</p>
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
      {['Vehicle Categories', 'Dealer Panel', 'Inspections', 'Insurance', 'Warranty', 'Audit Logs'].map((item) => (
        <GlassCard key={item} className="p-4 flex justify-between items-center">
          <span className="text-white text-sm">{item}</span>
          <span className="text-white/30">›</span>
        </GlassCard>
      ))}
    </div>
  );
}

export function VehiclesApp() {
  useVehiclesInit();
  useVehiclesSocketSync();

  const activeTab = useVehicleStore((s) => s.activeTab);
  const setActiveTab = useVehicleStore((s) => s.setActiveTab);
  const { tap } = useHaptic();

  const renderTab = () => {
    switch (activeTab) {
      case 'home': return <HomeView />;
      case 'browse': return <BrowseView />;
      case 'dealers': return <DealersView />;
      case 'inventory': return <InventoryView />;
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
    <div className="h-full flex flex-col bg-gradient-to-b from-[#0a1a1e] via-[#0e2430] to-[#081418] text-white overflow-hidden">
      <div className="flex-shrink-0 pt-2 pb-1 px-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🚗</span>
          <div>
            <h1 className="text-base font-bold text-gulf-gold">GULF Auto</h1>
            <p className="text-[10px] text-white/40 uppercase tracking-widest">Official Vehicle Marketplace</p>
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
