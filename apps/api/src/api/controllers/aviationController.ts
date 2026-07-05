import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { getActorId } from '../../services/rbacService';
import { AVIATION_ROLES, DEFAULT_AIRCRAFT_CATEGORIES } from '../../constants/aviation';
import * as aviationService from '../../services/aviationService';

function mapError(err: unknown): never {
  if (!(err instanceof Error)) throw err;
  const map: Record<string, [number, string]> = {
    PERMISSION_DENIED: [403, 'Permission denied'],
    APP_NOT_INSTALLED: [403, 'Aviation app not installed'],
    AIRCRAFT_NOT_FOUND: [404, 'Aircraft not found'],
    AIRPORT_NOT_FOUND: [404, 'Airport not found'],
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
    const data = await aviationService.initializeAviation(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const dashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await aviationService.getDashboard(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const aircraft = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await aviationService.listAircraft(req.user!.userId, {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
      category: req.query.category as string,
      brand: req.query.brand as string,
      model: req.query.model as string,
      manufacturer: req.query.manufacturer as string,
      minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
      maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
      maxFlightHours: req.query.maxFlightHours ? Number(req.query.maxFlightHours) : undefined,
      engineType: req.query.engineType as string,
      minPassengers: req.query.minPassengers ? Number(req.query.minPassengers) : undefined,
      minCargo: req.query.minCargo ? Number(req.query.minCargo) : undefined,
      dealerId: req.query.dealerId as string,
      companyId: req.query.companyId as string,
      airportId: req.query.airportId as string,
      hangarId: req.query.hangarId as string,
      isFeatured: req.query.featured === 'true' ? true : undefined,
      isAvailable: req.query.available === 'true' ? true : undefined,
    }, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const getAircraft = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await aviationService.getAircraft(req.user!.userId, String(req.params.id), req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const createAircraft = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    brand: z.string(), model: z.string(), year: z.number(), category: z.string(),
    manufacturer: z.string().optional(), flightHours: z.number().optional(),
    listPrice: z.number().optional(), dealerPrice: z.number().optional(),
    companyId: z.string().optional(), dealerId: z.string().optional(),
    registrationNumber: z.string().optional(), serialNumber: z.string().optional(),
    color: z.string().optional(), interior: z.string().optional(),
    airportId: z.string().optional(), hangarId: z.string().optional(),
    specs: z.record(z.unknown()).optional(),
    location: z.object({ latitude: z.number(), longitude: z.number() }).optional(),
  }).parse(req.body ?? {});
  try {
    const data = await aviationService.createAircraft(getActorId(req), body, req.user!.role, clientMeta(req));
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const updateAircraft = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await aviationService.updateAircraft(getActorId(req), String(req.params.id), req.body ?? {}, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const listAircraftForSale = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await aviationService.listAircraftForSale(getActorId(req), String(req.params.id), req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const reserveAircraft = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({ hours: z.number().optional() }).parse(req.body ?? {});
  try {
    const data = await aviationService.reserveAircraft(getActorId(req), String(req.params.id), body.hours, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const moveAircraft = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    airportId: z.string().optional(), hangarId: z.string().optional(),
    latitude: z.number().optional(), longitude: z.number().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await aviationService.moveAircraft(getActorId(req), String(req.params.id), body, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const toggleFavorite = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await aviationService.toggleFavorite(req.user!.userId, String(req.params.id), req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const search = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await aviationService.searchAircraft(req.user!.userId, req.body ?? {}, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const dealers = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await aviationService.listDealers(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const createDealer = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    companyId: z.string(), name: z.string(), tradeName: z.string(), licenseNumber: z.string(),
    address: z.string(), city: z.string(), district: z.string(), phone: z.string(), email: z.string(),
    homeAirportId: z.string().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await aviationService.createDealer(getActorId(req), body, req.user!.role);
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const dealerFleet = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await aviationService.getDealerFleet(req.user!.userId, String(req.params.id), req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const airports = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await aviationService.listAirports(req.user!.userId, {
      type: req.query.type as string,
      city: req.query.city as string,
      companyId: req.query.companyId as string,
    }, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const createAirport = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await aviationService.createAirport(getActorId(req), req.body ?? {}, req.user!.role);
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const getAirport = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await aviationService.getAirport(req.user!.userId, String(req.params.id), req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const createHangar = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await aviationService.createHangar(getActorId(req), req.body ?? {}, req.user!.role);
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const createRunway = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await aviationService.createRunway(getActorId(req), req.body ?? {}, req.user!.role);
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const offers = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await aviationService.listOffers(req.user!.userId, req.query.aircraftId as string, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const createOffer = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    aircraftId: z.string(), amount: z.number().positive(), message: z.string().optional(),
    tradeInAircraftId: z.string().optional(), tradeInValue: z.number().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await aviationService.createOffer(getActorId(req), body, req.user!.role);
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const acceptOffer = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await aviationService.acceptOffer(getActorId(req), String(req.params.id), req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const counterOffer = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({ counterAmount: z.number().positive(), message: z.string().optional() }).parse(req.body ?? {});
  try {
    const data = await aviationService.counterOffer(getActorId(req), String(req.params.id), body.counterAmount, body.message, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const sales = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await aviationService.listSales(req.user!.userId, req.query.dealerId as string, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const finance = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await aviationService.listFinance(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const createFinance = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    aircraftId: z.string(), type: z.enum(['installment', 'bank_financing', 'leasing']),
    principal: z.number().positive(), downPayment: z.number().min(0),
    interestRate: z.number().min(0), termMonths: z.number().int().positive(), lender: z.string(),
  }).parse(req.body ?? {});
  try {
    const data = await aviationService.createFinance(getActorId(req), body, req.user!.role);
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const leases = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await aviationService.listLeases(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const createLease = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    aircraftId: z.string(), lessorCompanyId: z.string(),
    monthlyRate: z.number().positive(), termMonths: z.number().int().positive(),
    securityDeposit: z.number().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await aviationService.createLease(getActorId(req), body, req.user!.role);
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const auctions = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await aviationService.listAuctions(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const createAuction = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    aircraftId: z.string(), startingBid: z.number().positive(),
    reservePrice: z.number().optional(), buyNowPrice: z.number().optional(), durationHours: z.number().default(72),
  }).parse(req.body ?? {});
  try {
    const data = await aviationService.createAuction(getActorId(req), body, req.user!.role);
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const placeBid = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({ amount: z.number().positive() }).parse(req.body ?? {});
  try {
    const data = await aviationService.placeBid(getActorId(req), String(req.params.id), body.amount, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const maintenance = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await aviationService.createMaintenance(getActorId(req), req.body ?? {}, req.user!.role);
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const favorites = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await aviationService.listFavorites(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const analytics = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await aviationService.getAnalytics(
      req.user!.userId, req.query.dealerId as string, req.query.companyId as string, req.user!.role
    );
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const auditLogs = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await aviationService.getAuditLogs(req.user!.userId, req.query.aircraftId as string, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const rbac = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await aviationService.getRbac(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const updateRbac = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    role: z.enum(AVIATION_ROLES as unknown as [string, ...string[]]),
    permissions: z.array(z.string()),
  }).parse(req.body ?? {});
  try {
    const data = await aviationService.updateRbac(getActorId(req), body.role as never, body.permissions, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const categories = asyncHandler(async (_req: AuthRequest, res: Response) => {
  res.json({ success: true, data: DEFAULT_AIRCRAFT_CATEGORIES });
});
