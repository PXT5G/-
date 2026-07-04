import type { NotificationPriority, SocketEvent } from '@bananaos/shared';
import { BANANAOS_APP_IDS, IDENTITY_GATED_APPS, type BananaOSAppId } from '@bananaos/shared';

export { BANANAOS_APP_IDS, IDENTITY_GATED_APPS, type BananaOSAppId };

export interface PlatformAuditContext {
  performedBy: string;
  performedByRole: string;
  permission?: string;
  deviceId?: string;
  ipAddress?: string;
  reason?: string;
}

export interface CoreAuditEntry {
  appId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  ctx: PlatformAuditContext;
  query?: string;
  oldValue?: string;
  newValue?: string;
  reason?: string;
  details?: string;
  amount?: number;
  metadata?: Record<string, unknown>;
}

export interface SendNotificationParams {
  userId: string;
  appId: BananaOSAppId | string;
  title: string;
  body: string;
  icon?: string;
  priority?: NotificationPriority;
  groupId?: string;
  domainEvent?: SocketEvent;
  domainPayload?: unknown;
}

export interface IdentityContext {
  userId: string;
  identityId?: string;
  fullName?: string;
  username?: string;
  nationalId?: string;
  status?: string;
  verified: boolean;
  membershipLevel?: string;
  expiryDate?: string;
}

export interface PermissionCheckResult {
  granted: boolean;
  source: 'admin' | 'core' | 'legacy' | 'denied';
}
