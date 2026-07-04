import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { getActorId } from '../../services/rbacService';
import { VEHICLE_ROLES, DEFAULT_VEHICLE_CATEGORIES } from '../../constants/vehicles';
import * as vehicleService from '../../services/vehicleService';

function mapError(err: unknown): never {
  if (!(err instanceof Error)) throw err;
  const map: Record<string, [number, string]> = {
    PERMISSION_DENIED: [403, 'Permission denied'],
    APP_NOT_INSTALLED: [403, 'Vehicles app not installed'],
    VEHICLE_NOT_FOUND: [404, 'Vehicle not found'],
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
    const data = await vehicleService.initializeVehicles(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const dashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await vehicleService.getDashboard(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const vehicles = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await vehicleService.listVehicles(req.user!.userId, {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
      category: req.query.category as string,
      brand: req.query.brand as string,
      model: req.query.model as string,
      minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
      maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
      maxMileage: req.query.maxMileage ? Number(req.query.maxMileage) : undefined,
      fuelType: req.query.fuelType as string,
      transmission: req.query.transmission as string,
      color: req.query.color as string,
      dealerId: req.query.dealerId as string,
      companyId: req.query.companyId as string,
      isFeatured: req.query.featured === 'true' ? true : undefined,
      isAvailable: req.query.available === 'true' ? true : undefined,
    }, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const getVehicle = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await vehicleService.getVehicle(req.user!.userId, String(req.params.id), req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const createVehicle = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    brand: z.string(), model: z.string(), year: z.number(), category: z.string(),
    manufacturer: z.string().optional(), mileage: z.number().optional(),
    listPrice: z.number().optional(), dealerPrice: z.number().optional(),
    companyId: z.string().optional(), dealerId: z.string().optional(),
    plateNumber: z.string().optional(), vin: z.string().optional(),
    color: z.string().optional(), specs: z.record(z.unknown()).optional(),
    location: z.object({ latitude: z.number(), longitude: z.number() }).optional(),
  }).parse(req.body ?? {});
  try {
    const data = await vehicleService.createVehicle(getActorId(req), body, req.user!.role, clientMeta(req));
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const updateVehicle = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await vehicleService.updateVehicle(getActorId(req), String(req.params.id), req.body ?? {}, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const listVehicle = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await vehicleService.listVehicle(getActorId(req), String(req.params.id), req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const reserveVehicle = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({ hours: z.number().optional() }).parse(req.body ?? {});
  try {
    const data = await vehicleService.reserveVehicle(getActorId(req), String(req.params.id), body.hours, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const dealers = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await vehicleService.listDealers(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const createDealer = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    companyId: z.string(), name: z.string(), tradeName: z.string(), licenseNumber: z.string(),
    address: z.string(), city: z.string(), district: z.string(), phone: z.string(), email: z.string(),
  }).parse(req.body ?? {});
  try {
    const data = await vehicleService.createDealer(getActorId(req), body, req.user!.role);
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const dealerInventory = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await vehicleService.getDealerInventory(req.user!.userId, String(req.params.id), req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const search = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await vehicleService.searchVehicles(req.user!.userId, req.body ?? {}, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const offers = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await vehicleService.listOffers(req.user!.userId, req.query.vehicleId as string, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const createOffer = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    vehicleId: z.string(), amount: z.number().positive(), message: z.string().optional(),
    tradeInVehicleId: z.string().optional(), tradeInValue: z.number().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await vehicleService.createOffer(getActorId(req), body, req.user!.role);
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const acceptOffer = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await vehicleService.acceptOffer(getActorId(req), String(req.params.id), req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const counterOffer = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({ counterAmount: z.number().positive(), message: z.string().optional() }).parse(req.body ?? {});
  try {
    const data = await vehicleService.counterOffer(getActorId(req), String(req.params.id), body.counterAmount, body.message, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const sales = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await vehicleService.listSales(req.user!.userId, req.query.dealerId as string, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const finance = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await vehicleService.listFinance(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const createFinance = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    vehicleId: z.string(), type: z.enum(['installment', 'bank_financing', 'leasing']),
    principal: z.number().positive(), downPayment: z.number().min(0),
    interestRate: z.number().min(0), termMonths: z.number().int().positive(), lender: z.string(),
  }).parse(req.body ?? {});
  try {
    const data = await vehicleService.createFinance(getActorId(req), body, req.user!.role);
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const auctions = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await vehicleService.listAuctions(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const createAuction = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    vehicleId: z.string(), startingBid: z.number().positive(),
    reservePrice: z.number().optional(), buyNowPrice: z.number().optional(), durationHours: z.number().default(72),
  }).parse(req.body ?? {});
  try {
    const data = await vehicleService.createAuction(getActorId(req), body, req.user!.role);
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const placeBid = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({ amount: z.number().positive() }).parse(req.body ?? {});
  try {
    const data = await vehicleService.placeBid(getActorId(req), String(req.params.id), body.amount, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const maintenance = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await vehicleService.createMaintenance(getActorId(req), req.body ?? {}, req.user!.role);
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const favorites = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await vehicleService.listFavorites(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const toggleFavorite = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await vehicleService.toggleFavorite(req.user!.userId, String(req.params.id), req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const analytics = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await vehicleService.getAnalytics(
      req.user!.userId, req.query.dealerId as string, req.query.companyId as string, req.user!.role
    );
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const auditLogs = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await vehicleService.getAuditLogs(req.user!.userId, req.query.vehicleId as string, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const rbac = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await vehicleService.getRbac(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const updateRbac = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    role: z.enum(VEHICLE_ROLES as unknown as [string, ...string[]]),
    permissions: z.array(z.string()),
  }).parse(req.body ?? {});
  try {
    const data = await vehicleService.updateRbac(getActorId(req), body.role as never, body.permissions, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const categories = asyncHandler(async (_req: AuthRequest, res: Response) => {
  res.json({ success: true, data: DEFAULT_VEHICLE_CATEGORIES });
});
