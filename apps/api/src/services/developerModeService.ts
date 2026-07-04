import { Types } from 'mongoose';
import { DeveloperLog } from '../database/models/DeveloperLog';
import { getPermissions } from './permissionBrokerService';
import { getExpandedStorageBreakdown } from './storageExpansionService';
import { getNetwork } from './networkService';
import { getRegisteredTasks } from './backgroundServiceManager';
import { replayEvents } from './eventBusService';

export async function logDeveloperEvent(
  userId: string,
  level: 'debug' | 'info' | 'warn' | 'error',
  category: string,
  message: string,
  metadata?: Record<string, unknown>
) {
  await DeveloperLog.create({
    userId: new Types.ObjectId(userId),
    level,
    category,
    message,
    metadata: metadata ?? {},
  });
}

export async function getDeveloperLogs(userId: string, limit = 100, level?: string) {
  const filter: Record<string, unknown> = { userId };
  if (level) filter.level = level;
  const logs = await DeveloperLog.find(filter).sort({ createdAt: -1 }).limit(limit);
  return logs.map((l) => ({
    level: l.level,
    category: l.category,
    message: l.message,
    metadata: l.metadata,
    at: l.createdAt.toISOString(),
  }));
}

export async function getApiInspector(userId: string) {
  const events = await replayEvents({ userId, limit: 50 });
  return {
    recentApiEvents: events.map((e) => ({
      namespace: e.namespace,
      event: e.event,
      source: e.source,
      at: e.createdAt,
    })),
    endpoints: [
      '/api/device/ecosystem/profile',
      '/api/device/ecosystem/power',
      '/api/device/ecosystem/security',
      '/api/device/ecosystem/backup',
      '/api/device/ecosystem/sync',
      '/api/communication/messages',
      '/api/world/state',
      '/api/system/diagnostics',
    ],
  };
}

export async function getSocketInspector(userId: string) {
  const events = await replayEvents({ userId, namespace: 'system', limit: 30 });
  return {
    subscribedEvents: [
      'device:update', 'device:power:update', 'device:security:update',
      'device:backup:complete', 'device:sync:complete', 'message:new',
      'world:update', 'notification:new',
    ],
    recentEmissions: events,
  };
}

export async function getPermissionViewer(userId: string) {
  const permissions = await getPermissions(userId);
  return { permissions, total: permissions.length, granted: permissions.filter((p) => p.granted).length };
}

export async function getStorageViewer(userId: string) {
  return getExpandedStorageBreakdown(userId);
}

export async function getNetworkViewer(userId: string) {
  const network = await getNetwork(userId);
  return { ...network, backgroundTasks: getRegisteredTasks() };
}

export async function getDeveloperDashboard(userId: string) {
  const [logs, permissions, storage, network, api, sockets] = await Promise.all([
    getDeveloperLogs(userId, 20),
    getPermissionViewer(userId),
    getStorageViewer(userId),
    getNetworkViewer(userId),
    getApiInspector(userId),
    getSocketInspector(userId),
  ]);
  return { logs, permissions, storage, network, api, sockets };
}
