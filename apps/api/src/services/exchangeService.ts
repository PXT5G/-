import { v4 as uuidv4 } from 'uuid';
import { Types } from 'mongoose';
import { Exchange } from '../database/models/Exchange';
import { ListedCompany } from '../database/models/ListedCompany';
import { Stock } from '../database/models/Stock';
import { StockHistory } from '../database/models/StockHistory';
import { MarketIndex } from '../database/models/MarketIndex';
import { Portfolio } from '../database/models/Portfolio';
import { PortfolioHolding } from '../database/models/PortfolioHolding';
import { Order } from '../database/models/Order';
import { Trade } from '../database/models/Trade';
import { IPO } from '../database/models/IPO';
import { Dividend } from '../database/models/Dividend';
import { CorporateAction } from '../database/models/CorporateAction';
import { Watchlist } from '../database/models/Watchlist';
import { ExchangeNews } from '../database/models/ExchangeNews';
import { ExchangeAuditLog } from '../database/models/ExchangeAuditLog';
import { Company } from '../database/models/Company';
import { EXCHANGE_ID, EXCHANGE_SOCKET_EVENTS } from '../constants/exchange';

const PAGE_LIMIT = 20;
import { seedExchangeRoleConfigs, assertExchangePermission } from './exchangeRBACService';
import { logExchangeAction, notifyExchangeUser, getEconomyValuation, syncBusinessMetrics } from './exchangeIntegrationService';
import { updateAllStockPrices, updateStockPrice } from './exchangePriceService';
import { placeOrder, cancelOrder, processPendingOrders, refreshPortfolioValue } from './exchangeMatchingService';
import { getFraudAlerts } from './exchangeFraudService';
import { seedExchangeData, generatePortfolioIban } from './exchangeSeedService';
import { broadcast } from './socketService';
import { checkPermission } from './permissionBrokerService';
import { EXCHANGE_APP_BUNDLE } from '../constants/exchange';

export async function initializeExchange(userId: string, userRole?: string) {
  await assertExchangePermission(userId, 'platform.access', userRole);
  await seedExchangeRoleConfigs();
  const hasApp = await checkPermission(userId, EXCHANGE_APP_BUNDLE, 'location');
  if (!hasApp && userRole !== 'admin') throw new Error('APP_NOT_INSTALLED');

  await seedExchangeData(userId);
  await ensurePortfolio(userId);

  await logExchangeAction({ userId, actorId: userId, action: 'exchange_initialized', resource: 'exchange', resourceId: EXCHANGE_ID });
  broadcast('exchange:update' as never, { initialized: true });
  return { initialized: true, exchangeId: EXCHANGE_ID };
}

async function ensurePortfolio(userId: string) {
  let portfolio = await Portfolio.findOne({ userId: new Types.ObjectId(userId), deletedAt: null });
  if (!portfolio) {
    portfolio = await Portfolio.create({
      portfolioId: `PF-${uuidv4().slice(0, 8).toUpperCase()}`,
      userId: new Types.ObjectId(userId),
      cashBalance: 500_000,
      iban: generatePortfolioIban(userId),
      walletId: `WLT-INV-${userId.slice(-6)}`,
    });
  }
  await refreshPortfolioValue(portfolio.portfolioId);
  return portfolio;
}

export async function getDashboard(userId: string, userRole?: string) {
  await assertExchangePermission(userId, 'dashboard.view', userRole);
  const [exchange, stocks, indexes, portfolio, recentTrades, news] = await Promise.all([
    Exchange.findOne({ exchangeId: EXCHANGE_ID }),
    Stock.find({ deletedAt: null, tradingStatus: 'active' }).sort({ volume24h: -1 }).limit(10),
    MarketIndex.find().sort({ value: -1 }),
    ensurePortfolio(userId),
    Trade.find().sort({ executedAt: -1 }).limit(10),
    ExchangeNews.find({ isPublished: true }).sort({ publishedAt: -1 }).limit(5),
  ]);
  return {
    exchange,
    topStocks: stocks,
    indexes,
    portfolio,
    recentTrades,
    news,
    stats: {
      listedCount: exchange?.listedCount ?? 0,
      totalMarketCap: exchange?.totalMarketCap ?? 0,
      volume24h: exchange?.totalVolume24h ?? 0,
    },
  };
}

export async function listStocks(userId: string, params: {
  page?: number; limit?: number; sector?: string; query?: string;
  minPrice?: number; maxPrice?: number; sort?: string;
}, userRole?: string) {
  await assertExchangePermission(userId, 'stocks.view', userRole);
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const filter: Record<string, unknown> = { deletedAt: null, tradingStatus: 'active' };
  if (params.sector) filter.sector = params.sector;
  if (params.query) {
    filter.$or = [
      { ticker: { $regex: params.query, $options: 'i' } },
      { name: { $regex: params.query, $options: 'i' } },
    ];
  }
  if (params.minPrice) filter.currentPrice = { ...(filter.currentPrice as object), $gte: params.minPrice };
  if (params.maxPrice) filter.currentPrice = { ...(filter.currentPrice as object), $lte: params.maxPrice };

  const sortField = params.sort === 'volume' ? { volume24h: -1 } : params.sort === 'cap' ? { marketCap: -1 } : { currentPrice: -1 };
  const [items, total] = await Promise.all([
    Stock.find(filter).sort(sortField as never).skip((page - 1) * limit).limit(limit),
    Stock.countDocuments(filter),
  ]);
  return { items, total, page, limit };
}

export async function getStock(userId: string, idOrTicker: string, userRole?: string) {
  await assertExchangePermission(userId, 'stocks.view', userRole);
  const stock = await Stock.findOne({
    $or: [{ stockId: idOrTicker }, { ticker: idOrTicker.toUpperCase() }],
    deletedAt: null,
  });
  if (!stock) throw new Error('STOCK_NOT_FOUND');
  const [history, listed, metrics] = await Promise.all([
    StockHistory.find({ stockId: stock.stockId, interval: '1h' }).sort({ recordedAt: -1 }).limit(48),
    ListedCompany.findOne({ listedCompanyId: stock.listedCompanyId }),
    syncBusinessMetrics(stock.companyId),
  ]);
  return { stock, history, listed, metrics };
}

export async function getPortfolio(userId: string, userRole?: string) {
  await assertExchangePermission(userId, 'portfolio.view', userRole);
  const portfolio = await ensurePortfolio(userId);
  const holdings = await PortfolioHolding.find({ portfolioId: portfolio.portfolioId, deletedAt: null });
  return { portfolio, holdings };
}

export async function createOrder(userId: string, data: {
  stockId: string; type: 'market' | 'limit' | 'stop' | 'stop_limit';
  side: 'buy' | 'sell'; quantity: number; limitPrice?: number; stopPrice?: number;
}, userRole?: string, meta?: { ipAddress?: string }) {
  await assertExchangePermission(userId, 'orders.create', userRole);
  const portfolio = await ensurePortfolio(userId);
  const order = await placeOrder({
    userId,
    portfolioId: portfolio.portfolioId,
    stockId: data.stockId,
    type: data.type,
    side: data.side,
    quantity: data.quantity,
    limitPrice: data.limitPrice,
    stopPrice: data.stopPrice,
    actorId: userId,
  });
  await updateStockPrice(data.stockId);
  await logExchangeAction({
    userId, actorId: userId, action: 'order_placed', resource: 'order', resourceId: order.orderId,
    metadata: data, ipAddress: meta?.ipAddress,
  });
  return order;
}

export async function cancelUserOrder(userId: string, orderId: string, userRole?: string) {
  await assertExchangePermission(userId, 'orders.cancel', userRole);
  return cancelOrder(userId, orderId, userId);
}

export async function listOrders(userId: string, params: { status?: string; page?: number }, userRole?: string) {
  await assertExchangePermission(userId, 'orders.view', userRole);
  const filter: Record<string, unknown> = { userId: new Types.ObjectId(userId), deletedAt: null };
  if (params.status) filter.status = params.status;
  const page = params.page ?? 1;
  const [items, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * PAGE_LIMIT).limit(PAGE_LIMIT),
    Order.countDocuments(filter),
  ]);
  return { items, total, page };
}

export async function listTrades(userId: string, params: { page?: number }, userRole?: string) {
  await assertExchangePermission(userId, 'orders.view', userRole);
  const page = params.page ?? 1;
  const filter = { userId: new Types.ObjectId(userId) };
  const [items, total] = await Promise.all([
    Trade.find(filter).sort({ executedAt: -1 }).skip((page - 1) * PAGE_LIMIT).limit(PAGE_LIMIT),
    Trade.countDocuments(filter),
  ]);
  return { items, total, page };
}

export async function listIndexes(userId: string, userRole?: string) {
  await assertExchangePermission(userId, 'indexes.view', userRole);
  return MarketIndex.find().sort({ value: -1 });
}

export async function listNews(userId: string, params: { category?: string; page?: number }, userRole?: string) {
  await assertExchangePermission(userId, 'news.view', userRole);
  const filter: Record<string, unknown> = { isPublished: true };
  if (params.category) filter.category = params.category;
  const page = params.page ?? 1;
  const [items, total] = await Promise.all([
    ExchangeNews.find(filter).sort({ publishedAt: -1 }).skip((page - 1) * PAGE_LIMIT).limit(PAGE_LIMIT),
    ExchangeNews.countDocuments(filter),
  ]);
  return { items, total, page };
}

export async function getWatchlist(userId: string, userRole?: string) {
  await assertExchangePermission(userId, 'watchlist.manage', userRole);
  let wl = await Watchlist.findOne({ userId: new Types.ObjectId(userId), name: 'Default' });
  if (!wl) {
    wl = await Watchlist.create({
      watchlistId: `WL-${uuidv4().slice(0, 8).toUpperCase()}`,
      userId: new Types.ObjectId(userId),
      name: 'Default',
      tickers: [],
      stockIds: [],
    });
  }
  const stocks = wl.stockIds.length > 0
    ? await Stock.find({ stockId: { $in: wl.stockIds }, deletedAt: null })
    : [];
  return { watchlist: wl, stocks };
}

export async function updateWatchlist(userId: string, tickers: string[], userRole?: string) {
  await assertExchangePermission(userId, 'watchlist.manage', userRole);
  const stocks = await Stock.find({ ticker: { $in: tickers.map((t) => t.toUpperCase()) }, deletedAt: null });
  const wl = await Watchlist.findOneAndUpdate(
    { userId: new Types.ObjectId(userId), name: 'Default' },
    {
      watchlistId: `WL-${uuidv4().slice(0, 8).toUpperCase()}`,
      tickers: stocks.map((s) => s.ticker),
      stockIds: stocks.map((s) => s.stockId),
    },
    { upsert: true, new: true }
  );
  return wl;
}

export async function applyIPO(userId: string, data: {
  companyId: string; ticker: string; proposedName: string;
  sector: string; companyType: string; sharesOffered?: number;
}, userRole?: string) {
  await assertExchangePermission(userId, 'ipo.apply', userRole);
  const company = await Company.findOne({ companyId: data.companyId, deletedAt: null });
  if (!company) throw new Error('COMPANY_NOT_FOUND');

  let valuation;
  try { valuation = await getEconomyValuation(data.companyId); } catch { valuation = null; }
  const openingPrice = valuation ? valuation.totalValuation / (data.sharesOffered ?? 1_000_000) : 10;

  const ipo = await IPO.create({
    ipoId: `IPO-${uuidv4().slice(0, 8).toUpperCase()}`,
    companyId: data.companyId,
    applicantUserId: new Types.ObjectId(userId),
    ticker: data.ticker.toUpperCase(),
    proposedName: data.proposedName,
    sector: data.sector,
    companyType: data.companyType,
    status: 'applied',
    sharesOffered: data.sharesOffered ?? 1_000_000,
    openingPrice: Math.max(0.01, Math.round(openingPrice * 100) / 100),
    history: [{ status: 'applied', note: 'IPO application submitted', at: new Date(), actorId: new Types.ObjectId(userId) }],
    createdBy: new Types.ObjectId(userId),
  });
  await logExchangeAction({ userId, actorId: userId, action: 'ipo_applied', resource: 'ipo', resourceId: ipo.ipoId });
  return ipo;
}

export async function reviewIPO(userId: string, ipoId: string, approved: boolean, notes: string, userRole?: string) {
  await assertExchangePermission(userId, 'ipo.review', userRole);
  const ipo = await IPO.findOne({ ipoId, deletedAt: null });
  if (!ipo) throw new Error('IPO_NOT_FOUND');
  ipo.status = approved ? 'approved' : 'rejected';
  ipo.governmentReviewNotes = notes;
  ipo.reviewedBy = new Types.ObjectId(userId);
  ipo.reviewedAt = new Date();
  if (approved) ipo.approvedAt = new Date();
  ipo.history.push({ status: ipo.status, note: notes, at: new Date(), actorId: new Types.ObjectId(userId) });
  await ipo.save();
  return ipo;
}

export async function listIPOs(userId: string, status?: string, userRole?: string) {
  await assertExchangePermission(userId, 'ipo.view', userRole);
  const filter: Record<string, unknown> = { deletedAt: null };
  if (status) filter.status = status;
  return IPO.find(filter).sort({ createdAt: -1 }).limit(50);
}

export async function getAnalytics(userId: string, userRole?: string) {
  await assertExchangePermission(userId, 'analytics.view', userRole);
  const [stocks, indexes, trades24h, fraud] = await Promise.all([
    Stock.find({ deletedAt: null }).sort({ marketCap: -1 }).limit(20),
    MarketIndex.find(),
    Trade.aggregate([
      { $match: { executedAt: { $gte: new Date(Date.now() - 86400000) } } },
      { $group: { _id: null, volume: { $sum: '$quantity' }, value: { $sum: '$total' } } },
    ]),
    getFraudAlerts(10),
  ]);
  return {
    topByCap: stocks,
    indexes,
    volume24h: trades24h[0]?.volume ?? 0,
    value24h: trades24h[0]?.value ?? 0,
    fraudAlerts: fraud,
    sectorBreakdown: await Stock.aggregate([
      { $match: { deletedAt: null } },
      { $group: { _id: '$sector', count: { $sum: 1 }, cap: { $sum: '$marketCap' } } },
    ]),
  };
}

export async function search(userId: string, query: string, userRole?: string) {
  await assertExchangePermission(userId, 'search.advanced', userRole);
  const q = query.trim();
  if (!q) return { stocks: [], companies: [] };
  const [stocks, companies] = await Promise.all([
    Stock.find({
      deletedAt: null,
      $or: [
        { ticker: { $regex: q, $options: 'i' } },
        { name: { $regex: q, $options: 'i' } },
        { sector: { $regex: q, $options: 'i' } },
      ],
    }).limit(20),
    ListedCompany.find({
      deletedAt: null,
      $or: [
        { ticker: { $regex: q, $options: 'i' } },
        { name: { $regex: q, $options: 'i' } },
        { ceo: { $regex: q, $options: 'i' } },
      ],
    }).limit(10),
  ]);
  return { stocks, companies };
}

export async function getAuditLogs(userId: string, page = 1, userRole?: string) {
  await assertExchangePermission(userId, 'audit.view', userRole);
  const [items, total] = await Promise.all([
    ExchangeAuditLog.find().sort({ createdAt: -1 }).skip((page - 1) * PAGE_LIMIT).limit(PAGE_LIMIT),
    ExchangeAuditLog.countDocuments(),
  ]);
  return { items, total, page };
}

export async function tickExchange() {
  await updateAllStockPrices();
  await processPendingOrders();
  const indexes = await MarketIndex.find();
  for (const idx of indexes) {
    const stocks = await Stock.find({ stockId: { $in: idx.constituents.map((c) => c.stockId) } });
    const value = stocks.reduce((s, st, _, arr) => s + st.currentPrice * (1000 / arr.length), 0);
    idx.previousValue = idx.value;
    idx.value = value;
    idx.change = value - idx.previousValue;
    idx.changePercent = idx.previousValue > 0 ? idx.change / idx.previousValue : 0;
    idx.computedAt = new Date();
    await idx.save();
  }
  const volume = await Trade.aggregate([
    { $match: { executedAt: { $gte: new Date(Date.now() - 86400000) } } },
    { $group: { _id: null, total: { $sum: '$total' } } },
  ]);
  await Exchange.updateOne(
    { exchangeId: EXCHANGE_ID },
    { totalVolume24h: volume[0]?.total ?? 0, lastPriceUpdateAt: new Date() }
  );
  for (const ev of EXCHANGE_SOCKET_EVENTS) {
    broadcast(ev as never, { at: new Date().toISOString() });
  }
  return { updated: true };
}

export async function distributeDividend(userId: string, data: {
  stockId: string; amountPerShare: number; type: 'quarterly' | 'special' | 'annual';
  recordDate: string; paymentDate: string;
}, userRole?: string) {
  await assertExchangePermission(userId, 'dividends.distribute', userRole);
  const stock = await Stock.findOne({ stockId: data.stockId, deletedAt: null });
  if (!stock) throw new Error('STOCK_NOT_FOUND');

  const holdings = await PortfolioHolding.find({ stockId: data.stockId, deletedAt: null });
  const recipients = [];
  let totalDistributed = 0;

  for (const h of holdings) {
    const amount = h.shares * data.amountPerShare;
    totalDistributed += amount;
    const portfolio = await Portfolio.findOne({ portfolioId: h.portfolioId });
    if (portfolio) {
      portfolio.cashBalance += amount;
      portfolio.dividendIncome += amount;
      await portfolio.save();
      await notifyExchangeUser(h.userId.toString(), 'Dividend Received', `${stock.ticker}: ₴${amount.toFixed(2)}`);
    }
    recipients.push({ userId: h.userId.toString(), shares: h.shares, amount, paidAt: new Date() });
  }

  const dividend = await Dividend.create({
    dividendId: `DIV-${uuidv4().slice(0, 8).toUpperCase()}`,
    companyId: stock.companyId,
    stockId: stock.stockId,
    ticker: stock.ticker,
    type: data.type,
    amountPerShare: data.amountPerShare,
    totalDistributed,
    recordDate: new Date(data.recordDate),
    paymentDate: new Date(data.paymentDate),
    status: 'paid',
    recipients,
  });

  stock.dividendYield = data.amountPerShare / stock.currentPrice;
  await stock.save();
  broadcast('dividend:update' as never, { dividendId: dividend.dividendId, ticker: stock.ticker });
  return dividend;
}
