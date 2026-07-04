import { Types } from 'mongoose';
import { NetworkState } from '../database/models/NetworkState';
import { emitToUser } from './socketService';
import { publishEvent } from './eventBusService';

function formatNetwork(doc: InstanceType<typeof NetworkState>) {
  return {
    carrier: doc.carrier,
    signalStrength: doc.signalStrength,
    cellTowers: doc.cellTowers,
    internetConnected: doc.internetConnected,
    vpnEnabled: doc.vpnEnabled,
    vpnName: doc.vpnName,
    coverage: doc.coverage,
    latencyMs: doc.latencyMs,
    bandwidthMbps: doc.bandwidthMbps,
    packetLoss: doc.packetLoss,
    jitterMs: doc.jitterMs,
    connectionState: doc.connectionState,
    wifiEnabled: doc.wifiEnabled,
    wifiSsid: doc.wifiSsid,
    bluetoothEnabled: doc.bluetoothEnabled,
  };
}

const DEFAULT_TOWERS = [
  { id: 'tower-001', strength: 4, band: 'n78' },
  { id: 'tower-002', strength: 3, band: 'n41' },
  { id: 'tower-003', strength: 2, band: 'b3' },
];

export async function ensureNetwork(userId: string) {
  let net = await NetworkState.findOne({ userId, deletedAt: null });
  if (!net) {
    net = await NetworkState.create({
      userId: new Types.ObjectId(userId),
      cellTowers: DEFAULT_TOWERS,
    });
  }
  return net;
}

export async function getNetwork(userId: string) {
  const net = await ensureNetwork(userId);
  return formatNetwork(net);
}

export async function refreshNetwork(userId: string) {
  const net = await ensureNetwork(userId);

  net.signalStrength = Math.max(1, Math.min(5, net.signalStrength + (Math.random() > 0.5 ? 1 : -1) * (Math.random() < 0.3 ? 1 : 0)));
  net.latencyMs = Math.max(12, Math.round(net.latencyMs + (Math.random() - 0.5) * 10));
  net.bandwidthMbps = Math.max(10, net.bandwidthMbps + (Math.random() - 0.5) * 20);
  net.packetLoss = Math.max(0, Math.min(5, net.packetLoss + (Math.random() - 0.5) * 0.2));
  net.jitterMs = Math.max(0.5, net.jitterMs + (Math.random() - 0.5) * 2);

  net.cellTowers = net.cellTowers.map((t) => ({
    ...t,
    strength: Math.max(1, Math.min(5, t.strength + (Math.random() > 0.7 ? (Math.random() > 0.5 ? 1 : -1) : 0))),
  }));

  if (!net.wifiEnabled && net.signalStrength < 2) {
    net.connectionState = 'limited';
    net.internetConnected = Math.random() > 0.3;
  } else {
    net.connectionState = 'connected';
    net.internetConnected = true;
  }

  await net.save();

  const data = formatNetwork(net);
  emitToUser(userId, 'network:update', data);
  await publishEvent({
    userId,
    namespace: 'system.network',
    event: 'network:update',
    payload: data,
    source: 'networkService',
  });

  return data;
}

export async function updateNetworkSettings(
  userId: string,
  updates: Partial<{
    wifiEnabled: boolean;
    bluetoothEnabled: boolean;
    vpnEnabled: boolean;
    vpnName: string;
  }>,
  actorId: string
) {
  const net = await ensureNetwork(userId);
  if (updates.wifiEnabled !== undefined) net.wifiEnabled = updates.wifiEnabled;
  if (updates.bluetoothEnabled !== undefined) net.bluetoothEnabled = updates.bluetoothEnabled;
  if (updates.vpnEnabled !== undefined) net.vpnEnabled = updates.vpnEnabled;
  if (updates.vpnName !== undefined) net.vpnName = updates.vpnName;
  net.updatedBy = new Types.ObjectId(actorId);
  await net.save();

  const data = formatNetwork(net);
  emitToUser(userId, 'network:update', data);
  return data;
}

export async function refreshAllNetworks(): Promise<number> {
  const states = await NetworkState.find({ deletedAt: null });
  for (const net of states) {
    await refreshNetwork(net.userId.toString());
  }
  return states.length;
}
