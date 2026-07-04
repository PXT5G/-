import { Types } from 'mongoose';
import { NetworkState } from '../database/models/NetworkState';
import { emitToUser } from './socketService';

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
  const { tickWorld } = await import('./worldEngineService');
  const result = await tickWorld(userId);
  const net = await ensureNetwork(userId);
  return result.network ?? formatNetwork(net);
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
  const { tickAllWorlds } = await import('./worldEngineService');
  return tickAllWorlds();
}
