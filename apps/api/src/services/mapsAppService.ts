import { v4 as uuidv4 } from 'uuid';
import { Types } from 'mongoose';
import { MapsOfflineCache } from '../database/models/MapsOfflineCache';
import { getWorldState } from './worldEngineService';
import { getGpsState, startNavigation, stopNavigation } from './gpsEngineService';
import { searchLocations } from './mapDatabaseService';
import { SYSTEM_APP_BUNDLES, MAPS_CACHE_TTL_MS } from '../constants/systemApps';
import { logSystemAppAudit } from './systemAppsAuditService';
import { emitToUser } from './socketService';
import { DISTRICTS } from '../constants/gtaMap';

export async function getMapsState(userId: string) {
  const [world, gps] = await Promise.all([getWorldState(userId), getGpsState(userId)]);
  return { world, gps };
}

export async function searchMaps(userId: string, q: string) {
  return searchLocations({ q, limit: 20 });
}

export async function planRoute(
  userId: string,
  destination: { locationId?: string; name?: string; lat?: number; lng?: number },
  actorId: string
) {
  const gps = await startNavigation(userId, destination, actorId);
  const traffic = simulateTraffic();
  emitToUser(userId, 'maps:update', { action: 'route_planned', traffic });
  return { gps, traffic, route: generateRoutePoints(destination) };
}

export async function stopRoute(userId: string, actorId: string) {
  return stopNavigation(userId, actorId);
}

function simulateTraffic() {
  const levels = ['light', 'moderate', 'heavy', 'standstill'] as const;
  const level = levels[Math.floor(Math.random() * levels.length)];
  return {
    level,
    delayMinutes: level === 'light' ? 0 : level === 'moderate' ? 5 : level === 'heavy' ? 15 : 30,
    incidents: level !== 'light' ? [{ type: 'accident', delayMinutes: 10 }] : [],
  };
}

function generateRoutePoints(destination: { lat?: number; lng?: number }) {
  const points = [];
  for (let i = 0; i < 8; i++) {
    points.push({
      lat: (destination.lat ?? 34.05) + (Math.random() - 0.5) * 0.02,
      lng: (destination.lng ?? -118.24) + (Math.random() - 0.5) * 0.02,
    });
  }
  return points;
}

export async function getPoliceRoadBlocks(userId: string) {
  const world = await getWorldState(userId);
  const blocks = world.restrictedZone
    ? [{ id: 'rb-1', lat: world.latitude, lng: world.longitude, reason: 'Police checkpoint', active: true }]
    : [];
  return { roadBlocks: blocks, count: blocks.length };
}

export async function downloadOfflineMap(userId: string, district: string, actorId: string) {
  const cacheId = uuidv4();
  const tileCount = 256 + Math.floor(Math.random() * 512);
  const sizeBytes = tileCount * 12_000;
  const expiresAt = new Date(Date.now() + MAPS_CACHE_TTL_MS);

  await MapsOfflineCache.create({
    userId: new Types.ObjectId(userId),
    cacheId,
    district,
    tileCount,
    sizeBytes,
    expiresAt,
    createdBy: new Types.ObjectId(actorId),
  });

  const { growAppCache } = await import('./storageService');
  await growAppCache(userId, SYSTEM_APP_BUNDLES.maps, sizeBytes);

  await logSystemAppAudit({ userId, actorId, appId: SYSTEM_APP_BUNDLES.maps, action: 'offline_cache', resourceId: cacheId, metadata: { district } });
  emitToUser(userId, 'maps:update', { action: 'offline_downloaded', district, sizeBytes });
  return { cacheId, district, tileCount, sizeBytes, expiresAt: expiresAt.toISOString() };
}

export async function listOfflineMaps(userId: string) {
  const caches = await MapsOfflineCache.find({ userId, deletedAt: null, expiresAt: { $gt: new Date() } });
  return caches.map((c) => ({
    cacheId: c.cacheId,
    district: c.district,
    tileCount: c.tileCount,
    sizeBytes: c.sizeBytes,
    expiresAt: c.expiresAt.toISOString(),
  }));
}

export async function getAvailableDistricts() {
  return DISTRICTS.map((d) => ({ name: d.name, terrain: d.terrain }));
}
