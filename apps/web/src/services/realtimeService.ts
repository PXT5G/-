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
      'store:download:progress',
      'store:download:complete',
      'store:download:cancelled',
      'store:download:paused',
      'store:download:resumed',
      'store:update:complete',
      'device:storage:updated',
      'device:storage:warning',
      'device:ram:updated',
      'device:memory:pressure',
      'device:update:complete',
      'device:update:rollback',
      'device:profile:update',
      'device:power:update',
      'device:power:emergency',
      'device:security:update',
      'device:security:unlocked',
      'device:security:remote_lock',
      'device:security:remote_wipe',
      'device:backup:complete',
      'device:backup:progress',
      'device:backup:restored',
      'device:sync:complete',
      'device:sync:progress',
      'device:maintenance:complete',
      'device:recovery:update',
      'device:recovery:factory_reset',
      'device:ecosystem:ready',
      'device:diagnostics:extended',
      'system-apps:ready',
      'gallery:update',
      'camera:capture',
      'calendar:update',
      'clock:update',
      'notes:update',
      'voice-recorder:update',
      'weather:update',
      'maps:update',
      'files:update',
      'system:ready',
      'system:error',
      'location:update',
      'network:update',
      'world:update',
      'tower:update',
      'signal:update',
      'gps:update',
      'vpn:update',
      'carrier:update',
      'tracking:update',
      'message:new',
      'message:delivered',
      'message:read',
      'message:edited',
      'message:deleted',
      'conversation:new',
      'conversation:member_added',
      'presence:update',
      'typing:update',
      'reaction:update',
      'attachment:progress',
      'attachment:ready',
      'sync:complete',
      'battery:update',
      'device:update',
      'permission:update',
      'job:update',
      'diagnostics:update',
      'service:health',
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
