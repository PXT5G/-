export type ControlTab = 'dashboard' | 'permissions' | 'audit' | 'realtime' | 'sessions';

export interface SystemDashboard {
  activeUsers: number;
  activeSessions: number;
  platformSessions: number;
  corePermissions: number;
  connectedSockets: number;
  auditLogCount: number;
  auditByApp: Array<{ appId: string; count: number }>;
  eventTraffic: {
    totalRecorded: number;
    bufferSize: number;
    connectedUsers: number;
    byType: Array<{ event: string; count: number }>;
    byApp: Array<{ app: string; count: number }>;
  };
  systemHealth: {
    status: string;
    database: { connected: boolean; readyState: number };
    uptime: number;
    memory: { heapUsed: number; rss: number };
  };
  apps: string[];
}

export interface CorePermissionRow {
  id: string;
  appId: string;
  userId: string;
  permission: string;
  granted: boolean;
  grantedAt: string;
  metadata?: Record<string, unknown>;
}

export interface AuditLogRow {
  id: string;
  appId: string;
  userId: string;
  action: string;
  entityType: string;
  query?: string;
  permission?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface RecordedEvent {
  id: string;
  event: string;
  userId?: string;
  data: unknown;
  timestamp: string;
  direction: 'user' | 'broadcast';
}

export interface PlatformSession {
  id: string;
  userId: string;
  username?: string;
  displayName?: string;
  role?: string;
  sessionId: string;
  activeAppId?: string;
  deviceId?: string;
  deviceName?: string;
  ipAddress?: string;
  lastActiveAt: string;
  appContexts: Array<{ appId: string; lastAccessedAt: string; deviceId?: string }>;
}
