import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { getActorId } from '../../services/rbacService';
import { checkPermission } from '../../services/permissionBrokerService';
import {
  getWorldState,
  tickWorld,
  initializeWorld,
  getCarrierState,
} from '../../services/worldEngineService';
import { searchLocations, getLocationById } from '../../services/mapDatabaseService';
import { getTowersNearby, getTowerByUuid } from '../../services/cellTowerService';
import {
  getGpsState,
  startNavigation,
  stopNavigation,
  savePlace,
  addFavorite,
  searchGpsPlaces,
  getLocationHistory,
} from '../../services/gpsEngineService';
import {
  getVpnState,
  connectVpn,
  disconnectVpn,
  getVpnHistory,
} from '../../services/vpnService';
import { getNetwork } from '../../services/networkService';
import { getLocation } from '../../services/locationService';
import {
  createTrackingRequest,
  getTrackingHistory,
} from '../../services/policeTrackingService';
import { VPN_COUNTRIES } from '../../constants/gtaMap';
import { WorldState } from '../../database/models/WorldState';

function param(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

const appIdSchema = z.object({ appId: z.string().default('com.gulfos.system') });

// ─── World State ────────────────────────────────────────────────────────────

export const getWorldHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await getWorldState(req.user!.userId);
  res.json({ success: true, data });
});

export const tickWorldHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await tickWorld(req.user!.userId);
  res.json({ success: true, data });
});

export const initializeWorldHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await initializeWorld(req.user!.userId);
  res.json({ success: true, data });
});

// ─── Map Database ───────────────────────────────────────────────────────────

export const searchLocationsHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { q, district, category, lat, lng, radiusM, limit } = req.query;
  const data = await searchLocations({
    q: q as string | undefined,
    district: district as string | undefined,
    category: category as string | undefined,
    lat: lat ? parseFloat(lat as string) : undefined,
    lng: lng ? parseFloat(lng as string) : undefined,
    radiusM: radiusM ? parseInt(radiusM as string, 10) : undefined,
    limit: limit ? parseInt(limit as string, 10) : undefined,
  });
  res.json({ success: true, data });
});

export const getLocationDetailHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await getLocationById(param(req.params.id));
  if (!data) throw new AppError(404, 'Location not found');
  res.json({ success: true, data });
});

// ─── Cell Towers ────────────────────────────────────────────────────────────

export const getNearbyTowersHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const world = await WorldState.findOne({ userId: req.user!.userId, deletedAt: null });
  const lat = req.query.lat ? parseFloat(req.query.lat as string) : world?.latitude ?? 34.0522;
  const lng = req.query.lng ? parseFloat(req.query.lng as string) : world?.longitude ?? -118.2437;
  const radiusM = req.query.radiusM ? parseInt(req.query.radiusM as string, 10) : 5000;
  const data = await getTowersNearby(lat, lng, radiusM);
  res.json({ success: true, data });
});

export const getTowerHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await getTowerByUuid(param(req.params.uuid));
  if (!data) throw new AppError(404, 'Tower not found');
  res.json({ success: true, data });
});

// ─── GPS ────────────────────────────────────────────────────────────────────

export const getGpsHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { appId } = appIdSchema.parse(req.query);
  const allowed = await checkPermission(req.user!.userId, appId, 'location');
  if (!allowed) throw new AppError(403, 'Location permission denied');
  const [gps, location] = await Promise.all([
    getGpsState(req.user!.userId),
    getLocation(req.user!.userId, appId),
  ]);
  res.json({ success: true, data: { ...gps, currentPosition: location } });
});

export const startNavigationHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    locationId: z.string().optional(),
    name: z.string().optional(),
    lat: z.number().optional(),
    lng: z.number().optional(),
  }).parse(req.body);
  try {
    const data = await startNavigation(req.user!.userId, body, getActorId(req));
    res.json({ success: true, data });
  } catch (err) {
    if (err instanceof Error && err.message === 'DESTINATION_NOT_FOUND') {
      throw new AppError(404, 'Destination not found');
    }
    throw err;
  }
});

export const stopNavigationHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await stopNavigation(req.user!.userId, getActorId(req));
  res.json({ success: true, data });
});

export const savePlaceHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    locationId: z.string(),
    name: z.string(),
    lat: z.number(),
    lng: z.number(),
  }).parse(req.body);
  const data = await savePlace(req.user!.userId, body, getActorId(req));
  res.json({ success: true, data });
});

export const addFavoriteHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = z.object({
    locationId: z.string(),
    name: z.string(),
    lat: z.number(),
    lng: z.number(),
  }).parse(req.body);
  const data = await addFavorite(req.user!.userId, body, getActorId(req));
  res.json({ success: true, data });
});

export const searchGpsHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const q = (req.query.q as string) ?? '';
  const data = await searchGpsPlaces(req.user!.userId, q);
  res.json({ success: true, data });
});

export const getGpsHistoryHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
  const data = await getLocationHistory(req.user!.userId, limit);
  res.json({ success: true, data });
});

// ─── Carrier & Network ──────────────────────────────────────────────────────

export const getCarrierHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await getCarrierState(req.user!.userId);
  res.json({ success: true, data });
});

export const getWorldNetworkHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await getNetwork(req.user!.userId);
  res.json({ success: true, data });
});

// ─── VPN ────────────────────────────────────────────────────────────────────

export const getVpnHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await getVpnState(req.user!.userId);
  res.json({ success: true, data });
});

export const getVpnCountriesHandler = asyncHandler(async (_req: AuthRequest, res: Response) => {
  res.json({ success: true, data: VPN_COUNTRIES });
});

export const connectVpnHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { countryCode } = z.object({ countryCode: z.string().length(2) }).parse(req.body);
  try {
    const data = await connectVpn(req.user!.userId, countryCode, getActorId(req));
    res.json({ success: true, data });
  } catch (err) {
    if (err instanceof Error && err.message === 'INVALID_COUNTRY') {
      throw new AppError(400, 'Invalid VPN country');
    }
    throw err;
  }
});

export const disconnectVpnHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await disconnectVpn(req.user!.userId, getActorId(req));
  res.json({ success: true, data });
});

export const getVpnHistoryHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
  const data = await getVpnHistory(req.user!.userId, limit);
  res.json({ success: true, data });
});

// ─── Police Tracking ────────────────────────────────────────────────────────

const trackingRequestSchema = z.object({
  requestType: z.enum([
    'phone_number',
    'current_tower',
    'last_tower',
    'last_location',
    'movement_history',
    'signal_history',
    'network_state',
    'online_status',
  ]),
  targetPhoneNumber: z.string().optional(),
  targetUserId: z.string().optional(),
  reason: z.string().min(5),
  warrantId: z.string().optional(),
  appId: z.string().default('com.gulfos.police'),
});

export const policeTrackHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const body = trackingRequestSchema.parse(req.body);
  try {
    const data = await createTrackingRequest(
      req.user!.userId,
      body.appId,
      {
        requestType: body.requestType,
        targetPhoneNumber: body.targetPhoneNumber,
        targetUserId: body.targetUserId,
        reason: body.reason,
        warrantId: body.warrantId,
      },
      req.user!.role
    );
    res.json({ success: true, data });
  } catch (err) {
    if (err instanceof Error && err.message === 'PERMISSION_DENIED') {
      throw new AppError(403, 'Police tracking permission denied');
    }
    if (err instanceof Error && err.message === 'TARGET_NOT_FOUND') {
      throw new AppError(404, 'Target not found');
    }
    if (err instanceof Error && err.message === 'TARGET_REQUIRED') {
      throw new AppError(400, 'Target phone number or user ID required');
    }
    throw err;
  }
});

export const policeTrackingHistoryHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const appId = (req.query.appId as string) ?? 'com.gulfos.police';
  try {
    const data = await getTrackingHistory(req.user!.userId, appId, req.user!.role);
    res.json({ success: true, data });
  } catch (err) {
    if (err instanceof Error && err.message === 'PERMISSION_DENIED') {
      throw new AppError(403, 'Police tracking permission denied');
    }
    throw err;
  }
});
