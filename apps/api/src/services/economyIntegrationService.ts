import { v4 as uuidv4 } from 'uuid';
import { Types } from 'mongoose';
import { EconomyAuditLog } from '../database/models/EconomyAuditLog';
import { logAudit } from './auditService';
import { enqueueNotification } from './notificationBrokerService';
import { ECONOMY_APP_BUNDLE } from '../constants/economy';

export async function logEconomyAction(params: {
  userId: string;
  actorId: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  deviceUuid?: string;
}) {
  await logAudit({
    userId: params.userId,
    actorId: params.actorId,
    action: params.action,
    resource: params.resource,
    resourceId: params.resourceId,
    metadata: params.metadata,
    ipAddress: params.ipAddress,
  });

  await EconomyAuditLog.create({
    logId: `ELOG-${uuidv4().slice(0, 8).toUpperCase()}`,
    userId: new Types.ObjectId(params.userId),
    actorId: new Types.ObjectId(params.actorId),
    action: params.action,
    resource: params.resource,
    resourceId: params.resourceId,
    metadata: params.metadata,
    ipAddress: params.ipAddress,
    deviceUuid: params.deviceUuid,
  });
}

export async function notifyEconomyAdmin(title: string, body: string, userId?: string) {
  if (!userId) return;
  try {
    await enqueueNotification({
      userId,
      appId: ECONOMY_APP_BUNDLE,
      title,
      body,
      icon: '📊',
      actorId: userId,
    });
  } catch { /* permission */ }
}

export function currentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function currentHourPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}`;
}
