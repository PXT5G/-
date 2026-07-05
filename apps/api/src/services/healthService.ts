import { getDatabaseHealth } from '../database/connection';
import { getConnectedUsers } from './socketService';
import { getRegisteredTasks } from './backgroundServiceManager';
import { isServiceAuthConfigured, getServiceAuthFingerprint } from './serviceAuthService';
import { isTokenEncryptionConfigured } from './tokenEncryptionService';
import { listNotificationProviders } from './notificationProviderRegistry';
import { getServiceHeartbeats } from './serviceRegistryService';
import { env } from '../config/env';

export type HealthStatus = 'healthy' | 'degraded' | 'down';

export interface SystemHealthReport {
  status: HealthStatus;
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  database: ReturnType<typeof getDatabaseHealth>;
  socket: { connectedUsers: number };
  background: { registeredTasks: string[] };
  integration: {
    serviceAuthConfigured: boolean;
    serviceAuthFingerprint: string | null;
    tokenEncryptionConfigured: boolean;
    notificationProviders: ReturnType<typeof listNotificationProviders>;
    externalServices: ReturnType<typeof getServiceHeartbeats>;
  };
  memory: {
    heapUsedMb: number;
    heapTotalMb: number;
    rssMb: number;
  };
}

export async function collectSystemHealth(): Promise<SystemHealthReport> {
  const database = getDatabaseHealth();
  const mem = process.memoryUsage();

  const externalServices = getServiceHeartbeats();
  const hasStaleExternal = externalServices.some((s) => s.status === 'down');
  const dbDown = !database.connected;

  let status: HealthStatus = 'healthy';
  if (dbDown) status = 'down';
  else if (hasStaleExternal) status = 'degraded';

  return {
    status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    environment: env.NODE_ENV,
    database,
    socket: { connectedUsers: getConnectedUsers() },
    background: { registeredTasks: getRegisteredTasks() },
    integration: {
      serviceAuthConfigured: isServiceAuthConfigured(),
      serviceAuthFingerprint: getServiceAuthFingerprint(),
      tokenEncryptionConfigured: isTokenEncryptionConfigured(),
      notificationProviders: listNotificationProviders(),
      externalServices,
    },
    memory: {
      heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
      rssMb: Math.round(mem.rss / 1024 / 1024),
    },
  };
}
