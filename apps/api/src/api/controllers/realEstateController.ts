import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { getActorId } from '../../services/rbacService';
import { REAL_ESTATE_ROLES, DEFAULT_PROPERTY_TYPES, OWNERSHIP_TYPES } from '../../constants/realEstate';
import * as realEstateService from '../../services/realEstateService';

function mapError(err: unknown): never {
  if (!(err instanceof Error)) throw err;
  const map: Record<string, [number, string]> = {
    PERMISSION_DENIED: [403, 'Permission denied'],
    APP_NOT_INSTALLED: [403, 'Real Estate app not installed'],
    PROPERTY_NOT_FOUND: [404, 'Property not found'],
    OFFER_NOT_FOUND: [404, 'Offer not found'],
    LEASE_NOT_FOUND: [404, 'Lease not found'],
    INSPECTION_NOT_FOUND: [404, 'Inspection not found'],
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
    const data = await realEstateService.initializeRealEstate(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const dashboard = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await realEstateService.getDashboard(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const properties = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await realEstateService.listProperties(req.user!.userId, {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
      category: req.query.category as string,
      status: req.query.status as string,
      minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
      maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
      bedrooms: req.query.bedrooms ? Number(req.query.bedrooms) : undefined,
      bathrooms: req.query.bathrooms ? Number(req.query.bathrooms) : undefined,
      district: req.query.district as string,
      city: req.query.city as string,
      companyId: req.query.companyId as string,
      isFeatured: req.query.featured === 'true' ? true : undefined,
      isAvailable: req.query.available === 'true' ? true : undefined,
    }, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const getProperty = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await realEstateService.getProperty(req.user!.userId, String(req.params.id), req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const createProperty = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    category: z.string().min(1),
    ownershipType: z.enum(OWNERSHIP_TYPES as unknown as [string, ...string[]]).optional(),
    companyId: z.string().optional(),
    location: z.object({
      country: z.string().optional(), city: z.string(), district: z.string(), street: z.string(),
      postalCode: z.string().optional(), latitude: z.number(), longitude: z.number(),
    }),
    buildingSize: z.number().optional(), landSize: z.number().optional(),
    floors: z.number().optional(), bedrooms: z.number().optional(), bathrooms: z.number().optional(),
    listPrice: z.number().optional(), rentPriceMonthly: z.number().optional(),
    marketValue: z.number().optional(), amenities: z.record(z.unknown()).optional(),
  }).parse(req.body ?? {});
  try {
    const data = await realEstateService.createProperty(getActorId(req), body, req.user!.role, clientMeta(req));
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const updateProperty = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await realEstateService.updateProperty(getActorId(req), String(req.params.id), req.body ?? {}, req.user!.role, clientMeta(req));
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const approveProperty = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await realEstateService.approveListing(getActorId(req), String(req.params.id), req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const featureProperty = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({ featured: z.boolean() }).parse(req.body ?? {});
  try {
    const data = await realEstateService.featureListing(getActorId(req), String(req.params.id), body.featured, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const archiveProperty = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await realEstateService.archiveListing(getActorId(req), String(req.params.id), req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const uploadImage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({ url: z.string(), caption: z.string().optional(), isPrimary: z.boolean().optional() }).parse(req.body ?? {});
  try {
    const data = await realEstateService.uploadImage(getActorId(req), String(req.params.id), body, req.user!.role);
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const uploadFloorPlan = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({ url: z.string(), floor: z.number().optional(), label: z.string().optional() }).parse(req.body ?? {});
  try {
    const data = await realEstateService.uploadFloorPlan(getActorId(req), String(req.params.id), body, req.user!.role);
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const search = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await realEstateService.searchProperties(req.user!.userId, req.body ?? {}, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const offers = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await realEstateService.listOffers(req.user!.userId, req.query.propertyId as string, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const createOffer = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    propertyId: z.string(), amount: z.number().positive(), type: z.enum(['purchase', 'rental']), message: z.string().optional(),
  }).parse(req.body ?? {});
  try {
    const data = await realEstateService.createOffer(getActorId(req), body, req.user!.role);
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const counterOffer = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({ counterAmount: z.number().positive(), message: z.string().optional() }).parse(req.body ?? {});
  try {
    const data = await realEstateService.counterOffer(getActorId(req), String(req.params.id), body.counterAmount, body.message, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const acceptOffer = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await realEstateService.acceptOffer(getActorId(req), String(req.params.id), req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const sales = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await realEstateService.listSales(req.user!.userId, req.query.propertyId as string, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const rentals = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await realEstateService.listRentals(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const leases = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await realEstateService.listLeases(req.user!.userId, req.query.propertyId as string, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const createLease = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    propertyId: z.string(), tenantUserId: z.string(), monthlyRent: z.number().positive(),
    securityDeposit: z.number().min(0), startDate: z.string(), endDate: z.string(),
  }).parse(req.body ?? {});
  try {
    const data = await realEstateService.createLease(getActorId(req), {
      ...body, startDate: new Date(body.startDate), endDate: new Date(body.endDate),
    }, req.user!.role);
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const collectRent = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await realEstateService.collectRent(getActorId(req), String(req.params.id), req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const maintenance = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await realEstateService.listMaintenance(req.user!.userId, req.query.propertyId as string, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const createMaintenance = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await realEstateService.createMaintenance(getActorId(req), req.body ?? {}, req.user!.role);
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const scheduleInspection = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await realEstateService.scheduleInspection(getActorId(req), req.body ?? {}, req.user!.role);
    res.status(201).json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const completeInspection = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({ status: z.string(), findings: z.string(), score: z.number().optional() }).parse(req.body ?? {});
  try {
    const data = await realEstateService.completeInspection(getActorId(req), String(req.params.id), body, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const favorites = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await realEstateService.listFavorites(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const toggleFavorite = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await realEstateService.toggleFavorite(req.user!.userId, String(req.params.id), req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const analytics = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await realEstateService.getAnalytics(
      req.user!.userId,
      req.query.propertyId as string,
      req.query.companyId as string,
      req.user!.role
    );
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const auditLogs = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await realEstateService.getAuditLogs(req.user!.userId, req.query.propertyId as string, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const rbac = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const data = await realEstateService.getRbac(req.user!.userId, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const updateRbac = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    role: z.enum(REAL_ESTATE_ROLES as unknown as [string, ...string[]]),
    permissions: z.array(z.string()),
  }).parse(req.body ?? {});
  try {
    const data = await realEstateService.updateRbac(getActorId(req), body.role as never, body.permissions, req.user!.role);
    res.json({ success: true, data });
  } catch (e) { mapError(e); }
});

export const propertyTypes = asyncHandler(async (_req: AuthRequest, res: Response) => {
  res.json({ success: true, data: DEFAULT_PROPERTY_TYPES });
});
