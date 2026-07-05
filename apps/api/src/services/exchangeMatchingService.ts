import { v4 as uuidv4 } from 'uuid';
import { Types } from 'mongoose';
import { Order } from '../database/models/Order';
import { Trade } from '../database/models/Trade';
import { Stock } from '../database/models/Stock';
import { Portfolio } from '../database/models/Portfolio';
import { PortfolioHolding } from '../database/models/PortfolioHolding';
import { ListedCompany } from '../database/models/ListedCompany';
import { TRADING_FEE_RATE, LARGE_TRADE_THRESHOLD } from '../constants/exchange';
import { deriveStockPrice } from './exchangePriceService';
import { logExchangeAction, notifyExchangeUser } from './exchangeIntegrationService';
import { broadcast } from './socketService';
import { detectFraud } from './exchangeFraudService';

export async function placeOrder(params: {
  userId: string;
  portfolioId: string;
  stockId: string;
  type: 'market' | 'limit' | 'stop' | 'stop_limit';
  side: 'buy' | 'sell';
  quantity: number;
  limitPrice?: number;
  stopPrice?: number;
  actorId: string;
}) {
  const stock = await Stock.findOne({ stockId: params.stockId, deletedAt: null, tradingStatus: 'active' });
  if (!stock) throw new Error('STOCK_NOT_FOUND');

  const portfolio = await Portfolio.findOne({ portfolioId: params.portfolioId, userId: new Types.ObjectId(params.userId), deletedAt: null });
  if (!portfolio) throw new Error('PORTFOLIO_NOT_FOUND');

  const derivation = await deriveStockPrice(params.stockId);
  const executionPrice = resolveExecutionPrice(params, derivation.price, stock.currentPrice);

  if (params.side === 'sell') {
    const holding = await PortfolioHolding.findOne({ portfolioId: params.portfolioId, stockId: params.stockId, deletedAt: null });
    if (!holding || holding.shares < params.quantity) throw new Error('INSUFFICIENT_SHARES');
  }

  if (params.side === 'buy') {
    const estimatedCost = executionPrice * params.quantity * (1 + TRADING_FEE_RATE);
    if (portfolio.cashBalance < estimatedCost) throw new Error('INSUFFICIENT_FUNDS');
  }

  const order = await Order.create({
    orderId: `ORD-${uuidv4().slice(0, 8).toUpperCase()}`,
    userId: new Types.ObjectId(params.userId),
    portfolioId: params.portfolioId,
    stockId: params.stockId,
    ticker: stock.ticker,
    type: params.type,
    side: params.side,
    status: 'pending',
    quantity: params.quantity,
    filledQuantity: 0,
    remainingQuantity: params.quantity,
    limitPrice: params.limitPrice,
    stopPrice: params.stopPrice,
    averageFillPrice: 0,
    totalCost: 0,
    fee: 0,
    createdBy: new Types.ObjectId(params.actorId),
  });

  if (params.type === 'market' || shouldExecuteLimit(params, derivation.price)) {
    await executeOrder(order.orderId, executionPrice, params.actorId);
  } else if (params.type === 'stop' || params.type === 'stop_limit') {
    order.status = 'pending';
    await order.save();
  }

  broadcast('order:update' as never, { orderId: order.orderId, status: order.status });
  return order;
}

function resolveExecutionPrice(
  params: { type: string; limitPrice?: number; stopPrice?: number; side: string },
  derivedPrice: number,
  currentPrice: number
): number {
  const price = derivedPrice || currentPrice;
  if (params.type === 'limit' && params.limitPrice) return params.limitPrice;
  if (params.type === 'stop_limit' && params.limitPrice) return params.limitPrice;
  return price;
}

function shouldExecuteLimit(
  params: { type: string; side: string; limitPrice?: number },
  currentPrice: number
): boolean {
  if (params.type !== 'limit' && params.type !== 'stop_limit') return false;
  if (!params.limitPrice) return false;
  if (params.side === 'buy') return currentPrice <= params.limitPrice;
  return currentPrice >= params.limitPrice;
}

export async function executeOrder(orderId: string, price: number, actorId: string): Promise<InstanceType<typeof Trade> | null> {
  const order = await Order.findOne({ orderId, deletedAt: null });
  if (!order || !['pending', 'partial'].includes(order.status)) return null;

  const fillQty = order.remainingQuantity ?? order.quantity - order.filledQuantity;
  if (fillQty <= 0) return null;

  const total = price * fillQty;
  const fee = total * TRADING_FEE_RATE;
  const portfolio = await Portfolio.findOne({ portfolioId: order.portfolioId, deletedAt: null });
  if (!portfolio) throw new Error('PORTFOLIO_NOT_FOUND');

  const stock = await Stock.findOne({ stockId: order.stockId, deletedAt: null });
  if (!stock) throw new Error('STOCK_NOT_FOUND');

  if (order.side === 'buy') {
    const cost = total + fee;
    if (portfolio.cashBalance < cost) {
      const affordable = Math.floor(portfolio.cashBalance / (price * (1 + TRADING_FEE_RATE)));
      if (affordable <= 0) throw new Error('INSUFFICIENT_FUNDS');
      return executePartialOrder(order.orderId, affordable, price, actorId);
    }
    portfolio.cashBalance -= cost;
    portfolio.totalInvested += total;
    await upsertHolding(portfolio, order, fillQty, price, 'buy');
  } else {
    const holding = await PortfolioHolding.findOne({ portfolioId: order.portfolioId, stockId: order.stockId, deletedAt: null });
    if (!holding || holding.shares < fillQty) throw new Error('INSUFFICIENT_SHARES');
    const avgCost = holding.averageCost;
    const proceeds = total - fee;
    portfolio.cashBalance += proceeds;
    holding.shares -= fillQty;
    holding.realizedProfit += (price - avgCost) * fillQty;
    if (holding.shares <= 0) {
      await holding.deleteOne();
    } else {
      holding.marketValue = holding.shares * price;
      holding.unrealizedProfit = (price - avgCost) * holding.shares;
      await holding.save();
    }
    portfolio.realizedProfit += (price - avgCost) * fillQty;
  }

  const derivation = await deriveStockPrice(order.stockId);
  const fraudFlags = await detectFraud({
    userId: order.userId.toString(),
    stockId: order.stockId,
    side: order.side,
    quantity: fillQty,
    total: total + fee,
    companyId: stock.companyId,
  });

  const trade = await Trade.create({
    tradeId: `TRD-${uuidv4().slice(0, 8).toUpperCase()}`,
    orderId: order.orderId,
    userId: order.userId,
    stockId: order.stockId,
    ticker: order.ticker,
    side: order.side,
    quantity: fillQty,
    price,
    total: total + fee,
    fee,
    economyValuationId: derivation.economyValuationId,
    priceAtTrade: price,
    suspicious: fraudFlags.length > 0,
    fraudFlags,
    executedAt: new Date(),
  });

  order.filledQuantity += fillQty;
  order.remainingQuantity = order.quantity - order.filledQuantity;
  order.averageFillPrice = ((order.averageFillPrice * (order.filledQuantity - fillQty)) + price * fillQty) / order.filledQuantity;
  order.totalCost += total + fee;
  order.fee += fee;
  order.status = order.remainingQuantity <= 0 ? 'filled' : 'partial';
  if (order.status === 'filled') order.filledAt = new Date();
  await order.save();

  stock.volume += fillQty;
  stock.volume24h += fillQty;
  await stock.save();

  await refreshPortfolioValue(portfolio.portfolioId);
  await portfolio.save();

  broadcast('trade:update' as never, { tradeId: trade.tradeId, ticker: order.ticker, price, quantity: fillQty });
  broadcast('portfolio:update' as never, { portfolioId: portfolio.portfolioId });

  await logExchangeAction({
    userId: order.userId.toString(),
    actorId,
    action: 'trade_executed',
    resource: 'trade',
    resourceId: trade.tradeId,
    metadata: { orderId, ticker: order.ticker, side: order.side, quantity: fillQty, price },
  });

  if (total >= LARGE_TRADE_THRESHOLD) {
    await notifyExchangeUser(order.userId.toString(), 'Large Trade Executed', `${order.ticker}: ${fillQty} shares @ ₴${price}`);
  }

  return trade;
}

async function executePartialOrder(orderId: string, qty: number, price: number, actorId: string): Promise<InstanceType<typeof Trade> | null> {
  const order = await Order.findOne({ orderId, deletedAt: null });
  if (!order) return null;
  order.remainingQuantity = qty;
  order.quantity = order.filledQuantity + qty;
  await order.save();
  return executeOrder(order.orderId, price, actorId);
}

async function upsertHolding(
  portfolio: InstanceType<typeof Portfolio>,
  order: InstanceType<typeof Order>,
  qty: number,
  price: number,
  side: 'buy'
) {
  let holding = await PortfolioHolding.findOne({ portfolioId: order.portfolioId, stockId: order.stockId, deletedAt: null });
  if (!holding) {
    holding = await PortfolioHolding.create({
      holdingId: `HLD-${uuidv4().slice(0, 8).toUpperCase()}`,
      portfolioId: order.portfolioId,
      userId: order.userId,
      stockId: order.stockId,
      ticker: order.ticker,
      shares: qty,
      averageCost: price,
      currentPrice: price,
      marketValue: price * qty,
      unrealizedProfit: 0,
    });
  } else {
    const totalShares = holding.shares + qty;
    holding.averageCost = (holding.averageCost * holding.shares + price * qty) / totalShares;
    holding.shares = totalShares;
    holding.currentPrice = price;
    holding.marketValue = totalShares * price;
    holding.unrealizedProfit = (price - holding.averageCost) * totalShares;
    await holding.save();
  }
}

export async function cancelOrder(userId: string, orderId: string, actorId: string) {
  const order = await Order.findOne({ orderId, userId: new Types.ObjectId(userId), deletedAt: null });
  if (!order) throw new Error('ORDER_NOT_FOUND');
  if (!['pending', 'partial'].includes(order.status)) throw new Error('ORDER_NOT_CANCELLABLE');
  order.status = 'cancelled';
  order.cancelledAt = new Date();
  await order.save();
  broadcast('order:update' as never, { orderId, status: 'cancelled' });
  await logExchangeAction({ userId, actorId, action: 'order_cancelled', resource: 'order', resourceId: orderId });
  return order;
}

export async function processPendingOrders() {
  const pending = await Order.find({ status: { $in: ['pending', 'partial'] }, deletedAt: null }).limit(100);
  for (const order of pending) {
    const stock = await Stock.findOne({ stockId: order.stockId });
    if (!stock) continue;
    const derivation = await deriveStockPrice(order.stockId);
    const shouldExec = order.type === 'market'
      || shouldExecuteLimit(order, derivation.price)
      || (order.type === 'stop' && order.stopPrice && (
        (order.side === 'buy' && derivation.price >= order.stopPrice)
        || (order.side === 'sell' && derivation.price <= order.stopPrice)
      ));
    if (shouldExec) {
      try {
        await executeOrder(order.orderId, derivation.price, 'system');
      } catch { /* skip */ }
    }
  }
}

export async function refreshPortfolioValue(portfolioId: string) {
  const portfolio = await Portfolio.findOne({ portfolioId, deletedAt: null });
  if (!portfolio) return;
  const holdings = await PortfolioHolding.find({ portfolioId, deletedAt: null });
  let holdingsValue = 0;
  let unrealized = 0;
  for (const h of holdings) {
    const stock = await Stock.findOne({ stockId: h.stockId });
    const price = stock?.currentPrice ?? h.currentPrice;
    h.currentPrice = price;
    h.marketValue = h.shares * price;
    h.unrealizedProfit = (price - h.averageCost) * h.shares;
    holdingsValue += h.marketValue;
    unrealized += h.unrealizedProfit;
    await h.save();
  }
  portfolio.portfolioValue = portfolio.cashBalance + holdingsValue;
  portfolio.unrealizedProfit = unrealized;
  portfolio.lastUpdatedAt = new Date();
  await portfolio.save();
}
