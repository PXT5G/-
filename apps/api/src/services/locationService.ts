import { Types } from 'mongoose';
import { DeviceLocation } from '../database/models/DeviceLocation';
import { emitToUser } from './socketService';
import { checkPermission } from './permissionBrokerService';
import { publishEvent } from './eventBusService';
import { logAudit } from './auditService';

const STREETS = ['Broadway', 'Wall St', 'Fifth Ave', 'Park Ave', 'Lexington Ave'];
const DISTRICTS = ['Manhattan', 'Brooklyn', 'Queens', 'Bronx'];
const ZONES = ['Financial District', 'Midtown', 'SoHo', 'Upper East Side'];

function formatLocation(doc: InstanceType<typeof DeviceLocation>) {
  return {
    latitude: doc.latitude,
    longitude: doc.longitude,
    heading: doc.heading,
    speed: doc.speed,
    altitude: doc.altitude,
    accuracy: doc.accuracy,
    district: doc.district,
    street: doc.street,
    zone: doc.zone,
    region: doc.region,
    gpsTimestamp: doc.gpsTimestamp.toISOString(),
    movementState: doc.movementState,
    enabled: doc.enabled,
  };
}

export async function ensureLocation(userId: string) {
  let loc = await DeviceLocation.findOne({ userId, deletedAt: null });
  if (!loc) {
    loc = await DeviceLocation.create({
      userId: new Types.ObjectId(userId),
      district: DISTRICTS[0],
      street: STREETS[0],
      zone: ZONES[0],
      region: 'New York',
    });
  }
  return loc;
}

export async function getLocation(userId: string, appId = 'com.bananaos.system') {
  const allowed = await checkPermission(userId, appId, 'location');
  if (!allowed) {
    throw new Error('PERMISSION_DENIED');
  }
  const loc = await ensureLocation(userId);
  return formatLocation(loc);
}

export async function refreshLocation(userId: string): Promise<ReturnType<typeof formatLocation>> {
  const loc = await ensureLocation(userId);
  if (!loc.enabled) return formatLocation(loc);

  const delta = (Math.random() - 0.5) * 0.0002;
  loc.latitude += delta;
  loc.longitude += delta * 1.2;
  loc.heading = (loc.heading + Math.random() * 30 - 15 + 360) % 360;
  loc.speed = Math.max(0, loc.speed + (Math.random() - 0.5) * 2);
  loc.altitude = 10 + Math.random() * 5;
  loc.accuracy = 3 + Math.random() * 8;
  loc.gpsTimestamp = new Date();

  if (loc.speed < 0.5) loc.movementState = 'stationary';
  else if (loc.speed < 5) loc.movementState = 'walking';
  else loc.movementState = 'driving';

  if (Math.random() < 0.1) {
    loc.street = STREETS[Math.floor(Math.random() * STREETS.length)];
    loc.zone = ZONES[Math.floor(Math.random() * ZONES.length)];
  }

  await loc.save();

  const data = formatLocation(loc);
  emitToUser(userId, 'location:update', data);
  await publishEvent({
    userId,
    namespace: 'system.location',
    event: 'location:update',
    payload: data,
    source: 'locationService',
  });

  return data;
}

export async function setLocationEnabled(
  userId: string,
  enabled: boolean,
  actorId: string
): Promise<ReturnType<typeof formatLocation>> {
  const loc = await ensureLocation(userId);
  loc.enabled = enabled;
  loc.updatedBy = new Types.ObjectId(actorId);
  await loc.save();
  await logAudit({
    userId,
    actorId,
    action: enabled ? 'enable' : 'disable',
    resource: 'location',
    resourceId: loc._id.toString(),
  });
  const data = formatLocation(loc);
  emitToUser(userId, 'location:update', data);
  return data;
}

export async function refreshAllLocations(): Promise<number> {
  const locations = await DeviceLocation.find({ enabled: true, deletedAt: null });
  for (const loc of locations) {
    await refreshLocation(loc.userId.toString());
  }
  return locations.length;
}
