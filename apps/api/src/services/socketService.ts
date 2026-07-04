import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import type { SocketEvent, SocketPayload } from '@bananaos/shared';

let io: Server | null = null;
const userSockets = new Map<string, Set<string>>();

export function initializeSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token as string | undefined;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as { userId: string };
      socket.data.userId = payload.userId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId as string;
    registerSocket(userId, socket.id);

    socket.join(`user:${userId}`);

    socket.on('disconnect', () => {
      unregisterSocket(userId, socket.id);
    });

    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date().toISOString() });
    });
  });

  return io;
}

function registerSocket(userId: string, socketId: string): void {
  if (!userSockets.has(userId)) {
    userSockets.set(userId, new Set());
  }
  userSockets.get(userId)!.add(socketId);
}

function unregisterSocket(userId: string, socketId: string): void {
  const sockets = userSockets.get(userId);
  if (sockets) {
    sockets.delete(socketId);
    if (sockets.size === 0) {
      userSockets.delete(userId);
    }
  }
}

export function emitToUser(userId: string, event: SocketEvent, data: unknown): void {
  if (!io) return;
  const payload: SocketPayload = {
    event,
    data,
    timestamp: new Date().toISOString(),
  };
  io.to(`user:${userId}`).emit(event, payload);
}

export function broadcast(event: SocketEvent, data: unknown): void {
  if (!io) return;
  const payload: SocketPayload = {
    event,
    data,
    timestamp: new Date().toISOString(),
  };
  io.emit(event, payload);
}

export function getConnectedUsers(): number {
  return userSockets.size;
}

export function getSocketServer(): Server | null {
  return io;
}
