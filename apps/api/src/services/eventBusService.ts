import { Types } from 'mongoose';
import { SystemEvent } from '../database/models/SystemEvent';
import { emitToUser, broadcast } from './socketService';

type EventHandler = (payload: Record<string, unknown>) => void | Promise<void>;

const localHandlers = new Map<string, Set<EventHandler>>();

function handlerKey(namespace: string, event: string): string {
  return `${namespace}:${event}`;
}

export async function publishEvent(params: {
  userId?: string;
  namespace: string;
  event: string;
  payload: Record<string, unknown>;
  priority?: number;
  source?: string;
  replayable?: boolean;
}): Promise<SystemEventInfo> {
  const doc = await SystemEvent.create({
    userId: params.userId ? new Types.ObjectId(params.userId) : undefined,
    namespace: params.namespace,
    event: params.event,
    payload: params.payload,
    priority: params.priority ?? 0,
    replayable: params.replayable ?? true,
    source: params.source ?? 'system',
  });

  const info: SystemEventInfo = {
    id: doc._id.toString(),
    namespace: doc.namespace,
    event: doc.event,
    payload: doc.payload as Record<string, unknown>,
    priority: doc.priority,
    source: doc.source,
    createdAt: doc.createdAt.toISOString(),
  };

  const key = handlerKey(params.namespace, params.event);
  const wildcardKey = handlerKey(params.namespace, '*');
  const handlers = new Set([...(localHandlers.get(key) ?? []), ...(localHandlers.get(wildcardKey) ?? [])]);
  for (const handler of handlers) {
    await handler(params.payload);
  }

  if (params.userId) {
    emitToUser(params.userId, 'system:broadcast' as never, info);
  } else {
    broadcast('system:broadcast' as never, info);
  }

  return info;
}

export function subscribe(namespace: string, event: string, handler: EventHandler): () => void {
  const key = handlerKey(namespace, event);
  if (!localHandlers.has(key)) localHandlers.set(key, new Set());
  localHandlers.get(key)!.add(handler);
  return () => localHandlers.get(key)?.delete(handler);
}

export async function replayEvents(params: {
  userId?: string;
  namespace?: string;
  event?: string;
  since?: Date;
  limit?: number;
}): Promise<SystemEventInfo[]> {
  const filter: Record<string, unknown> = { deletedAt: null, replayable: true };
  if (params.userId) filter.userId = new Types.ObjectId(params.userId);
  if (params.namespace) filter.namespace = params.namespace;
  if (params.event) filter.event = params.event;
  if (params.since) filter.createdAt = { $gte: params.since };

  const events = await SystemEvent.find(filter)
    .sort({ createdAt: -1 })
    .limit(params.limit ?? 50);

  return events.map((e) => ({
    id: e._id.toString(),
    namespace: e.namespace,
    event: e.event,
    payload: e.payload as Record<string, unknown>,
    priority: e.priority,
    source: e.source,
    createdAt: e.createdAt.toISOString(),
  }));
}

interface SystemEventInfo {
  id: string;
  namespace: string;
  event: string;
  payload: Record<string, unknown>;
  priority: number;
  source: string;
  createdAt: string;
}

export type { SystemEventInfo };
