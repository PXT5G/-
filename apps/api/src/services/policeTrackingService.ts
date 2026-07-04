import { Types } from 'mongoose';
import { TrackingRequest } from '../database/models/TrackingRequest';
import { TrackingResult } from '../database/models/TrackingResult';
import { LocationHistory } from '../database/models/LocationHistory';
import { SignalHistory } from '../database/models/SignalHistory';
import { Carrier } from '../database/models/Carrier';
import { WorldState } from '../database/models/WorldState';
import { User } from '../database/models/User';
import { checkPermission } from './permissionBrokerService';
import { getTowerByUuid } from './cellTowerService';
import { emitToUser } from './socketService';
import { logAudit } from './auditService';
import { NetworkState } from '../database/models/NetworkState';

const POLICE_APP = 'com.bananaos.police';
const TRACKING_PERMISSION = 'location';

async function assertPoliceAccess(requesterId: string, appId: string, role?: string): Promise<void> {
  if (role === 'admin') return;
  if (appId !== POLICE_APP) throw new Error('PERMISSION_DENIED');
  const allowed = await checkPermission(requesterId, POLICE_APP, TRACKING_PERMISSION);
  if (!allowed) throw new Error('PERMISSION_DENIED');
}

async function resolveTargetUser(targetPhoneNumber?: string, targetUserId?: string) {
  if (targetUserId) {
    const user = await User.findById(targetUserId);
    if (!user) throw new Error('TARGET_NOT_FOUND');
    return user;
  }
  if (targetPhoneNumber) {
    const user = await User.findOne({ username: targetPhoneNumber });
    if (!user) throw new Error('TARGET_NOT_FOUND');
    return user;
  }
  throw new Error('TARGET_REQUIRED');
}

export async function createTrackingRequest(
  requesterId: string,
  appId: string,
  params: {
    requestType: string;
    targetPhoneNumber?: string;
    targetUserId?: string;
    reason: string;
    warrantId?: string;
  },
  requesterRole?: string
) {
  await assertPoliceAccess(requesterId, appId, requesterRole);

  const target = await resolveTargetUser(params.targetPhoneNumber, params.targetUserId);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const request = await TrackingRequest.create({
    requesterId: new Types.ObjectId(requesterId),
    targetUserId: target._id,
    targetPhoneNumber: params.targetPhoneNumber,
    requestType: params.requestType,
    status: 'active',
    reason: params.reason,
    warrantId: params.warrantId,
    expiresAt,
    createdBy: new Types.ObjectId(requesterId),
  });

  await logAudit({
    userId: requesterId,
    actorId: requesterId,
    action: 'tracking_request',
    resource: 'police_tracking',
    resourceId: request._id.toString(),
    metadata: { requestType: params.requestType, targetUserId: target._id.toString() },
  });

  const result = await executeTracking(request, target._id.toString());

  emitToUser(requesterId, 'tracking:update', {
    requestId: request._id.toString(),
    status: 'completed',
    result,
  });

  return { requestId: request._id.toString(), status: 'completed', result };
}

async function executeTracking(request: InstanceType<typeof TrackingRequest>, targetUserId: string) {
  let payload: Record<string, unknown> = {};

  switch (request.requestType) {
    case 'phone_number': {
      const user = await User.findById(targetUserId);
      payload = { phoneNumber: user?.username, userId: targetUserId };
      break;
    }
    case 'current_tower': {
      const carrier = await Carrier.findOne({ userId: targetUserId });
      const tower = carrier?.connectedTowerUuid ? await getTowerByUuid(carrier.connectedTowerUuid) : null;
      payload = { tower, carrier: carrier?.name, generation: carrier?.generation };
      break;
    }
    case 'last_tower': {
      const lastSignal = await SignalHistory.findOne({ userId: targetUserId }).sort({ recordedAt: -1 });
      const tower = lastSignal ? await getTowerByUuid(lastSignal.towerUuid) : null;
      payload = { tower, recordedAt: lastSignal?.recordedAt.toISOString() };
      break;
    }
    case 'last_location': {
      const world = await WorldState.findOne({ userId: targetUserId });
      payload = world
        ? { latitude: world.latitude, longitude: world.longitude, district: world.district, street: world.street, recordedAt: world.lastTickAt.toISOString() }
        : { error: 'No location data' };
      break;
    }
    case 'movement_history': {
      const history = await LocationHistory.find({ userId: targetUserId }).sort({ recordedAt: -1 }).limit(100);
      payload = { points: history.map((h) => ({ lat: h.latitude, lng: h.longitude, at: h.recordedAt.toISOString(), speed: h.speed })) };
      break;
    }
    case 'signal_history': {
      const signals = await SignalHistory.find({ userId: targetUserId }).sort({ recordedAt: -1 }).limit(50);
      payload = { signals: signals.map((s) => ({ bars: s.signalBars, dbm: s.signalDbm, generation: s.generation, at: s.recordedAt.toISOString() })) };
      break;
    }
    case 'network_state': {
      const net = await NetworkState.findOne({ userId: targetUserId });
      payload = net ? { carrier: net.carrier, signal: net.signalStrength, coverage: net.coverage, latency: net.latencyMs, connected: net.internetConnected } : {};
      break;
    }
    case 'online_status': {
      const world = await WorldState.findOne({ userId: targetUserId });
      const recent = world && Date.now() - world.lastTickAt.getTime() < 120_000;
      payload = { online: recent, lastSeen: world?.lastTickAt.toISOString() };
      break;
    }
    default:
      throw new Error('INVALID_REQUEST_TYPE');
  }

  await TrackingResult.create({
    requestId: request._id,
    requesterId: request.requesterId,
    targetUserId: new Types.ObjectId(targetUserId),
    resultType: request.requestType,
    payload,
    createdBy: request.requesterId,
  });

  request.status = 'completed';
  await request.save();

  return payload;
}

export async function getTrackingHistory(requesterId: string, appId: string, requesterRole?: string) {
  await assertPoliceAccess(requesterId, appId, requesterRole);
  const requests = await TrackingRequest.find({ requesterId }).sort({ createdAt: -1 }).limit(50);
  return requests.map((r) => ({
    id: r._id.toString(),
    requestType: r.requestType,
    status: r.status,
    reason: r.reason,
    targetUserId: r.targetUserId?.toString(),
    createdAt: r.createdAt.toISOString(),
    expiresAt: r.expiresAt.toISOString(),
  }));
}
