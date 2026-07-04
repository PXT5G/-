import { Types } from 'mongoose';
import { DeviceLocation } from '../database/models/DeviceLocation';
import { emitToUser } from './socketService';
import { checkPermission } from './permissionBrokerService';
import { logAudit } from './auditService';

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
    const { ensureWorldState } = await import('./worldEngineService');
    const world = await ensureWorldState(userId);
    loc = await DeviceLocation.create({
      userId: new Types.ObjectId(userId),
      latitude: world.latitude,
      longitude: world.longitude,
      heading: world.heading,
      speed: world.speed,
      altitude: world.altitude,
      district: world.district,
      street: world.street,
      zone: world.zone,
      region: world.region,
    });
  }
  return loc;
}

export async function getLocation(userId: string, appId = 'com.gulfos.system') {
  const allowed = await checkPermission(userId, appId, 'location');
  if (!allowed) {
    throw new Error('PERMISSION_DENIED');
  }
  const loc = await ensureLocation(userId);
  return formatLocation(loc);
}

export async function refreshLocation(userId: string): Promise<ReturnType<typeof formatLocation>> {
  const { tickWorld } = await import('./worldEngineService');
  await tickWorld(userId);
  const loc = await ensureLocation(userId);
  return formatLocation(loc);
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
  const { tickAllWorlds } = await import('./worldEngineService');
  return tickAllWorlds();
}
