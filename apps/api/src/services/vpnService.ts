import crypto from 'crypto';
import { Types } from 'mongoose';
import { VPNSession } from '../database/models/VPNSession';
import { NetworkState } from '../database/models/NetworkState';
import { VPN_COUNTRIES } from '../constants/gtaMap';
import { emitToUser } from './socketService';
import { logAudit } from './auditService';
import { publishEvent } from './eventBusService';

function formatVpn(session: InstanceType<typeof VPNSession> | null) {
  if (!session || !session.active) {
    return { active: false, country: null, virtualIp: null, encryption: null };
  }
  return {
    active: true,
    country: session.country,
    countryName: session.countryName,
    virtualIp: session.virtualIp,
    encryption: session.encryption,
    latencyPenaltyMs: session.latencyPenaltyMs,
    bandwidthPenaltyMbps: session.bandwidthPenaltyMbps,
    connectedAt: session.connectedAt.toISOString(),
  };
}

export async function getActiveVpnSession(userId: string) {
  return VPNSession.findOne({ userId, active: true, deletedAt: null });
}

export async function getVpnState(userId: string) {
  const session = await getActiveVpnSession(userId);
  return formatVpn(session);
}

export async function connectVpn(userId: string, countryCode: string, actorId: string) {
  const country = VPN_COUNTRIES.find((c) => c.code === countryCode);
  if (!country) throw new Error('INVALID_COUNTRY');

  await VPNSession.updateMany({ userId, active: true }, { active: false, disconnectedAt: new Date() });

  const virtualIp = `${country.virtualIpPrefix}.${Math.floor(Math.random() * 254) + 1}`;
  const session = await VPNSession.create({
    userId: new Types.ObjectId(userId),
    country: country.code,
    countryName: country.name,
    virtualIp,
    encryption: 'AES-256-GCM',
    latencyPenaltyMs: 20 + Math.floor(Math.random() * 15),
    bandwidthPenaltyMbps: 10 + Math.floor(Math.random() * 10),
    active: true,
    createdBy: new Types.ObjectId(actorId),
  });

  await NetworkState.findOneAndUpdate(
    { userId },
    { vpnEnabled: true, vpnName: country.name },
    { upsert: true }
  );

  await logAudit({ userId, actorId, action: 'vpn_connect', resource: 'vpn', metadata: { country: countryCode } });

  const data = formatVpn(session);
  emitToUser(userId, 'vpn:update', data);
  await publishEvent({ userId, namespace: 'world.vpn', event: 'vpn:connected', payload: data, source: 'vpnService' });
  return data;
}

export async function disconnectVpn(userId: string, actorId: string) {
  await VPNSession.updateMany(
    { userId, active: true },
    { active: false, disconnectedAt: new Date(), updatedBy: new Types.ObjectId(actorId) }
  );

  await NetworkState.findOneAndUpdate({ userId }, { vpnEnabled: false, vpnName: undefined });

  await logAudit({ userId, actorId, action: 'vpn_disconnect', resource: 'vpn' });

  const data = { active: false };
  emitToUser(userId, 'vpn:update', data);
  return data;
}

export async function getVpnHistory(userId: string, limit = 20) {
  const sessions = await VPNSession.find({ userId }).sort({ connectedAt: -1 }).limit(limit);
  return sessions.map((s) => ({
    country: s.country,
    countryName: s.countryName,
    virtualIp: s.virtualIp,
    active: s.active,
    connectedAt: s.connectedAt.toISOString(),
    disconnectedAt: s.disconnectedAt?.toISOString(),
  }));
}
