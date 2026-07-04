import { Types } from 'mongoose';
import { CoreAuditLog } from '../../database/models/platform/CoreAuditLog';
import type { CoreAuditEntry } from '../types';

export async function log(entry: CoreAuditEntry): Promise<void> {
  await CoreAuditLog.create({
    appId: entry.appId,
    userId: new Types.ObjectId(entry.userId),
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId ? new Types.ObjectId(entry.entityId) : undefined,
    performedBy: new Types.ObjectId(entry.ctx.performedBy),
    performedByRole: entry.ctx.performedByRole,
    permission: entry.ctx.permission,
    query: entry.query,
    oldValue: entry.oldValue,
    newValue: entry.newValue,
    reason: entry.reason ?? entry.ctx.reason,
    details: entry.details,
    amount: entry.amount,
    ipAddress: entry.ctx.ipAddress,
    deviceId: entry.ctx.deviceId,
    metadata: entry.metadata,
  });
}

export async function queryLogs(params: {
  appId?: string;
  userId?: string;
  action?: string;
  page?: number;
  limit?: number;
}) {
  const filter: Record<string, unknown> = {};
  if (params.appId) filter.appId = params.appId;
  if (params.userId) filter.userId = new Types.ObjectId(params.userId);
  if (params.action) filter.action = params.action;

  const page = params.page ?? 0;
  const limit = Math.min(params.limit ?? 50, 200);

  const [logs, total] = await Promise.all([
    CoreAuditLog.find(filter).sort({ createdAt: -1 }).skip(page * limit).limit(limit).lean(),
    CoreAuditLog.countDocuments(filter),
  ]);

  return {
    total,
    page,
    limit,
    logs: logs.map(formatAuditLog),
  };
}

export async function getStats() {
  const [total, byApp] = await Promise.all([
    CoreAuditLog.countDocuments(),
    CoreAuditLog.aggregate([
      { $group: { _id: '$appId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);

  return {
    total,
    byApp: byApp.map((r) => ({ appId: r._id as string, count: r.count as number })),
  };
}

function formatAuditLog(log: Record<string, unknown>) {
  return {
    id: (log._id as Types.ObjectId).toString(),
    appId: log.appId as string,
    userId: (log.userId as Types.ObjectId).toString(),
    action: log.action as string,
    entityType: log.entityType as string,
    entityId: log.entityId ? (log.entityId as Types.ObjectId).toString() : undefined,
    permission: log.permission as string | undefined,
    query: log.query as string | undefined,
    oldValue: log.oldValue as string | undefined,
    newValue: log.newValue as string | undefined,
    reason: log.reason as string | undefined,
    details: log.details as string | undefined,
    amount: log.amount as number | undefined,
    ipAddress: log.ipAddress as string | undefined,
    performedByRole: log.performedByRole as string,
    createdAt: (log.createdAt as Date).toISOString(),
  };
}

export const auditService = { log, queryLogs, getStats };
