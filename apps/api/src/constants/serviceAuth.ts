/** Generic service-to-service authentication — Integration Foundation V1 */

export const SERVICE_AUTH_HEADER = 'x-service-token' as const;

export const IDEMPOTENCY_HEADER = 'idempotency-key' as const;

export const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

export const SERVICE_HEARTBEAT_STALE_MS = 5 * 60 * 1000;

export const SERVICE_REGISTRY_NAMES = [
  'api',
  'background',
  'socket',
  'notifications',
] as const;

export type RegisteredServiceName = (typeof SERVICE_REGISTRY_NAMES)[number] | string;
