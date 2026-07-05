import { SERVICE_HEARTBEAT_STALE_MS } from '../constants/serviceAuth';

export interface ServiceHeartbeat {
  serviceId: string;
  status: 'healthy' | 'degraded' | 'down';
  version?: string;
  metadata?: Record<string, unknown>;
  lastSeenAt: string;
}

const heartbeats = new Map<string, ServiceHeartbeat>();

export function recordServiceHeartbeat(input: {
  serviceId: string;
  status?: 'healthy' | 'degraded' | 'down';
  version?: string;
  metadata?: Record<string, unknown>;
}): ServiceHeartbeat {
  const entry: ServiceHeartbeat = {
    serviceId: input.serviceId,
    status: input.status ?? 'healthy',
    version: input.version,
    metadata: input.metadata,
    lastSeenAt: new Date().toISOString(),
  };
  heartbeats.set(input.serviceId, entry);
  return entry;
}

export function getServiceHeartbeats(): ServiceHeartbeat[] {
  const now = Date.now();
  return Array.from(heartbeats.values()).map((hb) => {
    const stale = now - new Date(hb.lastSeenAt).getTime() > SERVICE_HEARTBEAT_STALE_MS;
    return stale ? { ...hb, status: 'down' as const } : hb;
  });
}

export function getServiceHeartbeat(serviceId: string): ServiceHeartbeat | null {
  const hb = heartbeats.get(serviceId);
  if (!hb) return null;
  const stale = Date.now() - new Date(hb.lastSeenAt).getTime() > SERVICE_HEARTBEAT_STALE_MS;
  return stale ? { ...hb, status: 'down' } : hb;
}

export function clearServiceHeartbeats(): void {
  heartbeats.clear();
}
