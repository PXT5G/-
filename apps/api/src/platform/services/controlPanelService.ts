import { User } from '../../database/models/User';
import { Session } from '../../database/models/Session';
import { CorePermission } from '../../database/models/platform/CorePermission';
import { PlatformAppSession } from '../../database/models/platform/PlatformAppSession';
import { getDatabaseHealth } from '../../database/connection';
import {
  identityBridgeService,
} from './identityBridgeService';
import { permissionEngineService } from './permissionEngineService';
import { auditService } from './auditService';
import { eventBusService } from './eventBusService';
import { BANANAOS_APP_IDS } from '../types';

const CONTROL_PANEL_APP_ID = 'com.bananaos.control-panel';

async function logAdminAction(
  adminUserId: string,
  action: string,
  entityType: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await auditService.log({
    appId: CONTROL_PANEL_APP_ID,
    userId: adminUserId,
    action,
    entityType,
    ctx: { performedBy: adminUserId, performedByRole: 'admin', permission: 'control_panel' },
    metadata,
  });
}

export async function getSystemDashboard() {
  const [
    activeUsers,
    activeSessions,
    platformSessions,
    corePermissions,
    auditStats,
    eventStats,
    connectedUsers,
    dbHealth,
  ] = await Promise.all([
    User.countDocuments(),
    Session.countDocuments(),
    PlatformAppSession.countDocuments(),
    CorePermission.countDocuments({ granted: true }),
    auditService.getStats(),
    Promise.resolve(eventBusService.getEventStats()),
    Promise.resolve(eventBusService.getConnectedUsers()),
    Promise.resolve(getDatabaseHealth()),
  ]);

  return {
    activeUsers,
    activeSessions,
    platformSessions,
    corePermissions,
    connectedSockets: connectedUsers,
    auditLogCount: auditStats.total,
    auditByApp: auditStats.byApp,
    eventTraffic: eventStats,
    systemHealth: {
      status: dbHealth.connected ? 'healthy' : 'degraded',
      database: dbHealth,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    },
    apps: Object.values(BANANAOS_APP_IDS),
  };
}

export async function getPermissionsManager(params: {
  appId?: string;
  userId?: string;
  page?: number;
  limit?: number;
}) {
  return permissionEngineService.queryAllPermissions(params);
}

export async function syncAppPermissions(adminUserId: string, appId: string) {
  const synced = await permissionEngineService.syncAppPermissions(appId, adminUserId);
  await logAdminAction(adminUserId, 'control_sync_permissions', 'CorePermission', { appId, synced });
  return { synced };
}

export async function grantPermissionsAdmin(
  adminUserId: string,
  appId: string,
  userId: string,
  permissions: string[],
  override = false,
  reason?: string
) {
  if (override) {
    await permissionEngineService.overrideAccess(appId, userId, permissions, adminUserId, reason ?? 'Admin override');
  } else {
    await permissionEngineService.grantPermissions(appId, userId, permissions, adminUserId);
  }
  await logAdminAction(adminUserId, 'control_grant_permissions', 'CorePermission', { appId, userId, permissions, override });
}

export async function revokePermissionAdmin(
  adminUserId: string,
  appId: string,
  userId: string,
  permission: string
) {
  await permissionEngineService.revokePermission(appId, userId, permission, adminUserId);
  await logAdminAction(adminUserId, 'control_revoke_permission', 'CorePermission', { appId, userId, permission });
}

export async function searchAuditLogs(params: {
  appId?: string;
  userId?: string;
  action?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  return auditService.queryLogs(params);
}

export async function exportAuditLogs(
  adminUserId: string,
  params: { appId?: string; userId?: string; action?: string; search?: string; limit?: number }
) {
  const logs = await auditService.exportLogs(params);
  await logAdminAction(adminUserId, 'control_export_audit', 'CoreAuditLog', {
    count: logs.length,
    filters: params,
  });
  return logs;
}

export async function getRealtimeMonitor(limit = 100) {
  return {
    events: eventBusService.getEventBuffer(limit),
    stats: eventBusService.getEventStats(),
    connectedUserIds: eventBusService.getConnectedUserIdList(),
  };
}

export async function getSessionManager(params: { page?: number; limit?: number; userId?: string }) {
  return identityBridgeService.listAllPlatformSessions(params);
}

export async function forceLogoutSessionAdmin(
  adminUserId: string,
  targetUserId: string,
  sessionId: string,
  reason?: string
) {
  await identityBridgeService.forceLogoutSession(adminUserId, targetUserId, sessionId, reason);
  await logAdminAction(adminUserId, 'control_force_logout_session', 'PlatformAppSession', { targetUserId, sessionId });
}

export async function forceLogoutUserAdmin(adminUserId: string, targetUserId: string, reason?: string) {
  await identityBridgeService.forceLogoutUser(adminUserId, targetUserId, reason);
  await logAdminAction(adminUserId, 'control_force_logout_user', 'User', { targetUserId });
}

export const controlPanelService = {
  getSystemDashboard,
  getPermissionsManager,
  syncAppPermissions,
  grantPermissionsAdmin,
  revokePermissionAdmin,
  searchAuditLogs,
  exportAuditLogs,
  getRealtimeMonitor,
  getSessionManager,
  forceLogoutSessionAdmin,
  forceLogoutUserAdmin,
  CONTROL_PANEL_APP_ID,
};
