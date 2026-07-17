import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { getActorId } from '../../services/rbacService';
import { MARINE_ROLES, DEFAULT_VESSEL_CATEGORIES } from '../../constants/marine';
import * as marineService from '../../services/marineService';

function mapError(err: unknown): never {
  if (!(err instanceof Error)) throw err;
  const map: Record<string, [number, string]> = {
    PERMISSION_DENIED: [403, 'Permission denied'],
    APP_NOT_INSTALLED: [403, 'Marine app not installed'],
    VESSEL_NOT_FOUND: [404, 'Vessel not found'],
    MARINA_NOT_FOUND: [404, 'Marina not found'],
    COMPANY_NOT_FOUND: [404, 'Company not found'],
    OFFER_NOT_FOUND: [404, 'Offer not found'],
    AUCTION_NOT_FOUND: [404, 'Auction not found'],
    BID_TOO_LOW: [400, 'Bid must be higher than current bid'],
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
    const data = await marineService.initializeMarine(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const dashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await marineService.getDashboard(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const vessels = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await marineService.listVessels(req.user!.userId, {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
      category: req.query.category as string,
      brand: req.query.brand as string,
      model: req.query.model as string,
      manufacturer: req.query.manufacturer as string,
      minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
      maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
      maxEngineHours: req.query.maxEngineHours ? Number(req.query.maxEngineHours) : undefined,
      engineType: req.query.engineType as string,
      minPassengers: req.query.minPassengers ? Number(req.query.minPassengers) : undefined,
      minCargo: req.query.minCargo ? Number(req.query.minCargo) : undefined,
      dealerId: req.query.dealerId as string,
      companyId: req.query.companyId as string,
      marinaId: req.query.marinaId as string,
      dockId: req.query.dockId as string,
      isFeatured: req.query.featured === 'true' ? true : undefined,
      isAvailable: req.query.available === 'true' ? true : undefined,
    }, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const getVessel = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await marineService.getVessel(req.user!.userId, String(req.params.id), req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const createVessel = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    brand: z.string(), model: z.string(), year: z.number(), category: z.string(),
    manufacturer: z.string().optional(), engineHours: z.number().optional(),
    listPrice: z.number().optional(), dealerPrice: z.number().optional(),
    companyId: z.string().optional(), dealerId: z.string().optional(),
    registrationNumber: z.string().optional(), serialNumber: z.string().optional(),
    color: z.string().optional(), interior: z.string().optional(),
    marinaId: z.string().optional(), dockId: z.string().optional(),
    specs: z.record(z.unknown()).optional(),
    location: z.object({ latitude: z.number(), longitude: z.number() }).optional(),
  }).parse(req.body ?? {});
  try {
    const data = await marineService.createVessel(getActorId(req), body, req.user!.role, clientMeta(req));
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const updateVessel = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await marineService.updateVessel(getActorId(req), String(req.params.id), req.body ?? {}, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const listVesselForSale = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await marineService.listVesselForSale(getActorId(req), String(req.params.id), req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const reserveVessel = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({ hours: z.number().optional() }).parse(req.body ?? {});
  try {
    const data = await marineService.reserveVessel(getActorId(req), String(req.params.id), body.hours, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const moveVessel = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    marinaId: z.string().optional(), dockId: z.string().optional(),
    latitude: z.number().optional(), longitude: z.number().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await marineService.moveVessel(getActorId(req), String(req.params.id), body, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const toggleFavorite = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await marineService.toggleFavorite(req.user!.userId, String(req.params.id), req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const search = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await marineService.searchVessels(req.user!.userId, req.body ?? {}, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const dealers = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await marineService.listDealers(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const createDealer = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    companyId: z.string(), name: z.string(), tradeName: z.string(), licenseNumber: z.string(),
    address: z.string(), city: z.string(), district: z.string(), phone: z.string(), email: z.string(),
    homeMarinaId: z.string().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await marineService.createDealer(getActorId(req), body, req.user!.role);
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const dealerFleet = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await marineService.getDealerFleet(req.user!.userId, String(req.params.id), req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const marinas = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await marineService.listMarinas(req.user!.userId, {
      type: req.query.type as string,
      city: req.query.city as string,
      companyId: req.query.companyId as string,
    }, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const createMarina = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await marineService.createMarina(getActorId(req), req.body ?? {}, req.user!.role);
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const getMarina = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await marineService.getMarina(req.user!.userId, String(req.params.id), req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const createDock = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await marineService.createDock(getActorId(req), req.body ?? {}, req.user!.role);
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const createPort = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await marineService.createPort(getActorId(req), req.body ?? {}, req.user!.role);
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const offers = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await marineService.listOffers(req.user!.userId, req.query.vesselId as string, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const createOffer = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    vesselId: z.string(), amount: z.number().positive(), message: z.string().optional(),
    tradeInVesselId: z.string().optional(), tradeInValue: z.number().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await marineService.createOffer(getActorId(req), body, req.user!.role);
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const acceptOffer = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await marineService.acceptOffer(getActorId(req), String(req.params.id), req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const counterOffer = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({ counterAmount: z.number().positive(), message: z.string().optional() }).parse(req.body ?? {});
  try {
    const data = await marineService.counterOffer(getActorId(req), String(req.params.id), body.counterAmount, body.message, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const sales = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await marineService.listSales(req.user!.userId, req.query.dealerId as string, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const finance = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await marineService.listFinance(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const createFinance = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    vesselId: z.string(), type: z.enum(['installment', 'bank_financing', 'leasing']),
    principal: z.number().positive(), downPayment: z.number().min(0),
    interestRate: z.number().min(0), termMonths: z.number().int().positive(), lender: z.string(),
  }).parse(req.body ?? {});
  try {
    const data = await marineService.createFinance(getActorId(req), body, req.user!.role);
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const leases = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await marineService.listLeases(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const createLease = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    vesselId: z.string(), lessorCompanyId: z.string(),
    monthlyRate: z.number().positive(), termMonths: z.number().int().positive(),
    securityDeposit: z.number().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await marineService.createLease(getActorId(req), body, req.user!.role);
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const auctions = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await marineService.listAuctions(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const createAuction = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    vesselId: z.string(), startingBid: z.number().positive(),
    reservePrice: z.number().optional(), buyNowPrice: z.number().optional(), durationHours: z.number().default(72),
  }).parse(req.body ?? {});
  try {
    const data = await marineService.createAuction(getActorId(req), body, req.user!.role);
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const placeBid = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({ amount: z.number().positive() }).parse(req.body ?? {});
  try {
    const data = await marineService.placeBid(getActorId(req), String(req.params.id), body.amount, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const maintenance = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await marineService.createMaintenance(getActorId(req), req.body ?? {}, req.user!.role);
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const favorites = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await marineService.listFavorites(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const analytics = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await marineService.getAnalytics(
      req.user!.userId, req.query.dealerId as string, req.query.companyId as string, req.user!.role
    );
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const auditLogs = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await marineService.getAuditLogs(req.user!.userId, req.query.vesselId as string, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const rbac = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await marineService.getRbac(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const updateRbac = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    role: z.enum(MARINE_ROLES as unknown as [string, ...string[]]),
    permissions: z.array(z.string()),
  }).parse(req.body ?? {});
  try {
    const data = await marineService.updateRbac(getActorId(req), body.role as never, body.permissions, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const categories = asyncHandler(async (_req: AuthRequest, res: Response) => {
  res.json({ success: true, data: DEFAULT_VESSEL_CATEGORIES });
});
