import { v4 as uuidv4 } from 'uuid';
import { Stock } from '../database/models/Stock';
import { StockPrice } from '../database/models/StockPrice';
import { StockHistory } from '../database/models/StockHistory';
import { Order } from '../database/models/Order';
import { ListedCompany } from '../database/models/ListedCompany';
import { MAX_ORDER_BOOK_IMPACT } from '../constants/exchange';
import {
  getEconomyValuation, getEconomyState, getSectorDemand, getActiveEconomicEvents,
} from './exchangeIntegrationService';
import { broadcast } from './socketService';

export interface PriceDerivation {
  price: number;
  economyBasePrice: number;
  orderBookImpact: number;
  demandImpact: number;
  confidenceImpact: number;
  eventImpact: number;
  economyValuationId: string;
  totalValuation: number;
}

/** Derives stock price from Economy Engine valuation — NEVER random */
export async function deriveStockPrice(stockId: string): Promise<PriceDerivation> {
  const stock = await Stock.findOne({ stockId, deletedAt: null });
  if (!stock) throw new Error('STOCK_NOT_FOUND');

  const listed = await ListedCompany.findOne({ listedCompanyId: stock.listedCompanyId, deletedAt: null });
  if (!listed) throw new Error('LISTED_COMPANY_NOT_FOUND');

  const valuation = await getEconomyValuation(listed.companyId);
  const shares = stock.outstandingShares || listed.outstandingShares || 1;
  const economyBasePrice = valuation.totalValuation / shares;

  const [buyOrders, sellOrders, demand, economyState, events] = await Promise.all([
    Order.aggregate([
      { $match: { stockId, side: 'buy', status: { $in: ['pending', 'partial'] }, deletedAt: null } },
      { $group: { _id: null, volume: { $sum: '$remainingQuantity' }, value: { $sum: { $multiply: ['$remainingQuantity', { $ifNull: ['$limitPrice', stock.currentPrice] }] } } } },
    ]),
    Order.aggregate([
      { $match: { stockId, side: 'sell', status: { $in: ['pending', 'partial'] }, deletedAt: null } },
      { $group: { _id: null, volume: { $sum: '$remainingQuantity' }, value: { $sum: { $multiply: ['$remainingQuantity', { $ifNull: ['$limitPrice', stock.currentPrice] }] } } } },
    ]),
    getSectorDemand(stock.sector),
    getEconomyState(),
    getActiveEconomicEvents(stock.sector),
  ]);

  const buyVol = buyOrders[0]?.volume ?? 0;
  const sellVol = sellOrders[0]?.volume ?? 0;
  const totalVol = buyVol + sellVol + 1;
  const orderBookImpact = clamp(((buyVol - sellVol) / totalVol) * MAX_ORDER_BOOK_IMPACT, -MAX_ORDER_BOOK_IMPACT, MAX_ORDER_BOOK_IMPACT);

  const demandImpact = clamp(((demand?.index ?? 1) - 1) * 0.01, -0.02, 0.02);
  const confidenceImpact = clamp(((economyState?.marketConfidence ?? 0.5) - 0.5) * 0.02, -0.01, 0.01);
  const eventImpact = clamp(events.reduce((s, e) => s + e.impact, 0) * 0.005, -0.03, 0.03);

  const price = roundPrice(economyBasePrice * (1 + orderBookImpact + demandImpact + confidenceImpact + eventImpact));

  return {
    price,
    economyBasePrice: roundPrice(economyBasePrice),
    orderBookImpact,
    demandImpact,
    confidenceImpact,
    eventImpact,
    economyValuationId: valuation.valuationId,
    totalValuation: valuation.totalValuation,
  };
}

export async function updateStockPrice(stockId: string): Promise<PriceDerivation> {
  const derivation = await deriveStockPrice(stockId);
  const stock = await Stock.findOne({ stockId, deletedAt: null });
  if (!stock) throw new Error('STOCK_NOT_FOUND');

  const prevPrice = stock.currentPrice;
  stock.currentPrice = derivation.price;
  stock.marketCap = derivation.price * stock.outstandingShares;
  stock.bookValue = derivation.totalValuation / stock.outstandingShares;
  stock.peRatio = stock.currentPrice > 0 && (await getEconomyValuation(stock.companyId)).profit > 0
    ? stock.marketCap / ((await getEconomyValuation(stock.companyId)).profit * stock.outstandingShares / 1_000_000)
    : 0;
  stock.marketConfidence = (await getEconomyState())?.marketConfidence ?? 0.5;
  stock.economyValuationId = derivation.economyValuationId;
  stock.lastPriceUpdateAt = new Date();

  if (derivation.price > stock.high || stock.high === 0) stock.high = derivation.price;
  if (derivation.price < stock.low || stock.low === 0) stock.low = derivation.price;
  if (derivation.price > stock.week52High || stock.week52High === 0) stock.week52High = derivation.price;
  if (derivation.price < stock.week52Low || stock.week52Low === 0) stock.week52Low = derivation.price;

  await stock.save();

  await StockPrice.create({
    priceId: `SPRC-${uuidv4().slice(0, 8).toUpperCase()}`,
    stockId,
    ticker: stock.ticker,
    price: derivation.price,
    economyBasePrice: derivation.economyBasePrice,
    orderBookImpact: derivation.orderBookImpact,
    demandImpact: derivation.demandImpact,
    confidenceImpact: derivation.confidenceImpact + derivation.eventImpact,
    economyValuationId: derivation.economyValuationId,
    totalValuation: derivation.totalValuation,
    recordedAt: new Date(),
  });

  const period = new Date().toISOString().slice(0, 13);
  await StockHistory.findOneAndUpdate(
    { stockId, interval: '1h', period },
    {
      historyId: `SHST-${stockId}-${period}`,
      stockId,
      ticker: stock.ticker,
      period,
      open: prevPrice || derivation.price,
      high: Math.max(prevPrice, derivation.price),
      low: Math.min(prevPrice || derivation.price, derivation.price),
      close: derivation.price,
      $inc: { volume: 0 },
      interval: '1h',
      recordedAt: new Date(),
    },
    { upsert: true }
  );

  await ListedCompany.updateOne(
    { listedCompanyId: stock.listedCompanyId },
    { marketCap: stock.marketCap, economyValuationId: derivation.economyValuationId, lastValuationAt: new Date() }
  );

  broadcast('stock:update' as never, { stockId, ticker: stock.ticker, price: derivation.price });
  return derivation;
}

export async function updateAllStockPrices(): Promise<number> {
  const stocks = await Stock.find({ deletedAt: null, tradingStatus: 'active' });
  let updated = 0;
  for (const stock of stocks) {
    await updateStockPrice(stock.stockId);
    updated++;
  }
  broadcast('exchange:update' as never, { updated, at: new Date().toISOString() });
  return updated;
}

function roundPrice(n: number): number {
  return Math.max(0.01, Math.round(n * 100) / 100);
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}
