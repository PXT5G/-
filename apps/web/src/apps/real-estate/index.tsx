'use client';

import { type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useRealEstateInit, useRealEstateSocketSync, useRealEstateDashboard,
  useRealEstateProperties, useRealEstateSearch, useRealEstateAnalytics,
  useRealEstateSales, useRealEstateRentals, useRealEstateOffers,
  useRealEstateFavorites, useToggleFavorite,
} from '@/hooks/useRealEstate';
import { useRealEstateStore } from '@/stores/realEstateStore';
import { useHaptic } from '@/hooks/useSound';
import { cn } from '@/utils/cn';

type Tab = 'home' | 'search' | 'properties' | 'rentals' | 'sales' | 'analytics' | 'favorites' | 'messages' | 'more';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'search', label: 'Search', icon: '🔍' },
  { id: 'properties', label: 'Listings', icon: '🏢' },
  { id: 'rentals', label: 'Rentals', icon: '🔑' },
  { id: 'sales', label: 'Sales', icon: '💰' },
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

function PropertyCard({ property, onFavorite }: { property: Record<string, unknown>; onFavorite?: () => void }) {
  const loc = property.location as Record<string, string> | undefined;
  return (
    <GlassCard className="p-3">
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate">{String(property.title)}</p>
          <p className="text-white/50 text-xs capitalize">{String(property.category).replace(/_/g, ' ')}</p>
          <p className="text-white/40 text-xs mt-1">{loc?.district}, {loc?.city}</p>
        </div>
        {onFavorite && (
          <button type="button" onClick={onFavorite} className="text-lg ml-2">🤍</button>
        )}
      </div>
      <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/5">
        <span className="text-gulf-gold font-bold text-sm">
          {Number(property.listPrice) > 0 ? `₴ ${Number(property.listPrice).toLocaleString()}` : `₴ ${Number(property.rentPriceMonthly).toLocaleString()}/mo`}
        </span>
        <span className="text-white/40 text-xs">{Number(property.bedrooms)} bed · {String(property.status)}</span>
      </div>
    </GlassCard>
  );
}

function HomeView() {
  const { data, isLoading } = useRealEstateDashboard();
  if (isLoading) return <LoadingState />;
  const stats = (data as { stats?: Record<string, number> })?.stats ?? {};
  const featured = ((data as { featured?: Record<string, unknown>[] })?.featured ?? []);

  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {[
          ['Properties', stats.totalProperties ?? 0],
          ['Listed', stats.listed ?? 0],
          ['For Sale', stats.forSale ?? 0],
          ['For Rent', stats.forRent ?? 0],
        ].map(([label, val]) => (
          <GlassCard key={String(label)} className="p-3 text-center">
            <p className="text-xl font-bold text-gulf-gold">{Number(val)}</p>
            <p className="text-[10px] text-white/50 uppercase">{String(label)}</p>
          </GlassCard>
        ))}
      </div>

      <GlassCard className="p-4">
        <h3 className="text-white/60 text-xs uppercase mb-3">Featured Properties</h3>
        {featured.length === 0 ? (
          <p className="text-white/40 text-sm">No featured listings yet</p>
        ) : (
          <div className="space-y-2">
            {featured.slice(0, 4).map((p) => (
              <PropertyCard key={String(p.propertyId)} property={p} />
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}

function SearchView() {
  const searchQuery = useRealEstateStore((s) => s.searchQuery);
  const setSearchQuery = useRealEstateStore((s) => s.setSearchQuery);
  const { data, isLoading } = useRealEstateSearch(searchQuery);

  return (
    <div className="p-4 space-y-4">
      <GlassCard className="p-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by district, street, title..."
          className="w-full bg-transparent text-white text-sm placeholder:text-white/40 outline-none"
        />
      </GlassCard>
      {isLoading && <LoadingState />}
      {searchQuery.length > 1 && !isLoading && (
        <div className="space-y-2">
          {((data ?? []) as Record<string, unknown>[]).length === 0 ? (
            <GlassCard className="p-6 text-center"><p className="text-white/40 text-sm">No results</p></GlassCard>
          ) : (
            ((data ?? []) as Record<string, unknown>[]).map((p) => (
              <PropertyCard key={String(p.propertyId)} property={p} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function PropertiesView() {
  const { data, isLoading } = useRealEstateProperties({ available: true });
  const toggleFav = useToggleFavorite();
  const { tap } = useHaptic();

  if (isLoading) return <LoadingState />;
  const items = (data as { items?: Record<string, unknown>[] })?.items ?? [];

  return (
    <div className="p-4 space-y-2">
      <p className="text-white/60 text-xs uppercase">{items.length} listings</p>
      {items.map((p) => (
        <motion.div key={String(p.propertyId)} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
          <PropertyCard property={p} onFavorite={() => { tap(); toggleFav.mutate(String(p.propertyId)); }} />
        </motion.div>
      ))}
    </div>
  );
}

function RentalsView() {
  const { data, isLoading } = useRealEstateRentals();
  if (isLoading) return <LoadingState />;
  return (
    <div className="p-4 space-y-2">
      {((data ?? []) as Record<string, unknown>[]).map((r) => (
        <GlassCard key={String(r.rentalId)} className="p-3">
          <p className="text-white text-sm font-medium">Property {String(r.propertyId)}</p>
          <p className="text-gulf-gold text-sm">₴ {Number(r.monthlyRent).toLocaleString()}/mo</p>
          <p className="text-white/40 text-xs capitalize">{String(r.status)}</p>
        </GlassCard>
      ))}
    </div>
  );
}

function SalesView() {
  const { data, isLoading } = useRealEstateSales();
  if (isLoading) return <LoadingState />;
  return (
    <div className="p-4 space-y-2">
      {((data ?? []) as Record<string, unknown>[]).map((s) => (
        <GlassCard key={String(s.saleId)} className="p-3">
          <p className="text-white text-sm">{String(s.propertyId)}</p>
          <p className="text-gulf-gold font-bold">₴ {Number(s.salePrice).toLocaleString()}</p>
          <p className="text-white/40 text-xs capitalize">{String(s.status)}</p>
        </GlassCard>
      ))}
    </div>
  );
}

function AnalyticsView() {
  const { data, isLoading } = useRealEstateAnalytics();
  if (isLoading) return <LoadingState />;
  const a = (data ?? {}) as Record<string, number>;

  return (
    <div className="p-4 grid grid-cols-2 gap-2">
      {[
        ['Market Value', a.marketValue], ['Rental Income', a.rentalIncome],
        ['Monthly Revenue', a.monthlyRevenue], ['Maintenance', a.maintenanceCost],
        ['Occupancy', `${(a.occupancyRate ?? 0).toFixed(0)}%`], ['ROI', `${(a.roi ?? 0).toFixed(1)}%`],
        ['Profit', a.profit], ['Properties', a.propertyCount],
      ].map(([label, val]) => (
        <GlassCard key={String(label)} className="p-3 text-center">
          <p className="text-lg font-bold text-gulf-gold">
            {typeof val === 'number' ? `₴ ${val.toLocaleString()}` : val}
          </p>
          <p className="text-[10px] text-white/50 uppercase">{String(label)}</p>
        </GlassCard>
      ))}
    </div>
  );
}

function FavoritesView() {
  const { data, isLoading } = useRealEstateFavorites();
  if (isLoading) return <LoadingState />;
  return (
    <div className="p-4 space-y-2">
      {((data ?? []) as Record<string, unknown>[]).length === 0 ? (
        <GlassCard className="p-8 text-center">
          <p className="text-3xl mb-2">❤️</p>
          <p className="text-white/50 text-sm">No saved properties</p>
        </GlassCard>
      ) : (
        ((data ?? []) as Record<string, unknown>[]).map((p) => (
          <PropertyCard key={String(p.propertyId)} property={p} />
        ))
      )}
    </div>
  );
}

function MessagesView() {
  const { data } = useRealEstateOffers();
  const offers = (data ?? []) as Record<string, unknown>[];
  return (
    <div className="p-4 space-y-2">
      <p className="text-white/60 text-xs uppercase">Offers & Negotiations</p>
      {offers.length === 0 ? (
        <GlassCard className="p-6 text-center"><p className="text-white/40 text-sm">No messages yet</p></GlassCard>
      ) : (
        offers.map((o) => (
          <GlassCard key={String(o.offerId)} className="p-3">
            <p className="text-white text-sm">Offer on {String(o.propertyId)}</p>
            <p className="text-gulf-gold">₴ {Number(o.amount).toLocaleString()}</p>
            <p className="text-white/40 text-xs capitalize">{String(o.status)} · {String(o.type)}</p>
          </GlassCard>
        ))
      )}
    </div>
  );
}

function MoreView() {
  return (
    <div className="p-4 space-y-3">
      {['Property Types', 'Dealer Panel', 'Inspections', 'Insurance', 'Settings', 'Audit Logs'].map((item) => (
        <GlassCard key={item} className="p-4 flex justify-between items-center">
          <span className="text-white text-sm">{item}</span>
          <span className="text-white/30">›</span>
        </GlassCard>
      ))}
    </div>
  );
}

export function RealEstateApp() {
  useRealEstateInit();
  useRealEstateSocketSync();

  const activeTab = useRealEstateStore((s) => s.activeTab);
  const setActiveTab = useRealEstateStore((s) => s.setActiveTab);
  const { tap } = useHaptic();

  const renderTab = () => {
    switch (activeTab) {
      case 'home': return <HomeView />;
      case 'search': return <SearchView />;
      case 'properties': return <PropertiesView />;
      case 'rentals': return <RentalsView />;
      case 'sales': return <SalesView />;
      case 'analytics': return <AnalyticsView />;
      case 'favorites': return <FavoritesView />;
      case 'messages': return <MessagesView />;
      case 'more': return <MoreView />;
      default: return <HomeView />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-[#0c1a2e] via-[#102038] to-[#0a1525] text-white overflow-hidden">
      <div className="flex-shrink-0 pt-2 pb-1 px-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏠</span>
          <div>
            <h1 className="text-base font-bold text-gulf-gold">GULF Real Estate</h1>
            <p className="text-[10px] text-white/40 uppercase tracking-widest">Official Property Platform</p>
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
