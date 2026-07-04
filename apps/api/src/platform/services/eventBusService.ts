import type { SocketEvent, SocketPayload } from '@bananaos/shared';
import {
  emitToUser as socketEmitToUser,
  broadcast as socketBroadcast,
  getConnectedUsers as socketGetConnectedUsers,
  getSocketServer,
} from '../../services/socketService';

function wrapPayload(event: SocketEvent, data: unknown): SocketPayload {
  return { event, data, timestamp: new Date().toISOString() };
}

export function emitToUser(userId: string, event: SocketEvent, data: unknown): void {
  socketEmitToUser(userId, event, data);
}

export function broadcast(event: SocketEvent, data: unknown): void {
  socketBroadcast(event, data);
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

export function getServer() {
  return getSocketServer();
}

export const eventBusService = {
  emitToUser,
  broadcast,
  emitAppDomainEvent,
  getConnectedUsers,
  getServer,
  wrapPayload,
};
