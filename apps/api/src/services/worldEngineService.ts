import { Types } from 'mongoose';
import { WorldState } from '../database/models/WorldState';
import { LocationHistory } from '../database/models/LocationHistory';
import { Carrier } from '../database/models/Carrier';
import { SignalHistory } from '../database/models/SignalHistory';
import { NetworkSession } from '../database/models/NetworkSession';
import { NetworkState } from '../database/models/NetworkState';
import {
  findDistrict,
  isInSafeZone,
  isInRestrictedZone,
  bearingDegrees,
  haversineMeters,
  WEATHER_TYPES,
  MAP_BOUNDS,
  DEFAULT_CARRIER,
} from '../constants/gtaMap';
import { resolveNearestLocation, resolveStreetAt, seedMapDatabase } from './mapDatabaseService';
import { seedCellTowers, handoffTower } from './cellTowerService';
import { calculateNetworkMetrics, determineGeneration } from './networkEngineService';
import { getActiveVpnSession } from './vpnService';
import { tickGpsNavigation } from './gpsEngineService';
import { emitToUser } from './socketService';
import { publishEvent } from './eventBusService';
import { DeviceLocation } from '../database/models/DeviceLocation';

function getGameTime(): { timeOfDay: string; gameHour: number } {
  const hour = new Date().getHours();
  const timeOfDay = hour >= 6 && hour < 18 ? 'day' : hour >= 18 && hour < 21 ? 'dusk' : 'night';
  return { timeOfDay, gameHour: hour };
}

function formatWorldState(state: InstanceType<typeof WorldState>) {
  return {
    latitude: state.latitude,
    longitude: state.longitude,
    heading: state.heading,
    speed: state.speed,
    altitude: state.altitude,
    district: state.district,
    street: state.street,
    zone: state.zone,
    region: state.region,
    vehicleState: state.vehicleState,
    weather: state.weather,
    timeOfDay: state.timeOfDay,
    gameHour: state.gameHour,
    interior: state.interior,
    safeZone: state.safeZone,
    restrictedZone: state.restrictedZone,
    nearestLocationId: state.nearestLocationId,
    connectedTowerUuid: state.connectedTowerUuid,
    lastTickAt: state.lastTickAt.toISOString(),
  };
}

export async function ensureWorldState(userId: string) {
  await seedMapDatabase();
  await seedCellTowers();

  let state = await WorldState.findOne({ userId, deletedAt: null });
  if (!state) {
    state = await WorldState.create({
      userId: new Types.ObjectId(userId),
      latitude: MAP_BOUNDS.centerLat,
      longitude: MAP_BOUNDS.centerLng,
      district: 'Downtown Los Santos',
      street: 'San Andreas Avenue',
      zone: 'Central Los Santos',
    });
  }
  return state;
}

export async function getWorldState(userId: string) {
  const state = await ensureWorldState(userId);
  return formatWorldState(state);
}

/**
 * Set the player's current position manually (tap on the GTA map).
 * Recomputes district, street and zone flags from the new coordinates.
 */
export async function setWorldPosition(userId: string, latitude: number, longitude: number) {
  const state = await ensureWorldState(userId);
  state.latitude = Math.max(MAP_BOUNDS.minLat, Math.min(MAP_BOUNDS.maxLat, latitude));
  state.longitude = Math.max(MAP_BOUNDS.minLng, Math.min(MAP_BOUNDS.maxLng, longitude));
  state.speed = 0;
  state.vehicleState = 'on_foot';

  const district = findDistrict(state.latitude, state.longitude);
  state.district = district.name;
  state.zone = district.zone;
  state.street = await resolveStreetAt(state.latitude, state.longitude);
  state.safeZone = isInSafeZone(state.latitude, state.longitude);
  state.restrictedZone = isInRestrictedZone(state.latitude, state.longitude);

  const nearest = await resolveNearestLocation(state.latitude, state.longitude);
  state.nearestLocationId = nearest?.locationId;

  await state.save();
  emitToUser(userId, 'world:update', formatWorldState(state));
  return formatWorldState(state);
}

export async function tickWorld(userId: string) {
  const state = await ensureWorldState(userId);
  const loc = await DeviceLocation.findOne({ userId });
  if (loc && !loc.enabled) return { world: formatWorldState(state), skipped: true };

  const speed = state.speed;
  const headingRad = (state.heading * Math.PI) / 180;
  const metersPerTick = speed * 3;
  const dLat = (metersPerTick * Math.cos(headingRad)) / 111320;
  const dLng = (metersPerTick * Math.sin(headingRad)) / (111320 * Math.cos((state.latitude * Math.PI) / 180));

  if (speed > 0.5) {
    state.latitude = Math.max(MAP_BOUNDS.minLat, Math.min(MAP_BOUNDS.maxLat, state.latitude + dLat));
    state.longitude = Math.max(MAP_BOUNDS.minLng, Math.min(MAP_BOUNDS.maxLng, state.longitude + dLng));
  }

  if (Math.random() < 0.05) {
    state.speed = Math.max(0, state.speed + (Math.random() - 0.4) * 3);
    if (state.speed > 25) state.vehicleState = 'in_vehicle';
    else if (state.speed > 8) state.vehicleState = 'on_motorcycle';
    else state.vehicleState = 'on_foot';
  }

  const district = findDistrict(state.latitude, state.longitude);
  state.district = district.name;
  state.zone = district.zone;
  state.street = await resolveStreetAt(state.latitude, state.longitude);
  state.safeZone = isInSafeZone(state.latitude, state.longitude);
  state.restrictedZone = isInRestrictedZone(state.latitude, state.longitude);
  state.interior = Math.random() < 0.02;
  state.altitude = state.interior ? 5 : 12 + Math.random() * 8;

  const nearest = await resolveNearestLocation(state.latitude, state.longitude);
  state.nearestLocationId = nearest?.locationId;

  const { timeOfDay, gameHour } = getGameTime();
  state.timeOfDay = timeOfDay;
  state.gameHour = gameHour;
  if (Math.random() < 0.01) {
    state.weather = WEATHER_TYPES[Math.floor(Math.random() * WEATHER_TYPES.length)];
  }

  const { tower, handoff } = await handoffTower(userId, state.latitude, state.longitude, state.connectedTowerUuid);
  state.connectedTowerUuid = tower.towerUuid;

  const vpn = await getActiveVpnSession(userId);
  const congestion = tower.currentUsers / tower.maxUsers;
  const metrics = calculateNetworkMetrics({
    distanceToTowerM: haversineMeters(state.latitude, state.longitude, tower.latitude, tower.longitude),
    coverageRadiusM: tower.coverageRadiusM,
    towerSignalPower: tower.signalPower,
    towerHealth: tower.towerHealth,
    generation: determineGeneration(
      5,
      haversineMeters(state.latitude, state.longitude, tower.latitude, tower.longitude),
      tower.coverageRadiusM
    ),
    speed: state.speed,
    interior: state.interior,
    terrain: district.terrain,
    weather: state.weather,
    vpnActive: !!vpn,
    vpnLatencyPenalty: vpn?.latencyPenaltyMs ?? 0,
    vpnBandwidthPenalty: vpn?.bandwidthPenaltyMbps ?? 0,
    towerCongestion: congestion,
  });

  const generation = determineGeneration(
    metrics.signalBars,
    haversineMeters(state.latitude, state.longitude, tower.latitude, tower.longitude),
    tower.coverageRadiusM
  );

  await Carrier.findOneAndUpdate(
    { userId },
    {
      userId: new Types.ObjectId(userId),
      name: DEFAULT_CARRIER,
      generation,
      connectedTowerUuid: tower.towerUuid,
    },
    { upsert: true }
  );

  const net = await NetworkState.findOneAndUpdate(
    { userId },
    {
      carrier: DEFAULT_CARRIER,
      signalStrength: metrics.signalBars,
      coverage: generation.toUpperCase(),
      latencyMs: metrics.latencyMs,
      bandwidthMbps: metrics.bandwidthMbps,
      packetLoss: metrics.packetLoss,
      jitterMs: metrics.jitterMs,
      internetConnected: generation !== 'none',
      connectionState: generation === 'none' ? 'disconnected' : metrics.signalBars <= 1 ? 'limited' : 'connected',
      cellTowers: [{ id: tower.towerUuid, strength: metrics.signalBars, band: tower.frequencyBand }],
      vpnEnabled: !!vpn,
      vpnName: vpn?.countryName,
    },
    { upsert: true, new: true }
  );

  state.lastTickAt = new Date();
  await state.save();

  await LocationHistory.create({
    userId: new Types.ObjectId(userId),
    latitude: state.latitude,
    longitude: state.longitude,
    heading: state.heading,
    speed: state.speed,
    altitude: state.altitude,
    district: state.district,
    street: state.street,
    zone: state.zone,
    vehicleState: state.vehicleState,
    interior: state.interior,
    recordedAt: new Date(),
  });

  await SignalHistory.create({
    userId: new Types.ObjectId(userId),
    towerUuid: tower.towerUuid,
    signalBars: metrics.signalBars,
    signalDbm: metrics.signalDbm,
    generation,
    latencyMs: metrics.latencyMs,
    bandwidthMbps: metrics.bandwidthMbps,
    packetLoss: metrics.packetLoss,
    jitterMs: metrics.jitterMs,
    congestion: metrics.congestion,
    latitude: state.latitude,
    longitude: state.longitude,
    recordedAt: new Date(),
  });

  if (loc) {
    loc.latitude = state.latitude;
    loc.longitude = state.longitude;
    loc.heading = state.heading;
    loc.speed = state.speed;
    loc.altitude = state.altitude;
    loc.district = state.district;
    loc.street = state.street;
    loc.zone = state.zone;
    loc.region = state.region;
    loc.gpsTimestamp = new Date();
    loc.movementState = state.speed < 0.5 ? 'stationary' : state.speed < 5 ? 'walking' : 'driving';
    await loc.save();
  }

  const gpsResult = await tickGpsNavigation(userId, state.latitude, state.longitude, state.speed);
  if (gpsResult?.heading !== undefined) {
    state.heading = gpsResult.heading;
    await state.save();
  }
  const gpsUpdate = gpsResult?.gps ?? null;

  const worldData = formatWorldState(state);
  const towerData = { ...tower, handoff };
  const signalData = { ...metrics, generation, carrier: DEFAULT_CARRIER };
  const carrierData = { name: DEFAULT_CARRIER, generation, towerUuid: tower.towerUuid };
  const networkData = {
    carrier: DEFAULT_CARRIER,
    signalStrength: metrics.signalBars,
    signalBars: metrics.signalBars,
    signalDbm: metrics.signalDbm,
    generation,
    connectionType: metrics.connectionType,
    latencyMs: metrics.latencyMs,
    pingMs: metrics.pingMs,
    bandwidthMbps: metrics.bandwidthMbps,
    packetLoss: metrics.packetLoss,
    jitterMs: metrics.jitterMs,
    congestion: metrics.congestion,
    penalties: metrics.penalties,
    cellTowers: [{ id: tower.towerUuid, strength: metrics.signalBars, band: tower.frequencyBand }],
    internetConnected: net?.internetConnected ?? false,
    connectionState: net?.connectionState ?? 'connected',
    vpnEnabled: !!vpn,
    vpnName: vpn?.countryName,
    wifiEnabled: net?.wifiEnabled ?? true,
    bluetoothEnabled: net?.bluetoothEnabled ?? false,
  };

  emitToUser(userId, 'world:update', worldData);
  emitToUser(userId, 'tower:update', towerData);
  emitToUser(userId, 'signal:update', signalData);
  emitToUser(userId, 'network:update', networkData);
  emitToUser(userId, 'carrier:update', carrierData);
  emitToUser(userId, 'location:update', {
    latitude: state.latitude,
    longitude: state.longitude,
    heading: state.heading,
    speed: state.speed,
    altitude: state.altitude,
    accuracy: 5,
    district: state.district,
    street: state.street,
    zone: state.zone,
    region: state.region,
    gpsTimestamp: state.lastTickAt.toISOString(),
    movementState: loc?.movementState ?? 'stationary',
    enabled: loc?.enabled ?? true,
  });
  if (gpsUpdate) emitToUser(userId, 'gps:update', gpsUpdate);

  await publishEvent({
    userId,
    namespace: 'world.engine',
    event: 'world:tick',
    payload: { world: worldData, signal: signalData },
    source: 'worldEngine',
  });

  return { world: worldData, tower: towerData, signal: signalData, network: networkData, gps: gpsUpdate };
}

export async function tickAllWorlds(): Promise<number> {
  const states = await WorldState.find({ deletedAt: null });
  for (const s of states) {
    await tickWorld(s.userId.toString());
  }
  return states.length;
}

export async function getCarrierState(userId: string) {
  const carrier = await Carrier.findOne({ userId, deletedAt: null });
  if (!carrier) {
    return { name: DEFAULT_CARRIER, generation: '4g' as const, connectedTowerUuid: null };
  }
  return {
    name: carrier.name,
    generation: carrier.generation,
    connectedTowerUuid: carrier.connectedTowerUuid ?? null,
  };
}
export async function initializeWorld(userId: string) {
  await ensureWorldState(userId);
  await seedMapDatabase();
  await seedCellTowers();
  return tickWorld(userId);
}
