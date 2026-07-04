import { Types } from 'mongoose';
import { GpsState } from '../database/models/GpsState';
import { WorldState } from '../database/models/WorldState';
import { haversineMeters, bearingDegrees } from '../constants/gtaMap';
import { getLocationById, searchLocations } from './mapDatabaseService';
import { emitToUser } from './socketService';
import { logAudit } from './auditService';

function formatGps(state: InstanceType<typeof GpsState>) {
  return {
    navigating: state.navigating,
    destination: state.destinationName
      ? {
          locationId: state.destinationLocationId,
          name: state.destinationName,
          latitude: state.destinationLat,
          longitude: state.destinationLng,
        }
      : null,
    distanceRemainingM: state.distanceRemainingM,
    etaSeconds: state.etaSeconds,
    savedPlaces: state.savedPlaces,
    recentPlaces: state.recentPlaces.slice(0, 10),
    favoritePlaces: state.favoritePlaces,
    sharingEnabled: state.sharingEnabled,
  };
}

export async function ensureGpsState(userId: string) {
  let state = await GpsState.findOne({ userId, deletedAt: null });
  if (!state) {
    state = await GpsState.create({ userId: new Types.ObjectId(userId) });
  }
  return state;
}

export async function getGpsState(userId: string) {
  const state = await ensureGpsState(userId);
  return formatGps(state);
}

export async function startNavigation(
  userId: string,
  destination: { locationId?: string; name?: string; lat?: number; lng?: number },
  actorId: string
) {
  const state = await ensureGpsState(userId);
  let destLat = destination.lat;
  let destLng = destination.lng;
  let destName = destination.name;
  let destId = destination.locationId;

  if (destination.locationId) {
    const loc = await getLocationById(destination.locationId);
    if (loc) {
      destLat = loc.latitude;
      destLng = loc.longitude;
      destName = loc.name;
      destId = loc.locationId;
    }
  }

  if (destLat === undefined || destLng === undefined) {
    throw new Error('DESTINATION_NOT_FOUND');
  }

  state.destinationLocationId = destId;
  state.destinationName = destName ?? 'Destination';
  state.destinationLat = destLat;
  state.destinationLng = destLng;
  state.navigating = true;
  state.updatedBy = new Types.ObjectId(actorId);
  await state.save();

  await logAudit({ userId, actorId, action: 'navigate_start', resource: 'gps', resourceId: destId });

  const update = formatGps(state);
  emitToUser(userId, 'gps:update', update);
  return update;
}

export async function stopNavigation(userId: string, actorId: string) {
  const state = await ensureGpsState(userId);
  state.navigating = false;
  state.destinationLocationId = undefined;
  state.destinationName = undefined;
  state.distanceRemainingM = 0;
  state.etaSeconds = 0;
  await state.save();
  await logAudit({ userId, actorId, action: 'navigate_stop', resource: 'gps' });
  const update = formatGps(state);
  emitToUser(userId, 'gps:update', update);
  return update;
}

export async function tickGpsNavigation(
  userId: string,
  lat: number,
  lng: number,
  speed: number
): Promise<{ gps: ReturnType<typeof formatGps>; heading?: number; arrived?: boolean } | null> {
  const state = await GpsState.findOne({ userId, deletedAt: null });
  if (!state?.navigating || state.destinationLat === undefined || state.destinationLng === undefined) {
    return null;
  }

  const distance = haversineMeters(lat, lng, state.destinationLat, state.destinationLng);
  state.distanceRemainingM = Math.round(distance);
  state.etaSeconds = speed > 0.5 ? Math.round(distance / speed) : Math.round(distance / 1.4);

  let heading: number | undefined;
  let arrived = false;

  if (distance < 30) {
    const recent = {
      locationId: state.destinationLocationId ?? 'unknown',
      name: state.destinationName ?? 'Destination',
      lat: state.destinationLat,
      lng: state.destinationLng,
      visitedAt: new Date(),
    };
    state.recentPlaces = [recent, ...state.recentPlaces].slice(0, 20);
    state.navigating = false;
    state.distanceRemainingM = 0;
    state.etaSeconds = 0;
    arrived = true;
  } else {
    heading = bearingDegrees(lat, lng, state.destinationLat, state.destinationLng);
    await WorldState.findOneAndUpdate({ userId }, { heading });
  }

  await state.save();
  const gps = formatGps(state);
  if (arrived) {
    emitToUser(userId, 'gps:update', { ...gps, arrived: true });
  }
  return { gps, heading, arrived };
}

export async function savePlace(
  userId: string,
  place: { locationId: string; name: string; lat: number; lng: number },
  actorId: string
) {
  const state = await ensureGpsState(userId);
  if (!state.savedPlaces.find((p) => p.locationId === place.locationId)) {
    state.savedPlaces.push(place);
  }
  await state.save();
  await logAudit({ userId, actorId, action: 'save_place', resource: 'gps', resourceId: place.locationId });
  return formatGps(state);
}

export async function addFavorite(
  userId: string,
  place: { locationId: string; name: string; lat: number; lng: number },
  actorId: string
) {
  const state = await ensureGpsState(userId);
  if (!state.favoritePlaces.find((p) => p.locationId === place.locationId)) {
    state.favoritePlaces.push(place);
  }
  await state.save();
  return formatGps(state);
}

export async function searchGpsPlaces(userId: string, q: string) {
  return searchLocations({ q, limit: 20 });
}

export async function getLocationHistory(userId: string, limit = 50) {
  const { LocationHistory } = await import('../database/models/LocationHistory');
  const history = await LocationHistory.find({ userId })
    .sort({ recordedAt: -1 })
    .limit(limit);
  return history.map((h) => ({
    latitude: h.latitude,
    longitude: h.longitude,
    district: h.district,
    street: h.street,
    speed: h.speed,
    vehicleState: h.vehicleState,
    recordedAt: h.recordedAt.toISOString(),
  }));
}
