import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import * as economyService from '../../services/economyEngineService';

function mapError(err: unknown): never {
  if (!(err instanceof Error)) throw err;
  const map: Record<string, [number, string]> = {
    PERMISSION_DENIED: [403, 'Permission denied'],
    COMPANY_NOT_FOUND: [404, 'Company not found'],
  };
  const entry = map[err.message];
  if (entry) throw new AppError(entry[0], entry[1]);
  throw err;
}

export const initialize = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await economyService.initializeEconomy(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const dashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await economyService.getDashboard(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const state = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await economyService.getState(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const reports = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await economyService.getReports(req.user!.userId, {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
      type: req.query.type as string,
    }, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const gdpHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await economyService.getGdpHistory(req.user!.userId, Number(req.query.limit) || 24, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const inflationHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await economyService.getInflationHistory(req.user!.userId, Number(req.query.limit) || 24, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const valuations = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await economyService.getValuations(req.user!.userId, {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
      period: req.query.period as string,
    }, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const companyValuation = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await economyService.getCompanyValuation(req.user!.userId, String(req.params.companyId), req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const demand = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await economyService.getDemand(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const supply = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await economyService.getSupply(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const assetValuations = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await economyService.getAssetValuations(req.user!.userId, {
      sector: req.query.sector as string,
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 50,
    }, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const analytics = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await economyService.getAnalytics(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const auditLogs = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await economyService.getAuditLogs(req.user!.userId, Number(req.query.page) || 1, Number(req.query.limit) || 50, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const bankMetrics = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await economyService.getBankMetrics(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const events = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await economyService.listEvents(req.user!.userId, req.query.active !== 'false', req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const createEvent = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    type: z.string(),
    title: z.string(),
    description: z.string().optional(),
    sector: z.string().optional(),
    impact: z.number().min(-1).max(1),
    durationHours: z.number().optional(),
  }).parse(req.body);
  try {
    const data = await economyService.createEconomicEvent(req.user!.userId, body, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const triggerTick = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await economyService.tickEconomy(req.user!.userId);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const rbac = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await economyService.getRbac(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});
