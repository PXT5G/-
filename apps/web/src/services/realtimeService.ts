import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '@/utils/api';
import type { SocketEvent, SocketPayload } from '@/types';

type EventCallback = (payload: SocketPayload) => void;

class RealtimeService {
  private socket: Socket | null = null;
  private listeners = new Map<SocketEvent, Set<EventCallback>>();

  connect(token: string): void {
    if (this.socket?.connected) return;

    this.socket = io(API_BASE_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('[Realtime] Connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Realtime] Disconnected:', reason);
    });

    const events: SocketEvent[] = [
      'notification:new',
      'notification:read',
      'app:installed',
      'app:uninstalled',
      'settings:updated',
      'session:expired',
      'system:broadcast',
    ];

    events.forEach((event) => {
      this.socket!.on(event, (payload: SocketPayload) => {
        const callbacks = this.listeners.get(event);
        callbacks?.forEach((cb) => cb(payload));
      });
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  on(event: SocketEvent, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  emit(event: string, data: unknown): void {
    this.socket?.emit(event, data);
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const realtimeService = new RealtimeService();
