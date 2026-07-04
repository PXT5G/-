import type { SocketEvent, SocketPayload } from '@bananaos/shared';
import {
  emitToUser as socketEmitToUser,
  broadcast as socketBroadcast,
  getConnectedUsers as socketGetConnectedUsers,
  getConnectedUserIds,
  getSocketServer,
} from '../../services/socketService';

const ADMIN_CONTROL_ROOM = 'admin:control';
const EVENT_BUFFER_SIZE = 500;

export interface RecordedEvent {
  id: string;
  event: SocketEvent;
  userId?: string;
  data: unknown;
  timestamp: string;
  direction: 'user' | 'broadcast';
}

const eventBuffer: RecordedEvent[] = [];
const eventTypeCounts = new Map<string, number>();
const appActivityCounts = new Map<string, number>();
let eventIdCounter = 0;

function recordEvent(entry: Omit<RecordedEvent, 'id'>): RecordedEvent {
  const recorded: RecordedEvent = { ...entry, id: `evt-${++eventIdCounter}` };
  eventBuffer.unshift(recorded);
  if (eventBuffer.length > EVENT_BUFFER_SIZE) eventBuffer.pop();

  eventTypeCounts.set(entry.event, (eventTypeCounts.get(entry.event) ?? 0) + 1);

  const appPrefix = entry.event.split(':')[0];
  if (appPrefix) {
    appActivityCounts.set(appPrefix, (appActivityCounts.get(appPrefix) ?? 0) + 1);
  }

  const server = getSocketServer();
  if (server) {
    server.to(ADMIN_CONTROL_ROOM).emit('control:event', recorded);
  }

  return recorded;
}

function wrapPayload(event: SocketEvent, data: unknown): SocketPayload {
  return { event, data, timestamp: new Date().toISOString() };
}

export function emitToUser(userId: string, event: SocketEvent, data: unknown): void {
  socketEmitToUser(userId, event, data);
  recordEvent({ event, userId, data, timestamp: new Date().toISOString(), direction: 'user' });
}

export function broadcast(event: SocketEvent, data: unknown): void {
  socketBroadcast(event, data);
  recordEvent({ event, data, timestamp: new Date().toISOString(), direction: 'broadcast' });
}

export function emitAppDomainEvent(
  userId: string,
  event: SocketEvent,
  data: unknown,
  options?: { alsoBroadcast?: boolean }
): void {
  emitToUser(userId, event, data);
  if (options?.alsoBroadcast) {
    broadcast(event, data);
  }
}

export function getConnectedUsers(): number {
  return socketGetConnectedUsers();
}

export function getConnectedUserIdList(): string[] {
  return getConnectedUserIds();
}

export function getServer() {
  return getSocketServer();
}

export function getEventBuffer(limit = 100): RecordedEvent[] {
  return eventBuffer.slice(0, Math.min(limit, EVENT_BUFFER_SIZE));
}

export function getEventStats() {
  const byType = Array.from(eventTypeCounts.entries())
    .map(([event, count]) => ({ event, count }))
    .sort((a, b) => b.count - a.count);

  const byApp = Array.from(appActivityCounts.entries())
    .map(([app, count]) => ({ app, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalRecorded: eventIdCounter,
    bufferSize: eventBuffer.length,
    connectedUsers: getConnectedUsers(),
    byType: byType.slice(0, 20),
    byApp: byApp.slice(0, 15),
  };
}

export function joinAdminControlRoom(socketId: string): void {
  const server = getSocketServer();
  server?.sockets.sockets.get(socketId)?.join(ADMIN_CONTROL_ROOM);
}

export const eventBusService = {
  emitToUser,
  broadcast,
  emitAppDomainEvent,
  getConnectedUsers,
  getConnectedUserIdList,
  getServer,
  wrapPayload,
  getEventBuffer,
  getEventStats,
  joinAdminControlRoom,
  ADMIN_CONTROL_ROOM,
};
