'use client';

import { type ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useExchangeInit, useExchangeSocketSync, useExchangeDashboard,
  useExchangeStocks, useExchangePortfolio, useExchangeOrders,
  useExchangeIndexes, useExchangeNews, useExchangeWatchlist,
  useExchangeAnalytics, useExchangeStock, useCreateOrder, useCancelOrder,
} from '@/hooks/useExchange';
import { useExchangeStore } from '@/stores/exchangeStore';
import { useHaptic } from '@/hooks/useSound';
import { cn } from '@/utils/cn';

type Tab = 'home' | 'markets' | 'stocks' | 'portfolio' | 'orders' | 'news' | 'watchlist' | 'analytics' | 'more';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'markets', label: 'Markets', icon: '📊' },
  { id: 'stocks', label: 'Stocks', icon: '💹' },
  { id: 'portfolio', label: 'Portfolio', icon: '💼' },
  { id: 'orders', label: 'Orders', icon: '📋' },
  { id: 'news', label: 'News', icon: '📰' },
  { id: 'watchlist', label: 'Watch', icon: '⭐' },
  { id: 'analytics', label: 'Stats', icon: '📈' },
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

function LineChart({ data }: { data: { close: number }[] }) {
  const points = data.slice(0, 24).reverse();
  if (points.length < 2) return <p className="text-xs text-white/40">No chart data</p>;
  const max = Math.max(...points.map((p) => p.close));
  const min = Math.min(...points.map((p) => p.close));
  const range = max - min || 1;
  const path = points.map((p, i) => {
    const x = (i / (points.length - 1)) * 100;
    const y = 100 - ((p.close - min) / range) * 80 - 10;
    return `${i === 0 ? 'M' : 'L'}${x},${y}`;
  }).join(' ');
  return (
    <svg viewBox="0 0 100 100" className="w-full h-24" preserveAspectRatio="none">
      <path d={path} fill="none" stroke="#D4AF37" strokeWidth="1.5" />
    </svg>
  );
}

function CandlestickChart({ data }: { data: { open: number; high: number; low: number; close: number }[] }) {
  const candles = data.slice(0, 20).reverse();
  if (!candles.length) return <p className="text-xs text-white/40">No candlestick data</p>;
  const allPrices = candles.flatMap((c) => [c.high, c.low]);
  const max = Math.max(...allPrices);
  const min = Math.min(...allPrices);
  const range = max - min || 1;
  return (
    <div className="flex items-end gap-0.5 h-24">
      {candles.map((c, i) => {
        const isUp = c.close >= c.open;
        const bodyTop = 100 - ((Math.max(c.open, c.close) - min) / range) * 90;
        const bodyBot = 100 - ((Math.min(c.open, c.close) - min) / range) * 90;
        const wickTop = 100 - ((c.high - min) / range) * 90;
        const wickBot = 100 - ((c.low - min) / range) * 90;
        return (
          <div key={i} className="flex-1 relative h-full">
            <div className="absolute left-1/2 w-px -translate-x-1/2 bg-white/30" style={{ top: `${wickTop}%`, height: `${wickBot - wickTop}%` }} />
            <div className={cn('absolute left-0 right-0 rounded-sm', isUp ? 'bg-green-500/70' : 'bg-red-500/70')}
              style={{ top: `${bodyTop}%`, height: `${Math.max(bodyBot - bodyTop, 2)}%` }} />
          </div>
        );
      })}
    </div>
  );
}

function StockRow({ stock, onClick }: { stock: Record<string, unknown>; onClick?: () => void }) {
  const change = Number(stock.currentPrice) - Number(stock.openingPrice);
  const changePct = Number(stock.openingPrice) > 0 ? (change / Number(stock.openingPrice)) * 100 : 0;
  return (
    <button type="button" onClick={onClick} className="w-full text-left">
      <GlassCard className="p-3 flex items-center justify-between">
        <div>
          <p className="text-white font-semibold text-sm">{String(stock.ticker)}</p>
          <p className="text-white/50 text-xs truncate max-w-[140px]">{String(stock.name)}</p>
        </div>
        <div className="text-right">
          <p className="text-gulf-gold font-bold text-sm">₴ {Number(stock.currentPrice).toFixed(2)}</p>
          <p className={cn('text-xs', change >= 0 ? 'text-green-400' : 'text-red-400')}>
            {change >= 0 ? '+' : ''}{changePct.toFixed(2)}%
          </p>
        </div>
      </GlassCard>
    </button>
  );
}

function HomeView() {
  const { data, isLoading } = useExchangeDashboard();
  if (isLoading) return <LoadingState />;
  const stats = (data as { stats?: Record<string, number> })?.stats ?? {};
  const topStocks = ((data as { topStocks?: Record<string, unknown>[] })?.topStocks ?? []);
  const indexes = ((data as { indexes?: Record<string, unknown>[] })?.indexes ?? []);

  return (
    <div className="p-4 space-y-4">
      <GlassCard className="p-4">
        <h2 className="text-gulf-gold font-bold text-lg">GULF Exchange</h2>
        <p className="text-white/50 text-xs">Official stock market · Prices from Economy Engine</p>
      </GlassCard>
      <div className="grid grid-cols-2 gap-2">
        {[
          ['Market Cap', stats.totalMarketCap, true],
          ['Listed', stats.listedCount, false],
          ['Volume 24h', stats.volume24h, true],
        ].map(([label, val, currency]) => (
          <GlassCard key={String(label)} className="p-3 text-center">
            <p className="text-lg font-bold text-gulf-gold">
              {currency ? `₴ ${Number(val ?? 0).toLocaleString()}` : Number(val ?? 0)}
            </p>
            <p className="text-[10px] text-white/50 uppercase">{String(label)}</p>
          </GlassCard>
        ))}
      </div>
      {indexes.length > 0 && (
        <GlassCard className="p-3">
          <h3 className="text-white/60 text-xs uppercase mb-2">Indexes</h3>
          <div className="space-y-1">
            {indexes.slice(0, 3).map((idx) => (
              <div key={String(idx.indexId)} className="flex justify-between text-sm">
                <span className="text-white/80">{String(idx.shortName)}</span>
                <span className="text-gulf-gold">{Number(idx.value).toFixed(0)}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
      <h3 className="text-white/60 text-xs uppercase">Top Movers</h3>
      <div className="space-y-2">
        {topStocks.slice(0, 5).map((s) => (
          <StockRow key={String(s.stockId)} stock={s} />
        ))}
      </div>
    </div>
  );
}

function MarketsView() {
  const { data: indexes, isLoading } = useExchangeIndexes();
  const { data: stocks } = useExchangeStocks({ sort: 'volume', limit: 10 });
  if (isLoading) return <LoadingState />;
  return (
    <div className="p-4 space-y-3">
      <h3 className="text-white/60 text-xs uppercase">Market Indexes</h3>
      {((indexes ?? []) as Record<string, unknown>[]).map((idx) => (
        <GlassCard key={String(idx.indexId)} className="p-3">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-white font-semibold">{String(idx.name)}</p>
              <p className="text-white/40 text-xs">{String(idx.shortName)}</p>
            </div>
            <div className="text-right">
              <p className="text-gulf-gold font-bold">{Number(idx.value).toFixed(2)}</p>
              <p className={cn('text-xs', Number(idx.change) >= 0 ? 'text-green-400' : 'text-red-400')}>
                {Number(idx.changePercent ?? 0) >= 0 ? '+' : ''}{(Number(idx.changePercent ?? 0) * 100).toFixed(2)}%
              </p>
            </div>
          </div>
        </GlassCard>
      ))}
      <h3 className="text-white/60 text-xs uppercase mt-4">Most Active</h3>
      <div className="space-y-2">
        {((stocks as { items?: Record<string, unknown>[] })?.items ?? []).map((s) => (
          <StockRow key={String(s.stockId)} stock={s} />
        ))}
      </div>
    </div>
  );
}

function StocksView() {
  const setSelectedStockId = useExchangeStore((s) => s.setSelectedStockId);
  const selectedStockId = useExchangeStore((s) => s.selectedStockId);
  const { data, isLoading } = useExchangeStocks({ limit: 30 });
  const { data: stockDetail } = useExchangeStock(selectedStockId ?? '');
  const createOrder = useCreateOrder();
  const { tap } = useHaptic();
  const [qty, setQty] = useState(10);

  if (selectedStockId && stockDetail) {
    const stock = (stockDetail as { stock?: Record<string, unknown> }).stock ?? {};
    const history = ((stockDetail as { history?: Record<string, number>[] }).history ?? []) as { open: number; high: number; low: number; close: number }[];
    return (
      <div className="p-4 space-y-3">
        <button type="button" onClick={() => { tap(); setSelectedStockId(null); }} className="text-gulf-gold text-sm">‹ Back</button>
        <GlassCard className="p-4">
          <p className="text-2xl font-bold text-white">{String(stock.ticker)}</p>
          <p className="text-white/50 text-sm">{String(stock.name)}</p>
          <p className="text-3xl font-bold text-gulf-gold mt-2">₴ {Number(stock.currentPrice).toFixed(2)}</p>
          <p className="text-white/40 text-xs mt-1">Cap: ₴ {Number(stock.marketCap).toLocaleString()} · P/E: {Number(stock.peRatio).toFixed(1)}</p>
        </GlassCard>
        <GlassCard className="p-3">
          <p className="text-xs text-white/40 uppercase mb-2">Price Chart</p>
          <LineChart data={history} />
        </GlassCard>
        <GlassCard className="p-3">
          <p className="text-xs text-white/40 uppercase mb-2">Candlestick</p>
          <CandlestickChart data={history} />
        </GlassCard>
        <GlassCard className="p-3">
          <p className="text-xs text-white/40 uppercase mb-2">Volume</p>
          <div className="flex items-end gap-0.5 h-12">
            {history.slice(0, 15).reverse().map((h, i) => (
              <div key={i} className="flex-1 bg-gulf-gold/40 rounded-t" style={{ height: `${Math.min(100, (h.close / Math.max(...history.map((x) => x.close))) * 100)}%` }} />
            ))}
          </div>
        </GlassCard>
        <div className="flex gap-2">
          <input type="number" value={qty} onChange={(e) => setQty(Number(e.target.value))}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm" />
          <button type="button" onClick={() => { tap(); createOrder.mutate({ stockId: selectedStockId, type: 'market', side: 'buy', quantity: qty }); }}
            className="px-4 py-2 rounded-xl bg-green-600/30 text-green-400 text-sm border border-green-500/30">Buy</button>
          <button type="button" onClick={() => { tap(); createOrder.mutate({ stockId: selectedStockId, type: 'market', side: 'sell', quantity: qty }); }}
            className="px-4 py-2 rounded-xl bg-red-600/30 text-red-400 text-sm border border-red-500/30">Sell</button>
        </div>
      </div>
    );
  }

  if (isLoading) return <LoadingState />;
  return (
    <div className="p-4 space-y-2">
      {((data as { items?: Record<string, unknown>[] })?.items ?? []).map((s) => (
        <StockRow key={String(s.stockId)} stock={s} onClick={() => { tap(); setSelectedStockId(String(s.stockId)); }} />
      ))}
    </div>
  );
}

function PortfolioView() {
  const { data, isLoading } = useExchangePortfolio();
  if (isLoading) return <LoadingState />;
  const portfolio = (data as { portfolio?: Record<string, number> })?.portfolio ?? {};
  const holdings = ((data as { holdings?: Record<string, unknown>[] })?.holdings ?? []);
  return (
    <div className="p-4 space-y-3">
      <GlassCard className="p-4 text-center">
        <p className="text-white/50 text-xs uppercase">Portfolio Value</p>
        <p className="text-3xl font-bold text-gulf-gold">₴ {Number(portfolio.portfolioValue ?? 0).toLocaleString()}</p>
        <p className="text-white/40 text-xs mt-1">Cash: ₴ {Number(portfolio.cashBalance ?? 0).toLocaleString()}</p>
      </GlassCard>
      <div className="grid grid-cols-2 gap-2">
        {[
          ['Unrealized', portfolio.unrealizedProfit],
          ['Realized', portfolio.realizedProfit],
          ['Dividends', portfolio.dividendIncome],
        ].map(([label, val]) => (
          <GlassCard key={String(label)} className="p-3 text-center">
            <p className={cn('text-sm font-bold', Number(val) >= 0 ? 'text-green-400' : 'text-red-400')}>
              ₴ {Number(val ?? 0).toLocaleString()}
            </p>
            <p className="text-[10px] text-white/50">{String(label)}</p>
          </GlassCard>
        ))}
      </div>
      <h3 className="text-white/60 text-xs uppercase">Holdings</h3>
      {holdings.length === 0 ? (
        <p className="text-white/40 text-sm text-center py-8">No holdings yet</p>
      ) : holdings.map((h) => (
        <GlassCard key={String(h.holdingId)} className="p-3 flex justify-between">
          <div>
            <p className="text-white font-semibold text-sm">{String(h.ticker)}</p>
            <p className="text-white/40 text-xs">{Number(h.shares)} shares @ ₴{Number(h.averageCost).toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-gulf-gold text-sm">₴ {Number(h.marketValue).toLocaleString()}</p>
            <p className={cn('text-xs', Number(h.unrealizedProfit) >= 0 ? 'text-green-400' : 'text-red-400')}>
              {Number(h.unrealizedProfit) >= 0 ? '+' : ''}₴{Number(h.unrealizedProfit).toFixed(0)}
            </p>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}

function OrdersView() {
  const { data, isLoading } = useExchangeOrders();
  const cancelOrder = useCancelOrder();
  const { tap } = useHaptic();
  if (isLoading) return <LoadingState />;
  const orders = ((data as { items?: Record<string, unknown>[] })?.items ?? []);
  return (
    <div className="p-4 space-y-2">
      {orders.length === 0 ? <p className="text-white/40 text-sm text-center py-8">No orders</p> : orders.map((o) => (
        <GlassCard key={String(o.orderId)} className="p-3">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-white font-semibold text-sm">{String(o.ticker)} · {String(o.side).toUpperCase()}</p>
              <p className="text-white/40 text-xs">{String(o.type)} · {Number(o.quantity)} shares</p>
            </div>
            <span className={cn('text-xs px-2 py-0.5 rounded-full',
              o.status === 'filled' ? 'bg-green-500/20 text-green-400' :
              o.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/10 text-white/50')}>
              {String(o.status)}
            </span>
          </div>
          {o.status === 'pending' && (
            <button type="button" onClick={() => { tap(); cancelOrder.mutate(String(o.orderId)); }}
              className="text-red-400 text-xs mt-2">Cancel</button>
          )}
        </GlassCard>
      ))}
    </div>
  );
}

function NewsView() {
  const { data, isLoading } = useExchangeNews();
  if (isLoading) return <LoadingState />;
  const items = ((data as { items?: Record<string, unknown>[] })?.items ?? []);
  return (
    <div className="p-4 space-y-2">
      {items.map((n) => (
        <GlassCard key={String(n.newsId)} className="p-3">
          <span className="text-[10px] text-gulf-gold uppercase">{String(n.category)}</span>
          <p className="text-white text-sm font-medium mt-1">{String(n.title)}</p>
          <p className="text-white/40 text-xs mt-1">{String(n.summary)}</p>
        </GlassCard>
      ))}
    </div>
  );
}

function WatchlistView() {
  const { data, isLoading } = useExchangeWatchlist();
  if (isLoading) return <LoadingState />;
  const stocks = ((data as { stocks?: Record<string, unknown>[] })?.stocks ?? []);
  return (
    <div className="p-4 space-y-2">
      {stocks.length === 0 ? <p className="text-white/40 text-sm text-center py-8">Add stocks to your watchlist</p> :
        stocks.map((s) => <StockRow key={String(s.stockId)} stock={s} />)}
    </div>
  );
}

function AnalyticsView() {
  const { data, isLoading } = useExchangeAnalytics();
  if (isLoading) return <LoadingState />;
  const a = data as Record<string, unknown>;
  const sectors = (a.sectorBreakdown as { _id: string; count: number; cap: number }[]) ?? [];
  return (
    <div className="p-4 space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {[
          ['Volume 24h', a.volume24h],
          ['Value 24h', a.value24h],
        ].map(([label, val]) => (
          <GlassCard key={String(label)} className="p-3 text-center">
            <p className="text-lg font-bold text-gulf-gold">{Number(val ?? 0).toLocaleString()}</p>
            <p className="text-[10px] text-white/50 uppercase">{String(label)}</p>
          </GlassCard>
        ))}
      </div>
      <GlassCard className="p-3">
        <h3 className="text-xs text-white/40 uppercase mb-2">Sector Breakdown</h3>
        {sectors.map((s) => (
          <div key={s._id} className="flex justify-between py-1 text-sm">
            <span className="text-white/70 capitalize">{s._id}</span>
            <span className="text-gulf-gold">₴ {s.cap.toLocaleString()}</span>
          </div>
        ))}
      </GlassCard>
    </div>
  );
}

function MoreView() {
  return (
    <div className="p-4 space-y-3">
      <GlassCard className="p-4">
        <h3 className="text-white font-semibold">GULF Exchange</h3>
        <p className="text-white/50 text-xs mt-2">Official stock market powered by the Economy Engine. All prices derive from real company valuations.</p>
      </GlassCard>
      {['IPO Applications', 'Dividend History', 'Corporate Actions', 'Investment Statements', 'Anti-Fraud Reports'].map((item) => (
        <GlassCard key={item} className="p-3 flex justify-between items-center">
          <span className="text-white/80 text-sm">{item}</span>
          <span className="text-white/30">›</span>
        </GlassCard>
      ))}
    </div>
  );
}

export function ExchangeApp() {
  useExchangeInit();
  useExchangeSocketSync();
  const { tap } = useHaptic();
  const activeTab = useExchangeStore((s) => s.activeTab);
  const setActiveTab = useExchangeStore((s) => s.setActiveTab);

  const views: Record<Tab, ReactNode> = {
    home: <HomeView />,
    markets: <MarketsView />,
    stocks: <StocksView />,
    portfolio: <PortfolioView />,
    orders: <OrdersView />,
    news: <NewsView />,
    watchlist: <WatchlistView />,
    analytics: <AnalyticsView />,
    more: <MoreView />,
  };

  return (
    <div className="h-full flex flex-col bg-black">
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {views[activeTab]}
          </motion.div>
        </AnimatePresence>
      </div>
      <nav className="border-t border-white/10 bg-black/80 backdrop-blur-md px-1 py-1">
        <div className="flex overflow-x-auto gap-0.5 scrollbar-hide">
          {TABS.map((tab) => (
            <button key={tab.id} type="button"
              onClick={() => { tap(); setActiveTab(tab.id); }}
              className={cn('flex flex-col items-center min-w-[52px] py-1.5 px-1 rounded-xl transition-colors',
                activeTab === tab.id ? 'bg-gulf-gold/15 text-gulf-gold' : 'text-white/40')}>
              <span className="text-base">{tab.icon}</span>
              <span className="text-[9px] mt-0.5">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
