import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import * as exchangeService from '../../services/exchangeService';

function mapError(err: unknown): never {
  if (!(err instanceof Error)) throw err;
  const map: Record<string, [number, string]> = {
    PERMISSION_DENIED: [403, 'Permission denied'],
    APP_NOT_INSTALLED: [403, 'Exchange app not installed'],
    STOCK_NOT_FOUND: [404, 'Stock not found'],
    PORTFOLIO_NOT_FOUND: [404, 'Portfolio not found'],
    ORDER_NOT_FOUND: [404, 'Order not found'],
    ORDER_NOT_CANCELLABLE: [400, 'Order cannot be cancelled'],
    INSUFFICIENT_FUNDS: [400, 'Insufficient funds'],
    INSUFFICIENT_SHARES: [400, 'Insufficient shares'],
    COMPANY_NOT_FOUND: [404, 'Company not found'],
    IPO_NOT_FOUND: [404, 'IPO not found'],
    NO_ECONOMY_VALUATION: [503, 'Economy valuation not available'],
  };
  const entry = map[err.message];
  if (entry) throw new AppError(entry[0], entry[1]);
  throw err;
}

function clientMeta(req: AuthRequest) {
  return { ipAddress: req.ip, deviceUuid: req.headers['x-device-uuid'] as string | undefined };
}

export const initialize = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await exchangeService.initializeExchange(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const dashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await exchangeService.getDashboard(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const stocks = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await exchangeService.listStocks(req.user!.userId, {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
      sector: req.query.sector as string,
      query: req.query.query as string,
      minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
      maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
      sort: req.query.sort as string,
    }, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const getStock = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await exchangeService.getStock(req.user!.userId, String(req.params.id), req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const portfolio = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await exchangeService.getPortfolio(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const createOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    stockId: z.string(),
    type: z.enum(['market', 'limit', 'stop', 'stop_limit']),
    side: z.enum(['buy', 'sell']),
    quantity: z.number().min(1),
    limitPrice: z.number().optional(),
    stopPrice: z.number().optional(),
  }).parse(req.body);
  try {
    const data = await exchangeService.createOrder(req.user!.userId, body, req.user!.role, clientMeta(req));
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const cancelOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await exchangeService.cancelUserOrder(req.user!.userId, String(req.params.id), req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const orders = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await exchangeService.listOrders(req.user!.userId, {
      status: req.query.status as string,
      page: Number(req.query.page) || 1,
    }, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const trades = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await exchangeService.listTrades(req.user!.userId, { page: Number(req.query.page) || 1 }, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const indexes = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await exchangeService.listIndexes(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const news = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await exchangeService.listNews(req.user!.userId, {
      category: req.query.category as string,
      page: Number(req.query.page) || 1,
    }, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const watchlist = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await exchangeService.getWatchlist(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const updateWatchlist = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({ tickers: z.array(z.string()) }).parse(req.body);
  try {
    const data = await exchangeService.updateWatchlist(req.user!.userId, body.tickers, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const applyIpo = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    companyId: z.string(), ticker: z.string(), proposedName: z.string(),
    sector: z.string(), companyType: z.string(), sharesOffered: z.number().optional(),
  }).parse(req.body);
  try {
    const data = await exchangeService.applyIPO(req.user!.userId, body, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const reviewIpo = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({ approved: z.boolean(), notes: z.string() }).parse(req.body);
  try {
    const data = await exchangeService.reviewIPO(req.user!.userId, String(req.params.id), body.approved, body.notes, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const ipos = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await exchangeService.listIPOs(req.user!.userId, req.query.status as string, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const analytics = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await exchangeService.getAnalytics(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const search = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await exchangeService.search(req.user!.userId, String(req.query.q ?? ''), req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const audit = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await exchangeService.getAuditLogs(req.user!.userId, Number(req.query.page) || 1, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const distributeDividend = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    stockId: z.string(), amountPerShare: z.number().positive(),
    type: z.enum(['quarterly', 'special', 'annual']),
    recordDate: z.string(), paymentDate: z.string(),
  }).parse(req.body);
  try {
    const data = await exchangeService.distributeDividend(req.user!.userId, body, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const tick = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await exchangeService.tickExchange();
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});
